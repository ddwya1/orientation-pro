/**
 * 字段名到中文标题的映射
 */

export const FIELD_TITLE_MAP: Record<string, string> = {
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

/**
 * 将字段名数组转换为中文标题数组
 */
export function fieldsToTitles(fields: string[]): string[] {
  return fields.map(field => FIELD_TITLE_MAP[field] || field);
}

