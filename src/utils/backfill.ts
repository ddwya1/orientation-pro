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
    // 如果没有找到标题标记，尝试将整个内容作为"原始内容"或"世界书"
    if (result.trim()) {
      // 检查是否包含"世界书条目"字样
      if (result.includes('世界书条目')) {
        contentMap.set('世界书', result.trim());
      } else {
        contentMap.set('原始内容', result.trim());
      }
    }
    return contentMap;
  }
  
  // 为每个匹配创建范围
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : result.length;
    
    // 提取标题后的内容（去除前导空白）
    let content = result.slice(startIndex, endIndex);
    
    // 移除前导空白行
    content = content.replace(/^\s*\n+/, '');
    
    // 移除尾随空白行
    content = content.replace(/\n+\s*$/, '');
    
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
 * 返回带索引的条目数组，索引是1-based的（用于匹配任务中的标题）
 */
function handleWorldBookEntries(contentMap: Map<string, string>, taskRange?: { start: number; end: number }): Array<{ index: number; keys: string[]; content: string }> {
  const entries: Array<{ index: number; keys: string[]; content: string }> = [];
  
  // 先尝试从标题标记中提取
  for (const [title, content] of contentMap.entries()) {
    const entryMatch = title.match(/世界书条目(\d+)/);
    if (entryMatch) {
      const index = parseInt(entryMatch[1], 10); // 1-based 索引
      
      // 提取关键词（可能在内容开头）
      let keys: string[] = [];
      let actualContent = content;
      
      // 先提取关键词行（可能在开头）
      const keyMatch = content.match(/\*\*关键词\*\*:\s*(.+?)(?:\n|$)/);
      if (keyMatch) {
        const keyText = keyMatch[1].trim();
        keys = keyText.split(',').map(k => k.trim()).filter(k => k);
        // 移除关键词行（包括前后的空白），但保留后续内容
        actualContent = content.replace(/\*\*关键词\*\*:\s*.+?(?:\n|$)/, '').trim();
      }
      
      // 保留二级标题（如 ### 巫回雁的过往），因为这是内容的一部分
      // 只移除重复的世界书条目标题标记（如果存在）
      actualContent = actualContent.replace(/^###\s*【世界书条目\d+】\s*/m, '').trim();
      
      // 确保内容不为空
      if (!actualContent) {
        actualContent = content.trim();
      }
      
      entries.push({ index, keys, content: actualContent });
    }
  }
  
  // 如果没有找到带标题标记的条目，但有任务范围，尝试直接使用内容
  if (entries.length === 0 && taskRange) {
    // 尝试从"世界书"、"世界观/知识库"或"原始内容"中提取
    const worldBookContent = contentMap.get('世界书') || 
                            contentMap.get('世界观/知识库') || 
                            contentMap.get('原始内容');
    if (worldBookContent) {
      // 如果只有一个条目在范围内，直接使用整个内容
      if (taskRange.start === taskRange.end) {
        const index = taskRange.start;
        let keys: string[] = [];
        let actualContent = worldBookContent.trim();
        
        const keyMatch = actualContent.match(/\*\*关键词\*\*:\s*(.+?)(?:\n|$)/);
        if (keyMatch) {
          const keyText = keyMatch[1].trim();
          keys = keyText.split(',').map(k => k.trim()).filter(k => k);
          actualContent = actualContent.replace(/\*\*关键词\*\*:.+?(?:\n|$)/, '').trim();
        }
        
        entries.push({ index, keys, content: actualContent });
      } else {
        // 多个条目，尝试按条目分割（可能是多个条目用双换行符分隔）
        const parts = worldBookContent.split(/\n\n+/);
        parts.forEach((part, idx) => {
          if (part.trim()) {
            const index = taskRange.start + idx;
            if (index <= taskRange.end) {
              let keys: string[] = [];
              let actualContent = part.trim();
              
              const keyMatch = actualContent.match(/\*\*关键词\*\*:\s*(.+?)(?:\n|$)/);
              if (keyMatch) {
                const keyText = keyMatch[1].trim();
                keys = keyText.split(',').map(k => k.trim()).filter(k => k);
                actualContent = actualContent.replace(/\*\*关键词\*\*:.+?(?:\n|$)/, '').trim();
              }
              
              entries.push({ index, keys, content: actualContent });
            }
          }
        });
      }
    }
  }
  
  // 按索引排序
  entries.sort((a, b) => a.index - b.index);
  
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
        // 如果有 range 信息，只更新对应范围的条目
        if (task.range && task.range.type === 'alternate_greetings') {
          const { start, end } = task.range;
          // start 和 end 是 1-based 的索引，需要转换为 0-based
          const startIdx = start - 1;
          const endIdx = end - 1;
          
          // 获取原始数组
          const originalGreetings = updatedCard.data.alternate_greetings || [];
          const newGreetings = [...originalGreetings];
          
          // 更新对应范围的条目
          greetings.forEach((greeting, idx) => {
            const targetIdx = startIdx + idx;
            if (targetIdx < originalGreetings.length) {
              newGreetings[targetIdx] = greeting;
            } else {
              // 如果索引超出范围，添加新条目
              newGreetings.push(greeting);
            }
          });
          
          updatedCard.data.alternate_greetings = newGreetings;
        } else {
          // 没有 range 信息，说明是整段任务，直接替换所有条目
          updatedCard.data.alternate_greetings = greetings;
        }
      }
    } else if (field === 'character_book') {
      const entries = handleWorldBookEntries(contentMap, task.range);
      
      // 如果 entries 为空，但 contentMap 中有内容，尝试直接使用原始内容
      if (entries.length === 0 && contentMap.size > 0 && task.range && task.range.type === 'world_book') {
        // 尝试从任何可用的内容中提取
        for (const [title, content] of contentMap.entries()) {
          if (content.trim()) {
            // 如果只有一个条目在范围内，直接使用这个内容
            if (task.range.start === task.range.end) {
              const index = task.range.start;
              let keys: string[] = [];
              let actualContent = content.trim();
              
              // 尝试提取关键词
              const keyMatch = actualContent.match(/\*\*关键词\*\*:\s*(.+?)(?:\n|$)/);
              if (keyMatch) {
                const keyText = keyMatch[1].trim();
                keys = keyText.split(',').map(k => k.trim()).filter(k => k);
                actualContent = actualContent.replace(/\*\*关键词\*\*:.+?(?:\n|$)/, '').trim();
              }
              
              entries.push({ index, keys, content: actualContent });
              break; // 只处理第一个有效内容
            }
          }
        }
      }
      
      if (entries.length > 0) {
        if (!updatedCard.data.character_book) {
          updatedCard.data.character_book = { entries: [] };
        }
        
        // 获取原始条目数组
        const originalEntries = updatedCard.data.character_book.entries || [];
        
        // 如果有 range 信息，只更新对应范围的条目
        if (task.range && task.range.type === 'world_book') {
          const { start, end } = task.range;
          // start 和 end 是 1-based 的索引（任务范围）
          
          // 创建新数组，保留原始条目的其他属性
          const newEntries = [...originalEntries];
          
          // 更新对应范围的条目
          // entries 中的 index 是 1-based 的（从标题中解析出来的）
          entries.forEach((entry) => {
            // entry.index 是 1-based，转换为 0-based 数组索引
            const targetIdx = entry.index - 1;
            
            // 确保索引在任务范围内
            if (entry.index >= start && entry.index <= end) {
              if (targetIdx >= 0 && targetIdx < originalEntries.length) {
                // 保留原始条目的所有属性（如 comment, enabled, insertion_order, id, extensions 等）
                // 只更新 keys 和 content
                newEntries[targetIdx] = {
                  ...originalEntries[targetIdx],
                  keys: entry.keys,
                  content: entry.content, // 确保使用新的内容，覆盖旧的内容
                };
              } else if (targetIdx === originalEntries.length) {
                // 如果索引正好是数组长度，添加新条目
                newEntries.push({
                  ...originalEntries[targetIdx] || {},
                  keys: entry.keys,
                  content: entry.content,
                  enabled: originalEntries[targetIdx]?.enabled ?? true,
                  insertion_order: originalEntries[targetIdx]?.insertion_order ?? newEntries.length,
                });
              }
            }
          });
          
          updatedCard.data.character_book.entries = newEntries;
        } else {
          // 没有 range 信息，说明是整段任务
          // 需要根据 entries 中的 index 来更新对应位置的条目
          const newEntries = [...originalEntries];
          
          entries.forEach((entry) => {
            const targetIdx = entry.index - 1; // 转换为 0-based
            if (targetIdx >= 0 && targetIdx < originalEntries.length) {
              // 保留原始条目的其他属性
              newEntries[targetIdx] = {
                ...originalEntries[targetIdx],
                keys: entry.keys,
                content: entry.content,
              };
            } else if (targetIdx === originalEntries.length) {
              // 添加新条目
              newEntries.push({
                keys: entry.keys,
                content: entry.content,
                enabled: true,
                insertion_order: newEntries.length,
              });
            }
          });
          
          updatedCard.data.character_book.entries = newEntries;
        }
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

