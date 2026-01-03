/**
 * PNG 卡片导出器
 * 将角色卡数据嵌入 PNG 文件，保留原始图像
 */

import type { SillyTavernV2Card } from '../types';

/**
 * 清理并规范化卡片数据，确保所有字段都正确
 */
function normalizeCardData(card: SillyTavernV2Card): SillyTavernV2Card {
  const normalized = JSON.parse(JSON.stringify(card));
  
  // 确保必需的 spec 和 spec_version 字段存在在顶层（SillyTavern V2 格式要求）
  // 删除data内部可能存在的spec字段，只保留顶层的
  if (normalized.data) {
    delete normalized.data.spec;
    delete normalized.data.spec_version;
  }
  normalized.spec = 'chara_card_v2';
  normalized.spec_version = '2.0';
  
  // 确保 character_book.entries 中的每个条目都有正确的字段
  if (normalized.data.character_book?.entries) {
    normalized.data.character_book.entries = normalized.data.character_book.entries.map((entry: any, idx: number) => {
      // 确保所有字段都存在，使用原始值或默认值
      return {
        ...entry,
        // 确保 keys 是数组
        keys: Array.isArray(entry.keys) ? entry.keys : (entry.keys ? [entry.keys] : []),
        // 确保 content 是字符串（保留原始内容，即使是空字符串也要保留）
        content: typeof entry.content === 'string' ? entry.content : (entry.content || ''),
        // 确保 enabled 存在
        enabled: entry.enabled !== undefined ? entry.enabled : true,
        // 确保 insertion_order 存在且连续
        insertion_order: entry.insertion_order !== undefined ? entry.insertion_order : idx,
        // 保留其他所有字段（如 comment, id, priority 等）
      };
    });
  }
  
  return normalized;
}

// PNG 文件签名
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// 块类型标识
const TEXT_CHUNK_TYPE = new Uint8Array([0x74, 0x45, 0x58, 0x74]); // "tEXt"
const ITXT_CHUNK_TYPE = new Uint8Array([0x69, 0x54, 0x58, 0x74]); // "iTXt"
const ZTXT_CHUNK_TYPE = new Uint8Array([0x7A, 0x54, 0x58, 0x74]); // "zTXt"
const IEND_TYPE = new Uint8Array([0x49, 0x45, 0x4E, 0x44]); // "IEND"
const EXIF_CHUNK_TYPE = new Uint8Array([0x65, 0x58, 0x49, 0x66]); // "eXIf"

/**
 * 计算 CRC32 校验和
 */
function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
    table[i] = crc;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * 写入 Uint32 Big-Endian
 */
function writeUint32BE(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = (value >>> 24) & 0xFF;
  buffer[offset + 1] = (value >>> 16) & 0xFF;
  buffer[offset + 2] = (value >>> 8) & 0xFF;
  buffer[offset + 3] = value & 0xFF;
}

/**
 * 比较两个 Uint8Array 是否相等
 */
function arrayEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * 创建 tEXt 块
 */
function createTEXtChunk(keyword: string, text: string): Uint8Array {
  // 确保关键字符合 PNG 规范（79 个字符以内，无特殊字符）
  if (keyword.length > 79) {
    keyword = keyword.substring(0, 79);
  }
  
  // 根据SillyTavern V2规范，JSON内容需要进行Base64编码
  const encodedText = btoa(unescape(encodeURIComponent(text)));
  
  const encoder = new TextEncoder();
  const keywordBytes = encoder.encode(keyword);
  const textBytes = encoder.encode(encodedText);
  
  // tEXt 格式：keyword + 0 + text
  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; // null separator
  chunkData.set(textBytes, keywordBytes.length + 1);
  
  // 创建完整块：长度(4) + 类型(4) + 数据 + CRC(4)
  const chunkType = TEXT_CHUNK_TYPE;
  
  // CRC 计算：基于块类型（4字节）+ 块数据
  // PNG 规范：CRC 计算包括块类型和块数据，不包括长度字段
  const typeAndData = new Uint8Array(4 + chunkData.length);
  typeAndData.set(chunkType, 0);
  typeAndData.set(chunkData, 4);
  
  const crc = crc32(typeAndData);
  
  // 构建完整块
  const chunk = new Uint8Array(4 + 4 + chunkData.length + 4);
  writeUint32BE(chunk, 0, chunkData.length); // 写入长度（Big-Endian）
  chunk.set(chunkType, 4); // 写入类型
  chunk.set(chunkData, 8); // 写入数据
  writeUint32BE(chunk, 8 + chunkData.length, crc); // 写入 CRC（Big-Endian）
  
  return chunk;
}

