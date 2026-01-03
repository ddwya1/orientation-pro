/**
 * 卡片导出器
 * 导出为 SillyTavern V2 格式，确保无 UTF-8 BOM
 */

import type { SillyTavernV2Card } from '../types';
import { exportCardAsPNG } from './pngExporter';

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

/**
 * 导出为 JSON 字符串（确保无 UTF-8 BOM）
 */
export function exportCard(card: SillyTavernV2Card): string {
  // 规范化卡片数据
  const normalizedCard = normalizeCardData(card);
  
  // 使用 JSON.stringify 生成 JSON 字符串，然后确保没有 BOM
  const jsonString = JSON.stringify(normalizedCard, null, 0); // 使用紧凑格式
  
  // 检查并移除 UTF-8 BOM（如果存在）
  // UTF-8 BOM 是 0xEF 0xBB 0xBF
  if (jsonString.charCodeAt(0) === 0xFEFF) {
    return jsonString.slice(1);
  }
  
  return jsonString;
}

/**
 * 导出为 Blob（用于下载）
 */
export function exportCardAsBlob(card: SillyTavernV2Card): Blob {
  const jsonString = exportCard(card);
  // 明确指定 UTF-8 编码，但不添加 BOM
  return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
}

/**
 * 下载卡片文件（JSON 格式）
 */
export function downloadCard(card: SillyTavernV2Card, filename: string = 'character_card.json'): void {
  const blob = exportCardAsBlob(card);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 下载卡片文件（根据原始格式）
 */
export function downloadCardByFormat(
  card: SillyTavernV2Card,
  format: 'png' | 'json',
  originalPNG?: ArrayBuffer,
  originalFileName?: string
): void {
  if (format === 'png' && originalPNG) {
    // 导出 PNG 格式
    // 强制不保留其他文本块，以确保只有新的字符数据
    const blob = exportCardAsPNG(originalPNG, card, false);
    const filename = originalFileName?.replace(/\.(png|json)$/i, '.png') ||
                     `${card.data.name || 'character'}_converted.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // 导出 JSON 格式
    const filename = originalFileName?.replace(/\.(png|json)$/i, '.json') || 
                     `${card.data.name || 'character'}_converted.json`;
    downloadCard(card, filename);
  }
}

