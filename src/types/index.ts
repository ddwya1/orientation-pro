// SillyTavern V2 格式类型定义
export interface SillyTavernV2Card {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: {
    name?: string;
    description?: string;
    personality?: string;
    scenario?: string;
    first_mes?: string;
    mes_example?: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    alternate_greetings?: string[];
    character_book?: {
      entries?: WorldBookEntry[];
    };
    extensions?: Record<string, any>;
    tags?: string[];
    creator?: string;
    character_version?: string;
  };
}

export interface WorldBookEntry {
  keys?: string[];
  content?: string;
  extensions?: Record<string, any>;
  enabled?: boolean;
  insertion_order?: number;
  case_sensitive?: boolean;
  name?: string;
  priority?: number;
  id?: number;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
}

// 分段任务类型
export interface ConversionTask {
  id: string;
  groupId: string;
  groupName: string;
  fields: string[];
  content: string;
  completed: boolean;
  result?: string;
  range?: {
    start: number;
    end: number;
    type: 'alternate_greetings' | 'world_book';
  };
}

export interface TaskGroup {
  id: string;
  name: string;
  tasks: ConversionTask[];
  completed: boolean;
}

export type OrientationTarget = 'BL' | 'BG';

// 字段分组配置
export const CORE_FIELDS = ['description', 'personality', 'scenario', 'system_prompt'] as const;
export const FIRST_MES_FIELD = 'first_mes' as const;
export const ALTERNATE_GREETINGS_FIELD = 'alternate_greetings' as const;
export const WORLD_BOOK_FIELD = 'character_book' as const;

