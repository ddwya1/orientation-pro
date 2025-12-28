/**
 * 卡片导出器
 * 导出为 SillyTavern V2 格式，确保无 UTF-8 BOM
 */

import type { SillyTavernV2Card } from '../types';
import { exportCardAsPNG } from './pngExporter';

/**
 * 导出为 JSON 字符串（确保无 UTF-8 BOM）
 */
export function exportCard(card: SillyTavernV2Card): string {
  // 使用 JSON.stringify 生成 JSON 字符串，然后确保没有 BOM
  const jsonString = JSON.stringify(card, null, 2);
  
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
    const blob = exportCardAsPNG(originalPNG, card);
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

