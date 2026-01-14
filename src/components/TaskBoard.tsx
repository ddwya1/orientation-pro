import { Copy, CheckCircle2, Circle } from 'lucide-react';
import type { TaskGroup, ConversionTask, OrientationTarget } from '../types';
import { fieldsToTitles } from '../utils/fieldNames';

interface TaskBoardProps {
  taskGroups: TaskGroup[];
  selectedTask: ConversionTask | null;
  onSelectTask: (task: ConversionTask) => void;
  onCopyTask: (task: ConversionTask) => void;
  orientationTarget: OrientationTarget;
}

export default function TaskBoard({
  taskGroups,
  selectedTask,
  onSelectTask,
  onCopyTask,
  orientationTarget,
}: TaskBoardProps) {
  const totalTasks = taskGroups.reduce((sum, group) => sum + group.tasks.length, 0);
  const completedTasks = taskGroups.reduce(
    (sum, group) => sum + group.tasks.filter(t => t.completed).length,
    0
  );
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="bg-black/20 p-4 h-full overflow-y-auto custom-scrollbar relative">
      <div className="mb-6 sticky top-0 bg-surface/80 backdrop-blur-md z-10 pb-4 border-b border-white/5 -mx-4 px-4 pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <span className="w-2 h-2 bg-primary animate-ping rounded-full"></span>
            任务模块
          </h2>
          <span className="text-[10px] font-mono text-primary/40">v2.0.4-稳定版</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-textLight">
            <span className="uppercase">核心转换进度</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,242,255,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-primary/30 uppercase tracking-tighter">
            <span>{completedTasks} 已完成</span>
            <span>{totalTasks - completedTasks} 剩余</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-4">
        {taskGroups.map((group) => (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className={`w-1 h-3 rounded-full ${group.completed ? 'bg-accent' : 'bg-primary/40'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${group.completed ? 'text-accent' : 'text-textLight'}`}>
                {group.name}
              </span>
              {group.completed && <CheckCircle2 size={10} className="text-accent" />}
            </div>
            
            <div className="space-y-1">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                    selectedTask?.id === task.id
                      ? 'bg-primary/10 border-primary/50 neo-shadow'
                      : task.completed
                      ? 'bg-accent/5 border-accent/20 hover:border-accent/40'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                  onClick={() => onSelectTask(task)}
                >
                  <div className="flex items-center justify-between mb-1 relative z-10">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        task.completed 
                          ? 'bg-accent/20 border-accent/40 text-accent' 
                          : selectedTask?.id === task.id
                          ? 'bg-primary/20 border-primary/40 text-primary'
                          : 'bg-black/20 border-white/10 text-white/20 group-hover:text-white/40'
                      }`}>
                        {task.completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      </div>
                      <span className={`text-xs font-bold truncate ${selectedTask?.id === task.id ? 'text-white' : 'text-textLight'}`}>
                        {fieldsToTitles(task.fields).join(' + ')}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyTask(task);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Copy size={12} className="text-primary/60 hover:text-primary" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 pl-8">
                    <div className="text-[9px] font-mono text-white/30 group-hover:text-white/50 transition-colors uppercase tracking-tighter">
                      {task.range ? (
                        task.range.type === 'alternate_greetings' 
                          ? `备选问候语 [${task.range.start}-${task.range.end}]`
                          : `世界书条目 [${task.range.start}-${task.range.end}]`
                      ) : (
                        `数据流 [${task.content.length} 字节]`
                      )}
                    </div>
                    {selectedTask?.id === task.id && (
                      <div className="flex-1 h-[1px] bg-primary/20 animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

