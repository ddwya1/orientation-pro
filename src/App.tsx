import { useState } from 'react';
import { Upload, Download, Copy, CheckCircle2, Circle } from 'lucide-react';
import { parseCardFile } from './utils/cardParser';
import { generateTaskGroups } from './utils/taskSegmenter';
import { backfillTaskResult } from './utils/backfill';
import { downloadCardByFormat } from './utils/exporter';
import { copyTaskToClipboard } from './utils/prompts';
import type { SillyTavernV2Card, TaskGroup, ConversionTask, OrientationTarget } from './types';
import TaskBoard from './components/TaskBoard';
import BackfillEditor from './components/BackfillEditor';
import CardPreview from './components/CardPreview';

function App() {
  const [card, setCard] = useState<SillyTavernV2Card | null>(null);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [orientationTarget, setOrientationTarget] = useState<OrientationTarget>('BL');
  const [selectedTask, setSelectedTask] = useState<ConversionTask | null>(null);
  const [backfillResult, setBackfillResult] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [originalFormat, setOriginalFormat] = useState<'png' | 'json' | null>(null);
  const [originalPNG, setOriginalPNG] = useState<ArrayBuffer | undefined>(undefined);
  const [originalFileName, setOriginalFileName] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { card: parsedCard, originalFormat: format, originalPNG: png, originalFileName: fileName } = await parseCardFile(file);
      setCard(parsedCard);
      setOriginalFormat(format);
      setOriginalPNG(png);
      setOriginalFileName(fileName);
      
      // 生成任务组
      const groups = generateTaskGroups(parsedCard);
      setTaskGroups(groups);
      
      // 计算字数
      const count = Object.values(parsedCard.data).reduce((acc, val) => {
        if (typeof val === 'string') return acc + val.length;
        if (Array.isArray(val)) return acc + val.join('').length;
        if (val && typeof val === 'object' && 'entries' in val) {
          const entries = (val as any).entries || [];
          return acc + entries.reduce((sum: number, entry: any) => {
            return sum + (entry.content?.length || 0) + (entry.keys?.join('').length || 0);
          }, 0);
        }
        return acc;
      }, 0);
      setWordCount(count);
      
      setSelectedTask(null);
      setBackfillResult('');
    } catch (error) {
      alert(`解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleCopyTask = async (task: ConversionTask) => {
    try {
      await copyTaskToClipboard(orientationTarget, task.content);
      alert('任务已复制到剪贴板！');
    } catch (error) {
      alert(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleTaskComplete = (taskId: string, result: string) => {
    if (!card) return;

    // 找到任务
    let targetTask: ConversionTask | null = null;
    const updatedGroups = taskGroups.map(group => ({
      ...group,
      tasks: group.tasks.map(task => {
        if (task.id === taskId) {
          targetTask = { ...task, completed: true, result };
          return targetTask;
        }
        return task;
      }),
    }));

    // 更新组完成状态
    const finalGroups = updatedGroups.map(group => ({
      ...group,
      completed: group.tasks.every(t => t.completed),
    }));

    setTaskGroups(finalGroups);

    // 回填到卡片
    if (targetTask) {
      const updatedCard = backfillTaskResult(card, targetTask, result);
      setCard(updatedCard);
      
      // 更新字数统计
      const count = Object.values(updatedCard.data).reduce((acc, val) => {
        if (typeof val === 'string') return acc + val.length;
        if (Array.isArray(val)) return acc + val.join('').length;
        if (val && typeof val === 'object' && 'entries' in val) {
          const entries = (val as any).entries || [];
          return acc + entries.reduce((sum: number, entry: any) => {
            return sum + (entry.content?.length || 0) + (entry.keys?.join('').length || 0);
          }, 0);
        }
        return acc;
      }, 0);
      setWordCount(count);
      
      // 更新选中任务
      setSelectedTask(targetTask);
    }
  };

  const handleExport = () => {
    if (!card || !originalFormat) return;
    downloadCardByFormat(card, originalFormat, originalPNG, originalFileName);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-md sticky top-0 z-10 shadow-lg shadow-black/20">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Orientation Pro
              </h1>
              <p className="text-xs sm:text-sm text-slate-400/80">角色卡性向转换智能工作站</p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* 性向切换 */}
              <div className="flex items-center gap-1 sm:gap-2 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-1 flex-1 sm:flex-initial shadow-inner">
                <button
                  onClick={() => setOrientationTarget('BL')}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base flex-1 sm:flex-initial font-medium ${
                    orientationTarget === 'BL'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  🟢 BL
                </button>
                <button
                  onClick={() => setOrientationTarget('BG')}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base flex-1 sm:flex-initial font-medium ${
                    orientationTarget === 'BG'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  🔴 BG
                </button>
              </div>

              {/* 导出 */}
              {card && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base font-medium shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
                >
                  <Download size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">导出</span>
                </button>
              )}
            </div>
          </div>
          
          {card && (
            <div className="mt-2 text-xs sm:text-sm text-slate-400/80 flex flex-col sm:flex-row gap-1 sm:gap-0">
              <span>当前卡片: <span className="text-indigo-400 font-medium">{card.data.name || '未命名'}</span></span>
              <span className="hidden sm:inline text-slate-600"> | </span>
              <span>字数: <span className="text-indigo-400 font-medium">{wordCount.toLocaleString()}</span></span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      {card && taskGroups.length > 0 ? (
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* 左侧：任务看板 */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <TaskBoard
              taskGroups={taskGroups}
              selectedTask={selectedTask}
              onSelectTask={setSelectedTask}
              onCopyTask={handleCopyTask}
              orientationTarget={orientationTarget}
            />
          </div>

          {/* 中间：回填编辑区 */}
          <div className="lg:col-span-5 order-2 lg:order-2">
            <BackfillEditor
              selectedTask={selectedTask}
              backfillResult={backfillResult}
              onResultChange={setBackfillResult}
              onComplete={handleTaskComplete}
            />
          </div>

          {/* 右侧：原卡数据预览 */}
          <div className="lg:col-span-4 order-3 lg:order-3">
            <CardPreview card={card} />
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-12 sm:py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Upload size={32} className="text-indigo-400 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-slate-200">上传角色卡开始转换</h2>
            <p className="text-sm sm:text-base text-slate-400/80 mb-6 px-4">
              支持 PNG（tEXt/iTXt 块）和 JSON 格式的角色卡文件
            </p>
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept=".json,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2 text-sm sm:text-base font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35">
                <Upload size={20} />
                <span>选择文件</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

