import { useState, useEffect } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import type { ConversionTask } from '../types';

interface BackfillEditorProps {
  selectedTask: ConversionTask | null;
  backfillResult: string;
  onResultChange: (result: string) => void;
  onComplete: (taskId: string, result: string) => void;
}

export default function BackfillEditor({
  selectedTask,
  backfillResult,
  onResultChange,
  onComplete,
}: BackfillEditorProps) {
  const [localResult, setLocalResult] = useState(backfillResult);
  
  // 当选中任务改变或外部结果改变时，更新本地状态
  useEffect(() => {
    if (selectedTask?.result) {
      setLocalResult(selectedTask.result);
    } else {
      setLocalResult(backfillResult);
    }
  }, [selectedTask, backfillResult]);
  
  // 当选中任务改变时，重置为任务的结果或空
  useEffect(() => {
    if (selectedTask) {
      setLocalResult(selectedTask.result || '');
    }
  }, [selectedTask?.id]);

  if (!selectedTask) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6 sm:p-8 text-center h-[600px] lg:h-full flex items-center justify-center shadow-xl glow-indigo">
        <p className="text-sm sm:text-base text-slate-400/70">请从左侧任务看板选择一个任务</p>
      </div>
    );
  }

  const handleSave = () => {
    if (localResult.trim() && selectedTask) {
      onComplete(selectedTask.id, localResult);
      onResultChange(localResult);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/50 p-3 sm:p-4 h-[600px] lg:h-full flex flex-col shadow-xl glow-indigo">
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {selectedTask.groupName}
          </h2>
          {selectedTask.completed && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-medium">
              <CheckCircle2 size={16} className="sm:w-4 sm:h-4 drop-shadow-sm" />
              <span>已完成</span>
            </div>
          )}
        </div>
        <div className="text-xs sm:text-sm text-slate-400 mb-2">
          字段: {selectedTask.fields.join(', ')}
        </div>
        <div className="text-xs text-slate-500">
          原内容长度: {selectedTask.content.length} 字符
        </div>
      </div>

      <div className="flex-1 flex flex-col mb-3 sm:mb-4 space-y-3 sm:space-y-4 min-h-0">
        {/* 原始内容显示 */}
        <div className="flex flex-col min-h-0">
          <label className="text-xs sm:text-sm font-medium text-slate-300 mb-2">
            原始内容
          </label>
          <div className="flex-1 min-h-[120px] max-h-[200px] sm:max-h-[300px] bg-slate-950/80 border border-slate-700/50 rounded-xl p-2 sm:p-3 text-xs sm:text-sm text-slate-300 font-mono overflow-y-auto whitespace-pre-wrap shadow-inner">
            {selectedTask.content}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            长度: {selectedTask.content.length} 字符
          </div>
        </div>

        {/* AI 返回结果输入 */}
        <div className="flex flex-col flex-1 min-h-0">
          <label className="text-xs sm:text-sm font-medium text-slate-300 mb-2">
            粘贴 AI 返回结果
          </label>
          <textarea
            value={localResult}
            onChange={(e) => setLocalResult(e.target.value)}
            placeholder="请将 AI 改写后的内容粘贴到这里..."
            className="flex-1 min-h-[150px] sm:min-h-[200px] w-full bg-slate-950/80 border border-slate-700/50 rounded-xl p-2 sm:p-3 text-xs sm:text-sm text-slate-200 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
          />
          {localResult && (
            <div className="mt-2 text-xs text-slate-400">
              当前长度: {localResult.length} 字符
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!localResult.trim() || selectedTask.completed}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-4 py-2.5 sm:py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 disabled:shadow-none touch-manipulation"
      >
        <Save size={18} className="sm:w-4 sm:h-4" />
        <span>{selectedTask.completed ? '已完成' : '保存并回填'}</span>
      </button>
    </div>
  );
}

