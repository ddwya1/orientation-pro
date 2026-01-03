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
  ) >>> 0; // 转换为无符号整数
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
  // 检查数据长度是否至少包含一个null分隔符
  if (data.length < 2) {
    throw new Error('Invalid tEXt chunk: data too short');
  }
  
  const decoder = new TextDecoder('utf-8');
  const nullIndex = data.indexOf(0);
  if (nullIndex === -1) {
    throw new Error('Invalid tEXt chunk: missing null separator');
  }

  // 确保关键字不为空
  if (nullIndex === 0) {
    throw new Error('Invalid tEXt chunk: keyword cannot be empty');
  }
  
  const keywordData = data.slice(0, nullIndex);
  const textData = data.slice(nullIndex + 1);

  // 确保文本数据不为空（至少有一个字节）
  if (textData.length === 0) {
    throw new Error('Invalid tEXt chunk: text data cannot be empty');
  }
  
  try {
    const keyword = decoder.decode(keywordData);
    const rawText = decoder.decode(textData);
    
    // 根据SillyTavern V2规范，chara块的内容是Base64编码的
    let decodedText = rawText;
    if (keyword.toLowerCase().includes('chara') || keyword.toLowerCase().includes('character')) {
      try {
        // 解码Base64内容
        decodedText = decodeURIComponent(escape(atob(rawText)));
      } catch (decodeError) {
        // 如果解码失败，使用原始文本（向后兼容）
        console.warn(`Failed to decode Base64 content for keyword ${keyword}:`, decodeError);
        decodedText = rawText;
      }
    }
    
    return { keyword, text: decodedText };
  } catch (e) {
    throw new Error(`Invalid tEXt chunk: failed to decode UTF-8 data - ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

/**
 * 解析 iTXt 块（国际化的文本块）
 */
function parseITXtChunk(data: Uint8Array): { keyword: string; text: string } {
  // 检查数据长度是否足够
  if (data.length < 6) {
    throw new Error('Invalid iTXt chunk: data too short');
  }
  
  const decoder = new TextDecoder('utf-8');
  let offset = 0;

  // 读取关键字（以 null 结尾）
  const keywordEnd = data.indexOf(0, offset);
  if (keywordEnd === -1) {
    throw new Error('Invalid iTXt chunk: missing keyword null separator');
  }
  
  // 确保关键字不为空
  if (keywordEnd === offset) {
    throw new Error('Invalid iTXt chunk: keyword cannot be empty');
  }
  
  try {
    const keyword = decoder.decode(data.slice(offset, keywordEnd));
    offset = keywordEnd + 1;

    // 检查是否有足够的数据用于压缩标志和方法
    if (offset + 1 >= data.length) {
      throw new Error('Invalid iTXt chunk: missing compression information');
    }
    
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
    if (offset >= data.length) {
      throw new Error('Invalid iTXt chunk: text data cannot be empty');
    }
    
          const textData = data.slice(offset);
          const rawText = decoder.decode(textData);
          
          // 根据SillyTavern V2规范，chara块的内容是Base64编码的
          let decodedText = rawText;
          if (keyword.toLowerCase().includes('chara') || keyword.toLowerCase().includes('character')) {
            try {
              // 解码Base64内容
              decodedText = decodeURIComponent(escape(atob(rawText)));
            } catch (decodeError) {
              // 如果解码失败，使用原始文本（向后兼容）
              console.warn(`Failed to decode Base64 content for keyword ${keyword}:`, decodeError);
              decodedText = rawText;
            }
          }
    
          return { keyword, text: decodedText };  } catch (e) {
    throw new Error(`Invalid iTXt chunk: failed to decode UTF-8 data - ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

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
        let iendFound = false;

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

          // 读取 CRC（4字节）
          const storedCRC = readUint32BE(buffer, offset);
          offset += 4;

          // 验证 CRC
          const typeAndData = new Uint8Array(4 + chunkData.length);
          typeAndData.set(chunkType, 0);
          typeAndData.set(chunkData, 4);
          const calculatedCRC = crc32(typeAndData);
          
          // 确保两者都是无符号 32 位整数进行比较
          const storedCRCUnsigned = storedCRC >>> 0;
          const calculatedCRCUnsigned = calculatedCRC >>> 0;
          
          if (storedCRCUnsigned !== calculatedCRCUnsigned) {
            const typeStr = String.fromCharCode(...chunkType);
            
            // 对于 chara 块，CRC 错误是致命的
            if (arrayEquals(chunkType, TEXT_CHUNK_TYPE)) {
              try {
                const decoder = new TextDecoder('utf-8');
                const nullIndex = chunkData.indexOf(0);
                if (nullIndex !== -1) {
                  const keyword = decoder.decode(chunkData.slice(0, nullIndex));
                  if (keyword.toLowerCase().includes('chara') || keyword.toLowerCase().includes('character')) {
                    reject(new Error('Character card chunk has invalid CRC'));
                    return;
                  }
                }
              } catch (e) {
                // 解析文本块时出错
              }
            }
          }

          // 检查是否是文本块
          if (arrayEquals(chunkType, TEXT_CHUNK_TYPE)) {
            try {
              const { keyword, text } = parseTEXtChunk(chunkData);
              chunks.push({ type: 'tEXt', data: chunkData, keyword, text });
            } catch (e) {
              // 解析 tEXt 块失败，跳过该块
            }
          } else if (arrayEquals(chunkType, ITXT_CHUNK_TYPE)) {
            try {
              const { keyword, text } = parseITXtChunk(chunkData);
              chunks.push({ type: 'iTXt', data: chunkData, keyword, text });
            } catch (e) {
              // 解析 iTXt 块失败，跳过该块
            }
          }

          // 如果遇到 IEND 块，结束
          const IEND_TYPE = new Uint8Array([0x49, 0x45, 0x4E, 0x44]);
          if (arrayEquals(chunkType, IEND_TYPE)) {
            iendFound = true;
            break;
          }
        }

        if (!iendFound) {
          reject(new Error('PNG file is missing IEND chunk'));
          return;
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

        // 验证 JSON 数据
        try {
          JSON.parse(charaChunk.text);
        } catch (e) {
          reject(new Error('Character card data is not valid JSON'));
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

