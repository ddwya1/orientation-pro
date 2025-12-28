import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SillyTavernV2Card } from '../types';

interface CardPreviewProps {
  card: SillyTavernV2Card;
}

export default function CardPreview({ card }: CardPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['name', 'description']));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const renderSection = (title: string, content: string | undefined, key: string) => {
    if (!content) return null;
    const isExpanded = expandedSections.has(key);
    
    // 如果 key 是 'name'，不允许折叠
    if (key === 'name') {
      return (
        <div key={key} className="border-b border-slate-800/50 last:border-b-0">
          <div className="p-2 sm:p-3">
            <span className="font-medium text-slate-200 text-sm sm:text-base">{title}</span>
          </div>
          <div className="p-2 sm:p-3 pt-0">
            <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent whitespace-pre-wrap break-words">
              {content}
            </div>
          </div>
        </div>
      );
    }
    
    // 其他字段允许折叠
    return (
      <div key={key} className="border-b border-slate-800/50 last:border-b-0">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-slate-800/30 transition-colors text-left touch-manipulation rounded-lg mx-1"
        >
          <span className="font-medium text-slate-200 text-sm sm:text-base">{title}</span>
          {isExpanded ? <ChevronUp size={18} className="flex-shrink-0 sm:w-4 sm:h-4 text-slate-400" /> : <ChevronDown size={18} className="flex-shrink-0 sm:w-4 sm:h-4 text-slate-400" />}
        </button>
        {isExpanded && (
          <div className="p-2 sm:p-3 pt-0">
            <div className="text-xs sm:text-sm text-slate-400 whitespace-pre-wrap max-h-64 overflow-y-auto bg-slate-950/80 p-2 sm:p-3 rounded-xl border border-slate-800/50 break-words shadow-inner">
              {content}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {content.length} 字符
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAlternateGreetings = (greetings: string[] | undefined) => {
    if (!greetings || greetings.length === 0) return null;
    
    return (
      <div className="border-b border-slate-800/50 last:border-b-0">
        <div className="p-2 sm:p-3">
          <span className="font-medium text-slate-200 text-sm sm:text-base">
            备用开场白 ({greetings.length} 条)
          </span>
        </div>
      </div>
    );
  };

  const renderWorldBook = (entries: any[] | undefined) => {
    if (!entries || entries.length === 0) return null;
    const key = 'character_book';
    const isExpanded = expandedSections.has(key);
    
    return (
      <div className="border-b border-slate-800/50 last:border-b-0">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-slate-800/30 transition-colors text-left touch-manipulation rounded-lg mx-1"
        >
          <span className="font-medium text-slate-200 text-sm sm:text-base">
            世界书 ({entries.length} 条)
          </span>
          {isExpanded ? <ChevronUp size={18} className="flex-shrink-0 sm:w-4 sm:h-4 text-slate-400" /> : <ChevronDown size={18} className="flex-shrink-0 sm:w-4 sm:h-4 text-slate-400" />}
        </button>
        {isExpanded && (
          <div className="p-2 sm:p-3 pt-0 space-y-2">
            {entries.map((entry, idx) => (
              <div key={idx} className="bg-slate-950/60 p-2 sm:p-3 rounded-lg border border-slate-800/50 shadow-sm">
                <div className="text-xs text-slate-500/80 mb-1 break-words">
                  #{idx + 1} {entry.comment ? `| ${entry.comment}` : ''}
                </div>
                <div className="text-xs text-slate-400/70">
                  内容长度: {(entry.content || '').length} 字符
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const data = card.data;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/50 p-3 sm:p-4 h-[500px] lg:h-full flex flex-col shadow-xl glow-indigo">
      <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3 sm:mb-4">
        原卡数据预览
      </h2>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {renderSection('角色名称', data.name, 'name')}
          {renderSection('角色描述', data.description, 'description')}
          {renderSection('性格设定', data.personality, 'personality')}
          {renderSection('场景设定', data.scenario, 'scenario')}
          {renderSection('系统提示词', data.system_prompt, 'system_prompt')}
          {/* 开场白统计（主+备用合并） */}
          {(data.first_mes || (data.alternate_greetings && data.alternate_greetings.length > 0)) && (
            <div className="border-b border-slate-800/50 last:border-b-0">
              <div className="p-2 sm:p-3">
                <span className="font-medium text-slate-200 text-sm sm:text-base">
                  开场白 ({[data.first_mes, ...(data.alternate_greetings || [])].filter(Boolean).length} 条)
                </span>
              </div>
            </div>
          )}
          {renderSection('消息示例', data.mes_example, 'mes_example')}
          {renderSection('创作者笔记', data.creator_notes, 'creator_notes')}
          {renderSection('历史后处理', data.post_history_instructions, 'post_history_instructions')}
          {renderWorldBook(data.character_book?.entries)}
        </div>
      </div>
    </div>
  );
}

