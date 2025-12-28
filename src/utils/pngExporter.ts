/**
 * PNG 卡片导出器
 * 将角色卡数据嵌入 PNG 文件，保留原始图像
 */

import type { SillyTavernV2Card } from '../types';

// PNG 文件签名
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// 块类型标识
const TEXT_CHUNK_TYPE = new Uint8Array([0x74, 0x45, 0x58, 0x74]); // "tEXt"
const ITXT_CHUNK_TYPE = new Uint8Array([0x69, 0x54, 0x58, 0x74]); // "iTXt"
const IEND_TYPE = new Uint8Array([0x49, 0x45, 0x4E, 0x44]); // "IEND"

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
  const encoder = new TextEncoder();
  const keywordBytes = encoder.encode(keyword);
  const textBytes = encoder.encode(text);
  
  // tEXt 格式：keyword + 0 + text
  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; // null separator
  chunkData.set(textBytes, keywordBytes.length + 1);
  
  // 创建完整块：长度(4) + 类型(4) + 数据 + CRC(4)
  const chunkType = TEXT_CHUNK_TYPE;
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
    (buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]
  );
}

/**
 * 将角色卡数据嵌入 PNG 文件
 * @param originalPNG 原始 PNG 文件的 ArrayBuffer
 * @param card 要嵌入的角色卡数据
 */
export function embedCardIntoPNG(originalPNG: ArrayBuffer, card: SillyTavernV2Card): Uint8Array {
  const buffer = new Uint8Array(originalPNG);
  
  // 验证 PNG 签名
  const signature = buffer.slice(0, 8);
  if (!arrayEquals(signature, PNG_SIGNATURE)) {
    throw new Error('Invalid PNG file signature');
  }
  
  // 将卡片数据转换为 JSON 字符串
  const jsonString = JSON.stringify(card);
  
  // 收集所有块，跳过旧的 chara/character 文本块
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
    
    const chunkData = buffer.slice(offset, offset + chunkLength);
    offset += chunkLength;
    const chunkCRC = buffer.slice(offset, offset + 4);
    offset += 4;
    
    // 如果是 tEXt 或 iTXt 块，检查是否是 chara/character 相关的，如果是则跳过
    if (arrayEquals(chunkType, TEXT_CHUNK_TYPE) || arrayEquals(chunkType, ITXT_CHUNK_TYPE)) {
      try {
        const decoder = new TextDecoder('utf-8');
        let keyword = '';
        
        if (arrayEquals(chunkType, TEXT_CHUNK_TYPE)) {
          // tEXt 格式：keyword + 0 + text
          const nullIndex = chunkData.indexOf(0);
          if (nullIndex !== -1) {
            keyword = decoder.decode(chunkData.slice(0, nullIndex));
          }
        } else {
          // iTXt 格式：keyword + 0 + compression flag + compression method + ...
          const nullIndex = chunkData.indexOf(0);
          if (nullIndex !== -1) {
            keyword = decoder.decode(chunkData.slice(0, nullIndex));
          }
        }
        
        // 如果是 chara 或 character 相关的关键字，跳过这个块
        if (keyword.toLowerCase().includes('chara') || keyword.toLowerCase().includes('character')) {
          continue;
        }
      } catch (e) {
        // 解析失败，保留这个块
      }
    }
    
    // 保留这个块（完整的：长度 + 类型 + 数据 + CRC）
    const fullChunk = buffer.slice(chunkStart, offset);
    chunks.push(fullChunk);
  }
  
  // 创建新的 tEXt 块，使用 "chara" 作为关键字
  const textChunk = createTEXtChunk('chara', jsonString);
  
  // 在 IEND 之前插入新的 tEXt 块
  const iendChunk = chunks.pop()!; // 移除最后一个 IEND 块
  chunks.push(textChunk); // 添加新的 tEXt 块
  chunks.push(iendChunk); // 添加回 IEND 块
  
  // 计算总长度
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  
  // 构建新的 PNG 文件
  const newPNG = new Uint8Array(totalLength);
  let writeOffset = 0;
  for (const chunk of chunks) {
    newPNG.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }
  
  return newPNG;
}

/**
 * 导出 PNG 格式的角色卡
 */
export function exportCardAsPNG(originalPNG: ArrayBuffer, card: SillyTavernV2Card): Blob {
  const pngData = embedCardIntoPNG(originalPNG, card);
  return new Blob([pngData], { type: 'image/png' });
}

