/**
 * 智能分段逻辑
 * 根据内容长度自动决定是否需要分段处理
 */

import type { SillyTavernV2Card, TaskGroup, ConversionTask } from '../types';
import { CORE_FIELDS, FIRST_MES_FIELD, ALTERNATE_GREETINGS_FIELD, WORLD_BOOK_FIELD } from '../types';
import { countCardWords } from './cardParser';

// 触发分段的阈值
const WORD_THRESHOLD = 3500;
const WORLD_BOOK_THRESHOLD = 8;
const ALTERNATE_GREETINGS_THRESHOLD = 5;

/**
 * 提取字段内容并格式化标题
 */
function extractFieldContent(card: SillyTavernV2Card, field: string): string {
  const data = card.data;
  
  switch (field) {
    case 'description':
      return data.description || '';
    case 'personality':
      return data.personality || '';
    case 'scenario':
      return data.scenario || '';
    case 'system_prompt':
      return data.system_prompt || '';
    case 'first_mes':
      return data.first_mes || '';
    case 'mes_example':
      return data.mes_example || '';
    case 'creator_notes':
      return data.creator_notes || '';
    case 'post_history_instructions':
      return data.post_history_instructions || '';
    case 'alternate_greetings':
      return data.alternate_greetings?.join('\n\n') || '';
    case 'character_book':
      if (!data.character_book?.entries) return '';
      return data.character_book.entries
        .map((entry, idx) => {
          const keys = entry.keys?.join(', ') || '';
          const content = entry.content || '';
          return `### 【世界书条目${idx + 1}】\n**关键词**: ${keys}\n${content}`;
        })
        .join('\n\n');
    default:
      return '';
  }
}

/**
 * 生成字段标题
 */
