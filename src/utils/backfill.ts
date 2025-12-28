/**
 * 回填逻辑
 * 从 AI 返回的内容中提取并回填到原始卡片数据
 */

import type { SillyTavernV2Card, ConversionTask } from '../types';

/**
 * 提取标题和内容的正则表达式
 * 匹配格式：### 【标题名[^】]*】
 */
const TITLE_REGEX = /###\s*【([^】]+)】/g;

/**
 * 过滤 AI 废话，仅提取标记内容
 */
function extractMarkedContent(result: string): Map<string, string> {
  const contentMap = new Map<string, string>();
  const matches = Array.from(result.matchAll(TITLE_REGEX));
  
  if (matches.length === 0) {
    // 如果没有找到标题标记，返回整个内容作为后备
    return contentMap;
  }
  
  // 为每个匹配创建范围
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : result.length;
    
    // 提取标题后的内容（去除前导空白）
    let content = result.slice(startIndex, endIndex).trim();
    
    // 移除可能的后续标题标记（如果 AI 重复输出了标题）
    content = content.replace(/^###\s*【[^】]+】\s*/m, '');
    
    contentMap.set(title, content);
  }
  
  return contentMap;
}

/**
 * 标题到字段名的映射
 */
const TITLE_TO_FIELD_MAP: Record<string, string> = {
  '角色描述': 'description',
  '性格设定': 'personality',
  '场景设定': 'scenario',
  '系统提示词': 'system_prompt',
  '开场白': 'first_mes',
  '备用开场白': 'alternate_greetings',
  '世界书': 'character_book',
};

/**
 * 处理备用开场白（可能包含序号）
 */
function handleAlternateGreetings(contentMap: Map<string, string>): string[] {
  const greetings: string[] = [];
  
  // 查找所有备用开场白条目
  const greetingEntries: Array<{ index: number; content: string }> = [];
  
  for (const [title, content] of contentMap.entries()) {
    const greetingMatch = title.match(/备用开场白(\d+)/);
    if (greetingMatch) {
      const index = parseInt(greetingMatch[1], 10);
      greetingEntries.push({ index, content });
    }
  }
  
  // 按索引排序
  greetingEntries.sort((a, b) => a.index - b.index);
  
  // 提取内容
  for (const entry of greetingEntries) {
    greetings.push(entry.content.trim());
  }
  
  // 如果没有找到带序号的，尝试直接使用"备用开场白"标题
  if (greetings.length === 0) {
    const directGreeting = contentMap.get('备用开场白');
    if (directGreeting) {
      // 按双换行符分割
      const lines = directGreeting.split(/\n\n+/);
      greetings.push(...lines.map(line => line.trim()).filter(line => line));
    }
  }
  
  return greetings;
}

/**
 * 处理世界书条目
 */
function handleWorldBookEntries(contentMap: Map<string, string>): Array<{ keys: string[]; content: string }> {
  const entries: Array<{ keys: string[]; content: string }> = [];
  
  // 查找所有世界书条目
  const worldBookEntries: Array<{ index: number; keys: string[]; content: string }> = [];
  
  for (const [title, content] of contentMap.entries()) {
    const entryMatch = title.match(/世界书条目(\d+)/);
    if (entryMatch) {
      const index = parseInt(entryMatch[1], 10);
      
      // 提取关键词（可能在内容开头）
      let keys: string[] = [];
      let actualContent = content;
      
      const keyMatch = content.match(/\*\*关键词\*\*:\s*(.+?)(?:\n|$)/);
      if (keyMatch) {
        const keyText = keyMatch[1].trim();
        keys = keyText.split(',').map(k => k.trim()).filter(k => k);
        actualContent = content.replace(/\*\*关键词\*\*:.+?(?:\n|$)/, '').trim();
      }
      
      worldBookEntries.push({ index, keys, content: actualContent });
    }
  }
  
  // 按索引排序
  worldBookEntries.sort((a, b) => a.index - b.index);
  
  // 转换为所需格式
  for (const entry of worldBookEntries) {
    entries.push({
      keys: entry.keys,
      content: entry.content,
    });
  }
  
  return entries;
}

/**
 * 回填任务结果到卡片
 */
export function backfillTaskResult(
  card: SillyTavernV2Card,
  task: ConversionTask,
  result: string
): SillyTavernV2Card {
  // 创建卡片副本
  const updatedCard: SillyTavernV2Card = JSON.parse(JSON.stringify(card));
  
  // 提取标记内容
  const contentMap = extractMarkedContent(result);
  
  // 为每个字段回填内容
  for (const field of task.fields) {
    const fieldTitle = getFieldTitleForField(field);
    
    if (field === 'alternate_greetings') {
      const greetings = handleAlternateGreetings(contentMap);
      if (greetings.length > 0) {
        // 对于分段任务，每个任务的结果包含该批次的所有条目
        // 由于每个任务都是独立处理的，直接替换即可
        // （在实际使用中，应该按任务顺序依次回填，每个任务覆盖对应范围）
        updatedCard.data.alternate_greetings = greetings;
      }
    } else if (field === 'character_book') {
      const entries = handleWorldBookEntries(contentMap);
      if (entries.length > 0) {
        if (!updatedCard.data.character_book) {
          updatedCard.data.character_book = { entries: [] };
        }
        // 对于分段任务，每个任务的结果包含该批次的所有条目
        // 直接替换对应范围的条目
        updatedCard.data.character_book.entries = entries.map((entry, idx) => ({
          keys: entry.keys,
          content: entry.content,
          enabled: true,
          insertion_order: idx,
        }));
      }
    } else {
      // 直接字段回填
      const content = contentMap.get(fieldTitle);
      if (content !== undefined) {
        (updatedCard.data as any)[field] = content;
      }
    }
  }
  
  return updatedCard;
}

/**
 * 获取字段对应的标题
 */
function getFieldTitleForField(field: string): string {
  const titleMap: Record<string, string> = {
    description: '角色描述',
    personality: '性格设定',
    scenario: '场景设定',
    system_prompt: '系统提示词',
    first_mes: '开场白',
    mes_example: '消息示例',
    creator_notes: '创作者笔记',
    post_history_instructions: '历史后处理',
    alternate_greetings: '备用开场白',
    character_book: '世界书',
  };
  return titleMap[field] || field;
}