/**
 * 创建 iTXt 块（国际化文本块，支持 UTF-8）
 * iTXt 格式：keyword + 0 + compression flag + compression method + language tag + 0 + translated keyword + 0 + text
 * 为了简化，我们使用未压缩格式（compression flag = 0）
 */
function createITXtChunk(keyword: string, text: string): Uint8Array {
  const encoder = new TextEncoder();
  const keywordBytes = encoder.encode(keyword);
  const textBytes = encoder.encode(text);
  
  // iTXt 格式（未压缩）：
  // keyword + 0 + compression flag(0) + compression method(0) + language tag + 0 + translated keyword + 0 + text
  // 为了简化，language tag 和 translated keyword 都为空
  const chunkData = new Uint8Array(
    keywordBytes.length + 1 + // keyword + null
    1 + // compression flag (0 = uncompressed)
    1 + // compression method (0 = deflate, but we use 0 for uncompressed)
    1 + // language tag (empty, just null)
    1 + // translated keyword (empty, just null)
    textBytes.length // text
  );
  
  let offset = 0;
  chunkData.set(keywordBytes, offset);
  offset += keywordBytes.length;
  chunkData[offset++] = 0; // null separator after keyword
  chunkData[offset++] = 0; // compression flag (uncompressed)
  chunkData[offset++] = 0; // compression method
  chunkData[offset++] = 0; // language tag (empty)
  chunkData[offset++] = 0; // translated keyword (empty)
  chunkData.set(textBytes, offset);
  
  // 创建完整块：长度(4) + 类型(4) + 数据 + CRC(4)
  const chunkType = ITXT_CHUNK_TYPE;
  const typeAndData = new Uint8Array(4 + chunkData.length);
  typeAndData.set(chunkType, 0);
  typeAndData.set(chunkData, 4);
  
  const crc = crc32(typeAndData);
  
  const chunk = new Uint8Array(4 + 4 + chunkData.length + 4);
  writeUint32BE(chunk, 0, chunkData.length);
  chunk.set(typeAndData, 4);
  writeUint32BE(chunk, 4 + 4 + chunkData.length, crc);
  
  return chunk;
}

/**
 * 读取 Uint32 Big-Endian
 */
function readUint32BE(buffer: Uint8Array, offset: number): number {
  return (
    ((buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]) >>> 0
  );
}

/**
 * 将角色卡数据嵌入 PNG 文件
 * @param originalPNG 原始 PNG 文件的 ArrayBuffer
 * @param card 要嵌入的角色卡数据
 */
