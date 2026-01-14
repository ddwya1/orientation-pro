import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Book, MessageSquare, User, MapPin, Brain } from 'lucide-react';
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

  const getIconForSection = (key: string) => {
    switch (key) {
      case 'name': return <User size={16} className="text-primary" />;
      case 'description': return <FileText size={16} className="text-secondary" />;
      case 'personality': return <Brain size={16} className="text-accent" />;
      case 'scenario': return <MapPin size={16} className="text-orange-500" />;
      case 'first_mes': return <MessageSquare size={16} className="text-pink-500" />;
      case 'character_book': return <Book size={16} className="text-blue-500" />;
      default: return <FileText size={16} className="text-white/40" />;
    }
  };

  const renderSection = (title: string, content: string | undefined, key: string) => {
    if (!content) return null;
    const isExpanded = expandedSections.has(key);
    const icon = getIconForSection(key);
    
    // 汉化标题
    const translatedTitle = {
      'name': '角色名称',
      'description': '角色描述',
      'personality': '角色性格',
      'scenario': '当前场景',
      'first_mes': '开场白',
      'character_book': '世界书'
    }[key] || title;
    
    if (key === 'name') {
      return (
        <div key={key} className="border-b border-white/5 bg-primary/5">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{translatedTitle}</span>
              <div className="text-lg font-black text-white tracking-tight">
                {content}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div key={key} className="border-b border-white/5 transition-colors hover:bg-white/5">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-4 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-primary/20 border border-primary/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'bg-black/40 border border-white/5 group-hover:border-white/20'}`}>
              {icon}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isExpanded ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
              {translatedTitle}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp size={14} className="text-primary" />
          ) : (
            <ChevronDown size={14} className="text-white/20 group-hover:text-white/40" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 pl-14 animate-slide-up">
            <div className="text-[11px] text-textLight font-mono whitespace-pre-wrap max-h-60 overflow-y-auto bg-black/40 p-3 rounded-xl border border-white/5 break-words custom-scrollbar leading-relaxed">
              {content}
            </div>
            <div className="text-[9px] font-mono text-white/20 mt-2 flex items-center gap-2 uppercase tracking-tighter">
              <span className="w-1 h-1 rounded-full bg-primary/40"></span>
              长度: {content.length} 字节
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWorldBook = (entries: any[] | undefined) => {
    if (!entries || entries.length === 0) return null;
    const key = 'character_book';
    const isExpanded = expandedSections.has(key);
    const icon = getIconForSection(key);
    
    return (
      <div className="border-b border-white/5 transition-colors hover:bg-white/5">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-4 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-primary/20 border border-primary/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'bg-black/40 border border-white/5 group-hover:border-white/20'}`}>
              {icon}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isExpanded ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
              世界书 ({entries.length} 个节点)
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp size={14} className="text-primary" />
          ) : (
            <ChevronDown size={14} className="text-white/20 group-hover:text-white/40" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 pl-14 animate-slide-up space-y-2">
            {entries.map((entry, idx) => (
              <div key={idx} className="bg-black/40 p-2 rounded-lg border border-white/5 hover:border-primary/20 transition-colors group/entry">
                <div className="text-[9px] font-mono text-white/20 mb-1 flex items-center gap-2 uppercase">
                  <span className="text-primary/60 font-bold">节点_{idx + 1}</span>
                  {entry.comment && <span className="opacity-50 truncate">| {entry.comment}</span>}
                </div>
                <div className="text-[9px] font-mono text-white/40">
                  有效载荷: {(entry.content || '').length} 字节
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
    <div className="bg-black/20 h-full flex flex-col relative overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-surface/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText size={14} />
            数据检查器 (Inspector)
          </h2>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="divide-y divide-white/5">
          {renderSection('角色名称', data.name, 'name')}
          {renderSection('描述', data.description, 'description')}
          {renderSection('性格', data.personality, 'personality')}
          {renderSection('场景', data.scenario, 'scenario')}
          {renderSection('系统提示词', data.system_prompt, 'system_prompt')}
          {(data.first_mes || (data.alternate_greetings && data.alternate_greetings.length > 0)) && (
            <div className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <div className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
                  <MessageSquare size={16} className="text-pink-500" />
                </div>
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  问候语 ({[data.first_mes, ...(data.alternate_greetings || [])].filter(Boolean).length} 条流)
                </span>
              </div>
            </div>
          )}
          {renderSection('示例对话', data.mes_example, 'mes_example')}
          {renderSection('作者附言', data.creator_notes, 'creator_notes')}
          {renderSection('后置指令', data.post_history_instructions, 'post_history_instructions')}
          {renderWorldBook(data.character_book?.entries)}
        </div>
      </div>
    </div>
  );
}

