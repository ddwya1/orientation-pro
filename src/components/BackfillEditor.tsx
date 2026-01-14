import { useState, useEffect } from 'react';
import { CheckCircle2, Save, Sparkles, Copy, RefreshCw } from 'lucide-react';
import type { ConversionTask } from '../types';

interface BackfillEditorProps {
  task: ConversionTask;
  onComplete: (result: string) => void;
}

export default function BackfillEditor({
  task,
  onComplete,
}: BackfillEditorProps) {
  const [localResult, setLocalResult] = useState(task.result || '');
  const [isCopied, setIsCopied] = useState(false);
  
  // 当任务改变时，同步本地状态
  useEffect(() => {
    setLocalResult(task.result || '');
  }, [task.id, task.result]);
  
  const handleCopyOriginal = async () => {
    if (task.content) {
      await navigator.clipboard.writeText(task.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (localResult.trim()) {
      onComplete(localResult);
    }
  };

  return (
    <div className="bg-black/40 p-6 h-full flex flex-col relative custom-scrollbar overflow-hidden">
      {/* 终端头部装饰 */}
      <div className="flex items-center gap-1.5 mb-6 border-b border-white/5 pb-4">
        <div className="flex gap-1.5 mr-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-white/90 tracking-[0.2em] flex items-center gap-2">
              <span className="text-primary">{task.groupName}</span>
              <span className="text-white/20">/</span>
              <span className="text-white/40 text-[10px] font-mono">
                {task.fields.join('_').toUpperCase()}
              </span>
            </h2>
            {task.completed && (
              <span className="px-2 py-0.5 rounded border border-accent/30 text-accent text-[8px] font-black uppercase tracking-widest flex items-center gap-1 bg-accent/5">
                <CheckCircle2 size={10} />
                同步完成
              </span>
            )}
          </div>
        </div>
        <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
          进程 ID (PID): {Math.floor(Math.random() * 9000) + 1000}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-h-0">
        {/* 源数据区 */}
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-sm"></div>
              <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">输入流 (Input Stream)</span>
            </div>
            <button 
              onClick={handleCopyOriginal}
              className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-white/40 hover:text-primary transition-all group"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 size="12" className="text-accent" />
                  <span className="text-accent">已复制</span>
                </>
              ) : (
                <>
                  <Copy size="12" className="group-hover:scale-110 transition-transform" />
                  <span>复制源码</span>
                </>
              )}
            </button>
          </div>
          <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-textLight font-mono overflow-y-auto whitespace-pre-wrap custom-scrollbar leading-relaxed">
            <div className="text-primary/30 mb-2 font-bold tracking-widest select-none">[原始数据块]</div>
            {task.content}
          </div>
        </div>

        {/* 结果输入区 */}
        <div className="flex flex-col min-h-0 flex-[1.2]">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent/40 rounded-sm animate-pulse"></div>
              <span className="text-[10px] font-black text-accent/60 uppercase tracking-widest">输出缓冲 (Output Buffer)</span>
            </div>
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">
              长度: <span className="text-white/40">{localResult.length} 字节</span>
            </div>
          </div>
          <div className="relative flex-1 group">
            <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
            <textarea
              value={localResult}
              onChange={(e) => setLocalResult(e.target.value)}
              placeholder="在此粘贴转换后的数据..."
              className="relative w-full h-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs text-white font-mono resize-none focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/10 custom-scrollbar leading-relaxed"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={!localResult.trim() || task.completed}
          className={`flex-1 group relative overflow-hidden px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
            task.completed 
              ? 'bg-accent/10 text-accent border border-accent/20' 
              : 'bg-primary text-black hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] hover:scale-[1.02] active:scale-[0.98]'
          } disabled:opacity-20 disabled:grayscale`}
        >
          {task.completed ? (
            <>
              <CheckCircle2 size="16" />
              <span>数据已提交</span>
            </>
          ) : (
            <>
              <Save size="16" className="group-hover:animate-bounce" />
              <span>提交修改</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

