/**
 * PNG 卡片解析器
 * 使用 Uint8Array + TextDecoder 确保中文、特殊符号、Emoji 100% 还原
 */

// PNG 文件签名
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// 块类型标识
const TEXT_CHUNK_TYPE = new Uint8Array([0x74, 0x45, 0x58, 0x74]); // "tEXt"
const ITXT_CHUNK_TYPE = new Uint8Array([0x69, 0x54, 0x58, 0x74]); // "iTXt"

interface ChunkInfo {
  type: string;
  data: Uint8Array;
  keyword: string;
  text: string;
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
 * 解析 tEXt 块
 */
function parseTEXtChunk(data: Uint8Array): { keyword: string; text: string } {
  const decoder = new TextDecoder('utf-8');
  const nullIndex = data.indexOf(0);
  if (nullIndex === -1) {
    throw new Error('Invalid tEXt chunk: missing null separator');
  }

  const keywordData = data.slice(0, nullIndex);
  const textData = data.slice(nullIndex + 1);

  const keyword = decoder.decode(keywordData);
  const text = decoder.decode(textData);

  return { keyword, text };
}

/**
 * 解析 iTXt 块（国际化的文本块）
 */
function parseITXtChunk(data: Uint8Array): { keyword: string; text: string } {
  const decoder = new TextDecoder('utf-8');
  let offset = 0;

  // 读取关键字（以 null 结尾）
  const keywordEnd = data.indexOf(0, offset);
  if (keywordEnd === -1) {
    throw new Error('Invalid iTXt chunk: missing keyword null separator');
  }
  const keyword = decoder.decode(data.slice(offset, keywordEnd));
  offset = keywordEnd + 1;

  // 跳过压缩标志（1字节）
  offset += 1;

  // 跳过压缩方法（1字节）
  offset += 1;

  // 跳过语言标签（以 null 结尾）
  const langEnd = data.indexOf(0, offset);
  if (langEnd !== -1) {
    offset = langEnd + 1;
  }

  // 跳过翻译后的关键字（以 null 结尾）
  const transKeywordEnd = data.indexOf(0, offset);
  if (transKeywordEnd !== -1) {
    offset = transKeywordEnd + 1;
  }

  // 剩余部分是实际文本内容
  const textData = data.slice(offset);
  const text = decoder.decode(textData);

  return { keyword, text };
}

/**
 * 解析 PNG 文件并返回 JSON 数据和原始 ArrayBuffer
 */
export function parsePNGCard(file: File): Promise<{ json: string; originalPNG: ArrayBuffer }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error('Failed to read file'));
          return;
        }

        const buffer = new Uint8Array(arrayBuffer);

        // 验证 PNG 签名
        const signature = buffer.slice(0, 8);
        if (!arrayEquals(signature, PNG_SIGNATURE)) {
          reject(new Error('Invalid PNG file signature'));
          return;
        }

        const chunks: ChunkInfo[] = [];
        let offset = 8; // 跳过 PNG 签名

        // 遍历所有块
        while (offset < buffer.length) {
          // 读取块长度（4字节，Big-Endian）
          const chunkLength = readUint32BE(buffer, offset);
          offset += 4;

          // 读取块类型（4字节）
          const chunkType = buffer.slice(offset, offset + 4);
          offset += 4;

          // 读取块数据
          const chunkData = buffer.slice(offset, offset + chunkLength);
          offset += chunkLength;

          // 跳过 CRC（4字节）
          offset += 4;

          // 检查是否是文本块
          if (arrayEquals(chunkType, TEXT_CHUNK_TYPE)) {
            const { keyword, text } = parseTEXtChunk(chunkData);
            chunks.push({ type: 'tEXt', data: chunkData, keyword, text });
          } else if (arrayEquals(chunkType, ITXT_CHUNK_TYPE)) {
            const { keyword, text } = parseITXtChunk(chunkData);
            chunks.push({ type: 'iTXt', data: chunkData, keyword, text });
          }

          // 如果遇到 IEND 块，结束
          const IEND_TYPE = new Uint8Array([0x49, 0x45, 0x4E, 0x44]);
          if (arrayEquals(chunkType, IEND_TYPE)) {
            break;
          }
        }

        // 查找 chara 或 character 相关的文本块
        const charaChunk = chunks.find(
          (chunk) =>
            chunk.keyword.toLowerCase().includes('chara') ||
            chunk.keyword.toLowerCase().includes('character')
        );

        if (!charaChunk) {
          reject(new Error('No character card data found in PNG chunks'));
          return;
        }

        resolve({ json: charaChunk.text, originalPNG: arrayBuffer });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse PNG'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

