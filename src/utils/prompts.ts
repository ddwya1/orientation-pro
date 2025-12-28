/**
 * 性向转换指令集
 */

import type { OrientationTarget } from '../types';

/**
 * BL 转换指令（转为男性 User）
 */
export const BL_PROMPT = `【指令】：你是一个专业的BL小说改写助手。请读取下方的角色卡数据，并执行以下修改任务：
1. 【核心任务】：将User的性别设定为【男性】，将指代User的代词改为"他"。
2. 【NSFW/生理修正】：
   - 识别这是两个男性的互动。
   - 如果文中有色情/亲密描写，必须根据【男性生理构造】修改器官和动作（例如：将女性特征改为后穴、肠液、前列腺、勃起、阴囊等）。
   - 移除所有关于女性特征（如：阴道、乳房、子宫、受孕等）的描写，替换为对应的男性反应。
   - 如果没有色情内容，则只修改性别代词。
3. 【格式死命令】：
   - 严禁删除换行符！严禁合并段落！
   - 严禁修改 XML 标签（如 <tag>）和列表符号。
   - 【重要】必须保留所有 ### 【标题】 格式，这是回填识别的关键！
   - 请按顺序输出修改后的内容。`;

/**
 * BG 转换指令（转为女性 User）
 */
export const BG_PROMPT = `【指令】：你是一个专业的BG/言情小说改写助手。请读取下方的角色卡数据，并执行以下修改任务：
1. 【核心任务】：将User的性别设定为【女性】，将指代User的代词改为"她"。
2. 【NSFW/生理修正】：
   - 识别这是男女之间的互动。
   - 如果文中有色情/亲密描写，必须根据【女性生理构造】修改器官和动作（例如：将男性后方特征改为阴道、花径、爱液、阴蒂、乳房、排卵等）。
   - 移除所有关于男性特有生理特征描写，替换为女性的生理反应与触感。
   - 如果没有色情内容，则只修改性别代词。
3. 【格式死命令】：
   - 严禁删除换行符！严禁合并段落！
   - 严禁修改 XML 标签（如 <tag>）和列表符号。
   - 【重要】必须保留所有 ### 【标题】 格式，这是回填识别的关键！
   - 请按顺序输出修改后的内容。`;

/**
 * 生成完整的转换任务提示词
 */
export function generateConversionPrompt(
  target: OrientationTarget,
  content: string
): string {
  const basePrompt = target === 'BL' ? BL_PROMPT : BG_PROMPT;
  return `${basePrompt}\n\n---\n\n${content}`;
}

/**
 * 复制任务到剪贴板
 */
export async function copyTaskToClipboard(
  target: OrientationTarget,
  content: string
): Promise<void> {
  const fullPrompt = generateConversionPrompt(target, content);
  await navigator.clipboard.writeText(fullPrompt);
}

