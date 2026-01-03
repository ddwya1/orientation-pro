/**
 * 角色卡解析器
 * 支持 JSON 和 PNG 格式
 */

import { parsePNGCard } from './pngParser';
import type { SillyTavernV2Card } from '../types';

/**
 * 使用 Uint8Array 解码 base64 字符串（不使用 atob）
 */
function decodeBase64(base64: string): string {
  // Base64 字符表
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  
  // 计算 padding
  let padding = 0;
  if (base64.endsWith('==')) padding = 2;
  else if (base64.endsWith('=')) padding = 1;
  
  // 计算输出长度
  const binaryLength = Math.floor((base64.length * 3) / 4) - padding;
  const bytes = new Uint8Array(binaryLength);
  
  let p = 0;
  for (let i = 0; i < base64.length - padding; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)] || 0;
    const encoded2 = lookup[base64.charCodeAt(i + 1)] || 0;
    const encoded3 = i + 2 < base64.length ? (lookup[base64.charCodeAt(i + 2)] || 0) : 0;
    const encoded4 = i + 3 < base64.length ? (lookup[base64.charCodeAt(i + 3)] || 0) : 0;
    
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < binaryLength && i + 2 < base64.length - padding) {
      bytes[p++] = ((encoded2 << 4) & 0xF0) | (encoded3 >> 2);
    }
    if (p < binaryLength && i + 3 < base64.length - padding) {
      bytes[p++] = ((encoded3 << 6) & 0xC0) | encoded4;
    }
  }
  
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * 检查字符串是否是 base64 编码
 */
function isBase64(str: string): boolean {
  const trimmed = str.trim();
  
  // 如果字符串看起来像 JSON（以 { 或 [ 开头），则不是 base64
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false;
  
  // Base64 字符串通常只包含 A-Z, a-z, 0-9, +, /, = 字符
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(trimmed)) return false;
  
  // 长度应该合理（至少几个字符）且长度是 4 的倍数（可能有 padding）
  if (trimmed.length < 4) return false;
  
  // 尝试解析为 JSON，如果能解析说明不是 base64
  try {
    JSON.parse(trimmed);
    return false; // 能解析为 JSON，说明不是 base64
  } catch {
    // 不能解析为 JSON，且符合 base64 格式，可能是 base64
    // 检查长度（base64 长度应该是 4 的倍数，或者 padding 后是 4 的倍数）
    const len = trimmed.length;
    return len % 4 === 0 || (len % 4 === 1 && trimmed.endsWith('='));
  }
}

/**
 * 解析 JSON 格式的角色卡
 * @param jsonString JSON 字符串
 * @param isRetry 是否是重试（防止无限递归）
 */
export function parseJSONCard(jsonString: string, isRetry: boolean = false): SillyTavernV2Card {
  let textToParse = jsonString.trim();
  
  // 先尝试直接解析 JSON
  try {
    const parsed = JSON.parse(textToParse);
    
    // 验证是否为 SillyTavern V2 格式
    if (parsed.spec === 'chara_card_v2' && parsed.spec_version === '2.0') {
      return parsed as SillyTavernV2Card;
    }
    
    // 处理 V3 格式 (chara_card_v3)
    if (parsed.spec === 'chara_card_v3' && parsed.data) {
      // V3 格式的数据在 data 字段中，优先使用 data 字段的内容
      return {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: parsed.data,
      };
    }
    
    // 如果没有 spec 字段，但有 data 字段，优先使用 data
    if (parsed.data && (parsed.data.name || parsed.data.description || parsed.data.personality)) {
      return {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: parsed.data,
      };
    }
    
    // 如果不是标准格式，尝试直接包装顶层字段
    if (parsed.name || parsed.description || parsed.personality) {
      return {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: parsed,
      };
    }
    
    throw new Error('Invalid card format: cannot identify card structure');
  } catch (error) {
    // 如果 JSON 解析失败，尝试 base64 解码后再解析（只尝试一次，防止无限递归）
    if (error instanceof SyntaxError && !isRetry) {
      // 检查是否是 base64 编码
      if (isBase64(textToParse)) {
        try {
          const decoded = decodeBase64(textToParse);
          // 递归调用解析解码后的内容（标记为重试，防止再次解码）
          return parseJSONCard(decoded, true);
        } catch (decodeError) {
          // base64 解码也失败，抛出包含更多信息的错误
          throw new Error(`Invalid JSON (base64 encoded): ${error.message}`);
        }
      } else {
        throw new Error(`Invalid JSON syntax: ${error.message}`);
      }
    } else {
      // 非语法错误，可能是格式验证失败
      throw error instanceof Error ? error : new Error('Unknown error parsing character card');
    }
  }
}

/**
 * 从文件解析角色卡，返回卡片数据和原始文件信息
 */
export async function parseCardFile(file: File): Promise<{
  card: SillyTavernV2Card;
  originalFormat: 'png' | 'json';
  originalPNG?: ArrayBuffer;
  originalFileName: string;
}> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.png')) {
    const { json, originalPNG } = await parsePNGCard(file);
    const card = parseJSONCard(json);
    return {
      card,
      originalFormat: 'png',
      originalPNG,
      originalFileName: file.name,
    };
  } else if (fileName.endsWith('.json')) {
    const text = await file.text();
    const card = parseJSONCard(text);
    return {
      card,
      originalFormat: 'json',
      originalFileName: file.name,
    };
  } else {
    throw new Error('Unsupported file format. Please upload PNG or JSON files.');
  }
}

/**
 * 统计角色卡内容字数
 */
export function countCardWords(card: SillyTavernV2Card): number {
  const data = card.data;
  let count = 0;
  
  if (data.description) count += data.description.length;
  if (data.personality) count += data.personality.length;
  if (data.scenario) count += data.scenario.length;
  if (data.first_mes) count += data.first_mes.length;
  if (data.mes_example) count += data.mes_example.length;
  if (data.creator_notes) count += data.creator_notes.length;
  if (data.system_prompt) count += data.system_prompt.length;
  if (data.post_history_instructions) count += data.post_history_instructions.length;
  
  if (data.alternate_greetings) {
    count += data.alternate_greetings.join('').length;
  }
  
  if (data.character_book?.entries) {
    for (const entry of data.character_book.entries) {
      if (entry.content) count += entry.content.length;
      if (entry.keys) count += entry.keys.join('').length;
    }
  }
  
  return count;
}