export function embedCardIntoPNG(originalPNG: ArrayBuffer, card: SillyTavernV2Card, preserveOtherTextChunks: boolean = false): Uint8Array {
  const buffer = new Uint8Array(originalPNG);
  
  // 临时调试：输出传入的卡片数据
  // 移除调试代码以避免潜在的兼容性问题
  
  // 验证 PNG 签名
  const signature = buffer.slice(0, 8);
  if (!arrayEquals(signature, PNG_SIGNATURE)) {
    throw new Error('Invalid PNG file signature');
  }
  
  // 规范化卡片数据，确保所有字段都正确
  const normalizedCard = normalizeCardData(card);
  
  // 将卡片数据转换为 JSON 字符串
  // 使用紧凑格式，确保没有额外的空格影响数据
  let jsonString: string;
  try {
    // 确保 JSON 格式完全符合 SillyTavern 要求
    // SillyTavern V2 格式要求：
    // - spec: 'chara_card_v2'
    // - spec_version: '2.0'
    // - 所有字段使用正确的数据类型
    // - 不包含 null 或 undefined 值（使用空字符串或空数组替代）
    
    // 深度清理 JSON 数据，但保留SillyTavern需要的字段结构
    function cleanJSON(obj: any): any {
      if (obj === null) return null;  // 保持 null 值
      if (obj === undefined) return null;  // 将 undefined 转换为 null
      if (typeof obj === 'string') return obj;
      if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
      if (Array.isArray(obj)) return obj.map(cleanJSON);
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = cleanJSON(obj[key]);
            cleaned[key] = value;  // 保留所有字段，即使是 null
          }
        }
        return cleaned;
      }
      return obj;
    }
    
    const cleanedCard = cleanJSON(normalizedCard);
    jsonString = JSON.stringify(cleanedCard, null, 0); // 使用紧凑格式
    
    // 验证 JSON 字符串格式
    JSON.parse(jsonString);
    
  } catch (error) {
    throw new Error('JSON 格式验证失败: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
  
  // 收集所有块，跳过所有文本块（tEXt 和 iTXt），只保留图像数据块
  // 这样可以确保没有任何旧的字符卡数据残留
  const chunks: Uint8Array[] = [];
  let offset = 8; // 跳过 PNG 签名
  
  // 添加 PNG 签名
  chunks.push(signature);
  
  while (offset < buffer.length) {
    const chunkStart = offset;
    const chunkLength = readUint32BE(buffer, offset);
    offset += 4;
    
    const chunkType = buffer.slice(offset, offset + 4);
    offset += 4;
    
    // 如果是 IEND 块，记录并跳出
    if (arrayEquals(chunkType, IEND_TYPE)) {
      // IEND 块：长度(4) + 类型(4) + 数据(0) + CRC(4) = 12 字节
      const iendChunk = buffer.slice(chunkStart, chunkStart + 12);
      chunks.push(iendChunk);
      break;
    }
    
    // 验证块长度是否合理，防止溢出
    if (offset + chunkLength + 4 > buffer.length) {
      // 块长度不合理，跳过该块
      break;
    }
    
    const chunkData = buffer.slice(offset, offset + chunkLength);
    offset += chunkLength;
    const chunkCRC = buffer.slice(offset, offset + 4);
    offset += 4;
    
    // 检查是否是字符卡相关块，包括 tEXt、iTXt、zTXt 和 eXIf 块
    let isCharacterChunk = false;
    const isTextChunk = arrayEquals(chunkType, TEXT_CHUNK_TYPE) ||
                        arrayEquals(chunkType, ITXT_CHUNK_TYPE) ||
                        arrayEquals(chunkType, ZTXT_CHUNK_TYPE);
    
    // 如果不保留其他文本块，且当前是文本块，直接标记为需要移除
    if (!preserveOtherTextChunks && isTextChunk) {
      continue;
    }
    
    // 检查 tEXt, iTXt 或 zTXt 块
    if (isTextChunk) {
      try {
        const decoder = new TextDecoder('utf-8');
        let keyword = '';
        
        // 所有文本块（tEXt, iTXt, zTXt）都以 Keyword + Null 开始
        const nullIndex = chunkData.indexOf(0);
        if (nullIndex !== -1) {
          keyword = decoder.decode(chunkData.slice(0, nullIndex));
        }
        
        const lowerKeyword = keyword.toLowerCase().trim();
        isCharacterChunk =
          lowerKeyword === 'chara' ||
          lowerKeyword === 'character' ||
          lowerKeyword.startsWith('chara') ||
          lowerKeyword.startsWith('character') ||
          lowerKeyword.includes('chara') ||
          lowerKeyword.includes('character');
      } catch (e) {
        // 解析失败，跳过
        isCharacterChunk = false;
      }
    }
    // 检查 eXIf 块 - 也可能包含字符卡数据
    else if (arrayEquals(chunkType, EXIF_CHUNK_TYPE)) {
      // eXIf 块可能包含旧的字符卡数据，将其视为字符卡块处理
      isCharacterChunk = true;
    }
    
    if (isCharacterChunk) {
      // 跳过字符卡相关块（包括tEXt、iTXt、zTXt和eXIf），不添加到 chunks 中
      continue;
    }
    
    // 保留所有非字符卡块（如图像数据、元数据等）
    const fullChunk = buffer.slice(chunkStart, offset);
    chunks.push(fullChunk);
  }
  
  // 再次验证：确保没有遗漏任何 character 相关的块
  // 如果 !preserveOtherTextChunks，前面的循环已经移除了所有文本块，这里主要处理 preserveOtherTextChunks=true 的情况
  let foundCharacterChunks = 0;
  for (let i = 1; i < chunks.length; i++) { // 跳过 PNG 签名
    const chunk = chunks[i];
    if (chunk.length >= 8) {
      const chunkType = chunk.slice(4, 8);
      if (arrayEquals(chunkType, TEXT_CHUNK_TYPE) ||
          arrayEquals(chunkType, ITXT_CHUNK_TYPE) ||
          arrayEquals(chunkType, ZTXT_CHUNK_TYPE)) {
        try {
          const chunkData = chunk.slice(12, chunk.length - 4); // 跳过长度(4) + 类型(4) 和 CRC(4)
          const decoder = new TextDecoder('utf-8');
          const nullIndex = chunkData.indexOf(0);
          if (nullIndex !== -1) {
            const keyword = decoder.decode(chunkData.slice(0, nullIndex));
            const lowerKeyword = keyword.toLowerCase().trim();
            if (lowerKeyword.includes('chara') || lowerKeyword.includes('character')) {
              foundCharacterChunks++;
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
  
  if (foundCharacterChunks > 0) {
    // 移除这些遗漏的块
    const filteredChunks = [chunks[0]]; // 保留 PNG 签名
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length >= 8) {
        const chunkType = chunk.slice(4, 8);
        if (arrayEquals(chunkType, TEXT_CHUNK_TYPE) ||
            arrayEquals(chunkType, ITXT_CHUNK_TYPE) ||
            arrayEquals(chunkType, ZTXT_CHUNK_TYPE)) {
          try {
            const chunkData = chunk.slice(12, chunk.length - 4);
            const decoder = new TextDecoder('utf-8');
            const nullIndex = chunkData.indexOf(0);
            if (nullIndex !== -1) {
              const keyword = decoder.decode(chunkData.slice(0, nullIndex));
              const lowerKeyword = keyword.toLowerCase().trim();
              if (lowerKeyword.includes('chara') || lowerKeyword.includes('character')) {
                continue; // 跳过这个块
              }
            }
          } catch (e) {
            // 保留无法解析的块
          }
        }
      }
      filteredChunks.push(chunk);
    }
    chunks.length = 0;
    chunks.push(...filteredChunks);
  }
  
  // 创建新的字符卡数据块
  // 使用 "chara" 作为 keyword（SillyTavern 标准格式）
  // 注意：多个 chara 块可能导致 SillyTavern 读取错误或文件损坏
  const encoder = new TextEncoder();
  const jsonBytesLength = encoder.encode(jsonString).length;
  
  // 兼容性检查：确保数据大小合理
  const maxChunkSize = Math.pow(2, 31) - 1; // PNG 规范限制块大小为 2^31 - 1 字节
  if (jsonBytesLength > maxChunkSize) {
    throw new Error('JSON 数据过大，无法嵌入到单个 PNG 块中');
  }
  
  // 创建字符卡数据块 - 使用 tEXt 块以确保与SillyTavern的最大兼容性
  const characterChunk = createTEXtChunk('chara', jsonString);
  
  // 验证创建的块
  const chunkData = characterChunk.slice(8, 8 + readUint32BE(characterChunk, 0));
  const nullIndex = chunkData.indexOf(0);
  if (nullIndex === -1) {
    throw new Error('chara 块格式错误');
  }
  
  const storedKeyword = new TextDecoder().decode(chunkData.slice(0, nullIndex));
  if (storedKeyword !== 'chara') {
    throw new Error('关键字不匹配');
  }
  
  // 在 IEND 之前插入新的块
  
  // 找到IEND块的位置
  let iendIndex = -1;
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i].length >= 8) {
      const chunkType = String.fromCharCode(...chunks[i].slice(4, 8));
      if (chunkType === 'IEND') {
        iendIndex = i;
        break;
      }
    }
  }
  
  if (iendIndex === -1) {
    throw new Error('PNG文件中找不到IEND块');
  }
  
  // 在IEND之前插入chara块（而不是pop再添加）
  chunks.splice(iendIndex, 0, characterChunk);
  
  // 计算总长度
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  
  // 构建新的 PNG 文件
  const newPNG = new Uint8Array(totalLength);
  let writeOffset = 0;
  for (const chunk of chunks) {
    newPNG.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }
  
  // 验证 PNG 文件格式
  if (newPNG.length < 8) {
    throw new Error('PNG 文件太短');
  }
  
  // 验证 PNG 签名
  const newSignature = newPNG.slice(0, 8);
  if (!arrayEquals(newSignature, PNG_SIGNATURE)) {
    throw new Error('PNG 签名无效');
  }
  
  // 验证最后一个块是 IEND
  const lastChunkType = newPNG.slice(newPNG.length - 8, newPNG.length - 4);
  if (!arrayEquals(lastChunkType, IEND_TYPE)) {
    throw new Error('PNG 文件必须以 IEND 块结尾');
  }
  
  // 最终验证：读取并检查嵌入的JSON数据
  
  // 验证所有块的完整性
  let verifyOffset = 8;
  let charaFound = false;
  let blockIndex = 0;
  let hasIHDR = false;
  let hasIDAT = false;
  let hasIEND = false;
  
  while (verifyOffset < newPNG.length) {
    if (verifyOffset + 8 > newPNG.length) break; // 至少需要 8 字节（长度+类型）
    
    const chunkLength = readUint32BE(newPNG, verifyOffset);
    verifyOffset += 4;
    const chunkType = newPNG.slice(verifyOffset, verifyOffset + 4);
    const chunkTypeStr = String.fromCharCode(...chunkType);
    verifyOffset += 4;
    
    if (chunkTypeStr === 'IHDR') hasIHDR = true;
    if (chunkTypeStr === 'IDAT') hasIDAT = true;
    if (chunkTypeStr === 'IEND') {
      hasIEND = true;
      // IEND块之后就结束
      break;
    }
    
    if (arrayEquals(chunkType, TEXT_CHUNK_TYPE)) {
      const chunkData = newPNG.slice(verifyOffset, verifyOffset + chunkLength);
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx !== -1) {
        const keyword = new TextDecoder().decode(chunkData.slice(0, nullIdx));
        if (keyword === 'chara') {
          charaFound = true;
          const jsonText = new TextDecoder().decode(chunkData.slice(nullIdx + 1));
          try {
            const parsed = JSON.parse(jsonText);
          } catch (e) {
            // JSON解析失败，但不抛出错误，仅记录
          }
        }
      }
    }
    
    verifyOffset += chunkLength + 4; // 跳过数据和CRC
    blockIndex++;
  }
  
  if (!charaFound) {
    // 警告：最终PNG中未找到chara块
  }
  if (!hasIHDR || !hasIDAT || !hasIEND) {
    // 警告：PNG缺少必需的块
  }
  
  return newPNG;
}

/**
 * 导出 PNG 格式的角色卡
 */
export function exportCardAsPNG(originalPNG: ArrayBuffer, card: SillyTavernV2Card, preserveOtherTextChunks: boolean = false): Blob {
  try {
    const pngData = embedCardIntoPNG(originalPNG, card, preserveOtherTextChunks);
    // 使用 as any 绕过 SharedArrayBuffer 类型兼容性问题
    return new Blob([pngData as any], { type: 'image/png' });
  } catch (error) {
    throw error;
  }
}

