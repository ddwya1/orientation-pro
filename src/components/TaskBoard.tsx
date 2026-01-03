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
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/50 p-3 sm:p-4 h-full overflow-y-auto shadow-xl glow-indigo">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
          任务看板
        </h2>
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400/80 mb-3">
          <span>进度: {completedTasks} / {totalTasks}</span>
          <span className="text-indigo-400 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-800/60 rounded-full h-2.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {taskGroups.map((group) => (
          <div key={group.id} className="border border-slate-800/50 rounded-xl overflow-hidden shadow-lg shadow-black/20 bg-slate-800/30 backdrop-blur-sm">
            <div
              className={`p-3 font-medium border-b border-slate-800/50 ${
                group.completed
                  ? 'bg-gradient-to-r from-emerald-900/40 to-green-900/30 text-emerald-400'
                  : 'bg-slate-800/50 text-slate-200'
              }`}
            >
              {group.name}
            </div>
            <div className="p-2 space-y-1">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                    selectedTask?.id === task.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 shadow-md shadow-indigo-500/20'
                      : task.completed
                      ? 'bg-slate-800/40 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50'
                      : 'bg-slate-800/20 hover:bg-slate-800/40 border border-transparent hover:border-slate-700/30'
                  }`}
                  onClick={() => onSelectTask(task)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {task.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 drop-shadow-sm" />
                      ) : (
                        <Circle size={16} className="text-slate-500/60 flex-shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                        {fieldsToTitles(task.fields).join(', ')}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyTask(task);
                      }}
                      className="p-1.5 sm:p-1 hover:bg-slate-700/60 rounded-lg transition-all flex-shrink-0 hover:scale-110"
                      title="复制任务"
                    >
                      <Copy size={16} className="text-slate-400/70 hover:text-indigo-400 transition-colors sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">
                    {task.range ? (
                      task.range.type === 'alternate_greetings' 
                        ? `备用开场白${task.range.start}~备用开场白${task.range.end}`
                        : `条目${task.range.start}~条目${task.range.end}`
                    ) : (
                      `${task.content.length} 字符`
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

