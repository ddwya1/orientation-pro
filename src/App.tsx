import { useState, useEffect } from 'react';
import { Upload, Download, Copy, CheckCircle2, Circle, ListTodo, Edit3, FileText } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'editor' | 'preview'>('tasks');

  // 当选中任务时，在移动端自动切换到编辑器标签
  useEffect(() => {
    if (selectedTask) {
      setActiveTab('editor');
    }
  }, [selectedTask]);


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
      let errorMessage = '解析失败: ';
      if (error instanceof Error) {
        // 根据不同的错误类型提供更具体的提示
        if (error.message.includes('Invalid PNG file signature')) {
          errorMessage += '这不是一个有效的PNG文件，请检查文件格式';
        } else if (error.message.includes('Character card chunk has invalid CRC')) {
          errorMessage += '角色卡数据损坏 (CRC错误)，这可能是由于文件传输问题导致的';
        } else if (error.message.includes('No character card data found')) {
          errorMessage += '未找到角色卡数据，请确保上传的是有效的角色卡PNG文件';
        } else if (error.message.includes('Invalid JSON')) {
          errorMessage += `JSON数据无效: ${error.message}`;
        } else if (error.message.includes('Invalid tEXt chunk') || error.message.includes('Invalid iTXt chunk')) {
          errorMessage += `PNG文本块损坏: ${error.message}`;
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += '未知错误';
      }
      alert(errorMessage);
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
    
    // 临时调试：检查导出时的card状态
    // 移除调试代码以避免潜在的兼容性问题
    
    downloadCardByFormat(card, originalFormat, originalPNG, originalFileName);
  };

  return (
    <div className="min-h-screen text-text relative overflow-hidden bg-background">
      {/* 科技感背景 */}
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
      
      {/* 动态发光球 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative z-10 flex flex-col h-screen">
        <header className="border-b border-white/5 bg-surface/40 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <ListTodo className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter text-glow flex items-center gap-2">
                    <span className="text-primary">ORIENTATION</span>
                    <span className="text-white/90">PRO</span>
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold">角色卡性向转换智能工作站</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-1 backdrop-blur-md">
                  <button
                    onClick={() => setOrientationTarget('BL')}
                    className={`px-6 py-1.5 rounded-full transition-all text-sm font-bold flex items-center gap-2 ${
                      orientationTarget === 'BL'
                        ? 'bg-primary text-black shadow-lg shadow-primary/40'
                        : 'text-textLight hover:text-white'
                    }`}
                  >
                    <span className={orientationTarget === 'BL' ? 'animate-pulse' : ''}>●</span> BL
                  </button>
                  <button
                    onClick={() => setOrientationTarget('BG')}
                    className={`px-6 py-1.5 rounded-full transition-all text-sm font-bold flex items-center gap-2 ${
                      orientationTarget === 'BG'
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40'
                        : 'text-textLight hover:text-white'
                    }`}
                  >
                    <span className={orientationTarget === 'BG' ? 'animate-pulse' : ''}>●</span> BG
                  </button>
                </div>

                <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>

                {card ? (
                  <button
                    onClick={handleExport}
                    className="group relative flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2 rounded-xl transition-all text-sm font-bold overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <Download size={18} className="text-primary" />
                    <span className="relative z-10 text-white">导出卡片</span>
                  </button>
                ) : (
                  <label className="group relative flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 px-5 py-2 rounded-xl transition-all cursor-pointer text-sm font-bold overflow-hidden">
                    <Upload size={18} className="text-primary animate-bounce" />
                    <span className="text-primary">上传角色卡</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".png,.json" />
                  </label>
                )}
              </div>
            </div>
            
            {card && (
              <div className="mt-4 flex items-center gap-6 text-[10px] uppercase tracking-widest font-bold text-textLight">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span>目标角色: <span className="text-white">{card.data.name || '未知'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                  <span>总字数: <span className="text-white">{wordCount.toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">系统在线</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {!card ? (
            <div className="h-full flex flex-center items-center justify-center p-4">
              <div className="max-w-md w-full text-center space-y-8 animate-slide-up">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                  <div className="relative w-32 h-32 mx-auto border-2 border-primary/30 rounded-3xl flex items-center justify-center bg-surface/50 backdrop-blur-xl rotate-12 group hover:rotate-0 transition-transform duration-500">
                    <Upload size={48} className="text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">准备好转换了吗？</h2>
                  <p className="text-textLight text-sm leading-relaxed">
                    上传您的 SillyTavern 角色卡 (PNG/JSON) 以启动性向转换流程。
                  </p>
                </div>
                <label className="block w-full py-4 bg-primary text-black font-black rounded-2xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                  初始化上传
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".png,.json" />
                </label>
              </div>
            </div>
          ) : (
            <div className="h-full container mx-auto flex flex-col lg:flex-row overflow-hidden lg:p-6 lg:gap-6">
              {/* 移动端标签切换 */}
              <div className="lg:hidden flex border-b border-white/5 bg-surface/40 backdrop-blur-xl">
                {[
                  { id: 'tasks', label: '任务列表', icon: ListTodo },
                  { id: 'editor', label: '终端编辑', icon: Edit3 },
                  { id: 'preview', label: '卡片预览', icon: FileText }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 text-[10px] font-black tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                      activeTab === tab.id ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-textLight'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 任务面板 */}
              <div className={`flex-1 lg:flex-none lg:w-80 h-full lg:h-auto overflow-hidden ${activeTab === 'tasks' ? 'block' : 'hidden lg:block'}`}>
                <div className="h-full glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col">
                  <TaskBoard
                    taskGroups={taskGroups}
                    selectedTask={selectedTask}
                    onSelectTask={setSelectedTask}
                    onCopyTask={handleCopyTask}
                    orientationTarget={orientationTarget}
                  />
                </div>
              </div>

              {/* 编辑区域 */}
              <div className={`flex-[2] h-full lg:h-auto overflow-hidden ${activeTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
                <div className="h-full glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col relative">
                  <div className="scanline"></div>
                  {selectedTask ? (
                    <BackfillEditor
                      task={selectedTask}
                      onComplete={(result) => handleTaskComplete(selectedTask.id, result)}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-textLight space-y-4">
                      <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                        <Edit3 size={24} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest">Select a task to initialize terminal</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 预览区域 */}
              <div className={`flex-1 lg:flex-none lg:w-96 h-full lg:h-auto overflow-hidden ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                <div className="h-full glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col">
                  <CardPreview card={card} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