function getFieldTitle(field: string): string {
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

/**
 * 检查是否需要分段
 */
function shouldSegment(card: SillyTavernV2Card): boolean {
  const wordCount = countCardWords(card);
  const worldBookCount = card.data.character_book?.entries?.length || 0;
  const alternateGreetingsCount = card.data.alternate_greetings?.length || 0;
  
  return (
    wordCount > WORD_THRESHOLD ||
    worldBookCount > WORLD_BOOK_THRESHOLD ||
    alternateGreetingsCount > ALTERNATE_GREETINGS_THRESHOLD
  );
}

/**
 * 生成分段任务组
 */
export function generateTaskGroups(card: SillyTavernV2Card): TaskGroup[] {
  const shouldSegmentMode = shouldSegment(card);
  
  if (!shouldSegmentMode) {
    // 整段任务组：所有内容合并在一个任务中
    const allFields: string[] = [];
    const allContent: string[] = [];
    
    // 核心字段
    for (const field of CORE_FIELDS) {
      const content = extractFieldContent(card, field);
      if (content) {
        allFields.push(field);
        allContent.push(`### 【${getFieldTitle(field)}】\n${content}`);
      }
    }
    
    // 开场白
    const firstMes = extractFieldContent(card, FIRST_MES_FIELD);
    if (firstMes) {
      allFields.push(FIRST_MES_FIELD);
      allContent.push(`### 【${getFieldTitle(FIRST_MES_FIELD)}】\n${firstMes}`);
    }
    
    // 消息示例
    const mesExample = extractFieldContent(card, 'mes_example');
    if (mesExample) {
      allFields.push('mes_example');
      allContent.push(`### 【${getFieldTitle('mes_example')}】\n${mesExample}`);
    }
    
    // 创作者笔记
    const creatorNotes = extractFieldContent(card, 'creator_notes');
    if (creatorNotes) {
      allFields.push('creator_notes');
      allContent.push(`### 【${getFieldTitle('creator_notes')}】\n${creatorNotes}`);
    }
    
    // 历史后处理
    const postHistory = extractFieldContent(card, 'post_history_instructions');
    if (postHistory) {
      allFields.push('post_history_instructions');
      allContent.push(`### 【${getFieldTitle('post_history_instructions')}】\n${postHistory}`);
    }
    
    // 备用开场白
    const alternateGreetings = extractFieldContent(card, ALTERNATE_GREETINGS_FIELD);
    if (alternateGreetings) {
      allFields.push(ALTERNATE_GREETINGS_FIELD);
      allContent.push(`### 【${getFieldTitle(ALTERNATE_GREETINGS_FIELD)}】\n${alternateGreetings}`);
    }
    
    // 世界书
    const worldBook = extractFieldContent(card, WORLD_BOOK_FIELD);
    if (worldBook) {
      allFields.push(WORLD_BOOK_FIELD);
      allContent.push(`### 【${getFieldTitle(WORLD_BOOK_FIELD)}】\n${worldBook}`);
    }
    
    const task: ConversionTask = {
      id: 'task-1',
      groupId: 'group-1',
      groupName: '全部内容',
      fields: allFields,
      content: allContent.join('\n\n'),
      completed: false,
    };
    
    return [
      {
        id: 'group-1',
        name: '全部内容',
        tasks: [task],
        completed: false,
      },
    ];
  }
  
  // 分段任务组
  const groups: TaskGroup[] = [];
  let taskIdCounter = 1;
  let groupIdCounter = 1;
  
  // Group 1: 核心设定
  const coreFields: string[] = [];
  const coreContent: string[] = [];
  for (const field of CORE_FIELDS) {
    const content = extractFieldContent(card, field);
    if (content) {
      coreFields.push(field);
      coreContent.push(`### 【${getFieldTitle(field)}】\n${content}`);
    }
  }
  
  if (coreFields.length > 0) {
    const coreTask: ConversionTask = {
      id: `task-${taskIdCounter++}`,
      groupId: `group-${groupIdCounter}`,
      groupName: '核心设定',
      fields: coreFields,
      content: coreContent.join('\n\n'),
      completed: false,
    };
    
    groups.push({
      id: `group-${groupIdCounter++}`,
      name: '核心设定',
      tasks: [coreTask],
      completed: false,
    });
  }
  
  // Group 2: 主开场白
  const firstMes = extractFieldContent(card, FIRST_MES_FIELD);
  if (firstMes) {
    const firstMesTask: ConversionTask = {
      id: `task-${taskIdCounter++}`,
      groupId: `group-${groupIdCounter}`,
      groupName: '主开场白',
      fields: [FIRST_MES_FIELD],
      content: `### 【${getFieldTitle(FIRST_MES_FIELD)}】\n${firstMes}`,
      completed: false,
    };
    
    groups.push({
      id: `group-${groupIdCounter++}`,
      name: '主开场白',
      tasks: [firstMesTask],
      completed: false,
    });
  }
  
  // Group 2.5: 其他字段（消息示例、创作者笔记、历史后处理）
  const otherFields: string[] = [];
  const otherContent: string[] = [];
  
  const mesExample = extractFieldContent(card, 'mes_example');
  if (mesExample) {
    otherFields.push('mes_example');
    otherContent.push(`### 【${getFieldTitle('mes_example')}】\n${mesExample}`);
  }
  
  const creatorNotes = extractFieldContent(card, 'creator_notes');
  if (creatorNotes) {
    otherFields.push('creator_notes');
    otherContent.push(`### 【${getFieldTitle('creator_notes')}】\n${creatorNotes}`);
  }
  
  const postHistory = extractFieldContent(card, 'post_history_instructions');
  if (postHistory) {
    otherFields.push('post_history_instructions');
    otherContent.push(`### 【${getFieldTitle('post_history_instructions')}】\n${postHistory}`);
  }
  
  if (otherFields.length > 0) {
    const otherTask: ConversionTask = {
      id: `task-${taskIdCounter++}`,
      groupId: `group-${groupIdCounter}`,
      groupName: '其他字段',
      fields: otherFields,
      content: otherContent.join('\n\n'),
      completed: false,
    };
    
    groups.push({
      id: `group-${groupIdCounter++}`,
      name: '其他字段',
      tasks: [otherTask],
      completed: false,
    });
  }
  
  // Group 3: 备用开场白（每 5 条一个任务）
  const alternateGreetings = card.data.alternate_greetings || [];
  if (alternateGreetings.length > 0) {
    const batchSize = 5;
    const batches: string[][] = [];
    for (let i = 0; i < alternateGreetings.length; i += batchSize) {
      batches.push(alternateGreetings.slice(i, i + batchSize));
    }
    
    const groupTasks: ConversionTask[] = [];
    batches.forEach((batch, batchIdx) => {
      const startIdx = batchIdx * batchSize + 1;
      const endIdx = Math.min(startIdx + batch.length - 1, alternateGreetings.length);
      const batchContent = batch
        .map((greeting, idx) => `### 【备用开场白${batchIdx * batchSize + idx + 1}】\n${greeting}`)
        .join('\n\n');
      
      groupTasks.push({
        id: `task-${taskIdCounter++}`,
        groupId: `group-${groupIdCounter}`,
        groupName: '备用开场白',
        fields: [ALTERNATE_GREETINGS_FIELD],
        content: batchContent,
        completed: false,
        range: {
          start: startIdx,
          end: endIdx,
          type: 'alternate_greetings',
        },
      });
    });
    
    groups.push({
      id: `group-${groupIdCounter++}`,
      name: '备用开场白',
      tasks: groupTasks,
      completed: false,
    });
  }
  
  // Group 4: 世界观/知识库（每 10 条一个任务）
  const worldBookEntries = card.data.character_book?.entries || [];
  if (worldBookEntries.length > 0) {
    const batchSize = 10;
    const batches: typeof worldBookEntries[] = [];
    for (let i = 0; i < worldBookEntries.length; i += batchSize) {
      batches.push(worldBookEntries.slice(i, i + batchSize));
    }
    
    const groupTasks: ConversionTask[] = [];
    batches.forEach((batch, batchIdx) => {
      const startIdx = batchIdx * batchSize + 1;
      const endIdx = Math.min(startIdx + batch.length - 1, worldBookEntries.length);
      const batchContent = batch
        .map((entry, idx) => {
          const keys = entry.keys?.join(', ') || '';
          const content = entry.content || '';
          return `### 【世界书条目${batchIdx * batchSize + idx + 1}】\n**关键词**: ${keys}\n${content}`;
        })
        .join('\n\n');
      
      groupTasks.push({
        id: `task-${taskIdCounter++}`,
        groupId: `group-${groupIdCounter}`,
        groupName: '世界观/知识库',
        fields: [WORLD_BOOK_FIELD],
        content: batchContent,
        completed: false,
        range: {
          start: startIdx,
          end: endIdx,
          type: 'world_book',
        },
      });
    });
    
    groups.push({
      id: `group-${groupIdCounter++}`,
      name: '世界观/知识库',
      tasks: groupTasks,
      completed: false,
    });
  }
  
  return groups;
}

