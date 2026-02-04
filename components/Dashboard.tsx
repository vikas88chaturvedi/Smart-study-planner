import React, { useMemo } from 'react';
import { Task, TaskStatus, UserStats, SubjectProgress, SUBJECT_COLORS } from '../types';
import { CheckCircle2, Circle, Flame, Calendar, AlertCircle, TrendingUp, Trophy } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  stats: UserStats;
  onTaskComplete: (taskId: string) => void;
  onReschedule: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, stats, onTaskComplete, onReschedule }) => {
  const today = new Date().toISOString().split('T')[0];

  const todaysTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate === today && t.status !== TaskStatus.COMPLETED);
  }, [tasks, today]);

  const missedTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate < today && t.status !== TaskStatus.COMPLETED);
  }, [tasks, today]);

  const completedToday = useMemo(() => {
    return tasks.filter(t => t.dueDate === today && t.status === TaskStatus.COMPLETED).length;
  }, [tasks, today]);

  const subjectProgress: SubjectProgress[] = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    tasks.forEach(t => {
      const entry = map.get(t.subject) || { total: 0, completed: 0 };
      entry.total++;
      if (t.status === TaskStatus.COMPLETED) entry.completed++;
      map.set(t.subject, entry);
    });
    
    return Array.from(map.entries()).map(([subject, data], index) => ({
      subject,
      totalTasks: data.total,
      completedTasks: data.completed,
      color: SUBJECT_COLORS[index % SUBJECT_COLORS.length]
    }));
  }, [tasks]);

  const vastuTip = useMemo(() => {
    const tips = [
      "Face East while studying to improve concentration.",
      "Keep your study desk clutter-free to reduce anxiety.",
      "Use yellow light for reading, white light for writing.",
      "Place a small plant on your desk for fresh oxygen."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 opacity-80 mb-1 text-sm font-medium">
              <Flame size={16} /> Daily Streak
            </div>
            <div className="text-3xl font-bold">{stats.streak} Days</div>
          </div>
          <Flame size={80} className="absolute -bottom-4 -right-4 opacity-20 text-white" />
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
           <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-medium">
            <CheckCircle2 size={16} /> Tasks Done
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-slate-800">{completedToday}</div>
            <div className="text-xs text-slate-400 mb-1">Today</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
           <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-medium">
            <Trophy size={16} /> Level {stats.level}
          </div>
          <div className="w-full">
            <div className="text-xs text-slate-400 mb-1 flex justify-between">
                <span>XP: {stats.xp}</span>
                <span>Next: {(stats.level + 1) * 100}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(stats.xp % 100)}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-amber-900 flex flex-col justify-center">
           <div className="flex items-center gap-2 text-amber-700 mb-1 text-sm font-medium">
             ✨ Tip of the Day
          </div>
          <div className="text-xs leading-relaxed italic opacity-90">"{vastuTip}"</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* My Day Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-indigo-600" /> My Day
              </h2>
              <p className="text-sm text-slate-500">Focus on what's due today.</p>
            </div>
            <span className="text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {missedTasks.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" />
                <div>
                  <h4 className="font-semibold text-red-900">Overdue Tasks ({missedTasks.length})</h4>
                  <p className="text-xs text-red-700">Let AI reschedule these to a better time.</p>
                </div>
              </div>
              <button 
                onClick={onReschedule}
                className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-red-50 border border-red-200 transition-colors whitespace-nowrap"
              >
                Smart Reschedule
              </button>
            </div>
          )}

          <div className="space-y-3">
            {todaysTasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <div className="inline-flex bg-green-100 p-4 rounded-full text-green-600 mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">All caught up!</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">No tasks remaining for today. This is a great time to recharge or get ahead.</p>
              </div>
            ) : (
              todaysTasks.map(task => (
                <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onTaskComplete(task.id)}
                      className="text-slate-300 hover:text-indigo-600 transition-colors transform hover:scale-110 duration-200"
                    >
                      <Circle size={24} strokeWidth={2} />
                    </button>
                    <div>
                      <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{task.title}</h4>
                      <div className="flex items-center gap-2 text-xs mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {task.subject}
                        </span>
                        {task.isSpacedRepetition && (
                           <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                             <RefreshCwIcon size={10}/> Review
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                      <div className="text-sm font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {task.durationMinutes}m
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Progress & Additional Info */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-600" />
                    Subject Progress
                </h3>
             </div>
             
             {subjectProgress.length === 0 ? (
                 <div className="text-center py-8 text-slate-400 text-sm">
                     No subjects added yet.
                 </div>
             ) : (
                <div className="space-y-5">
                    {subjectProgress.map((p) => {
                    const percent = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
                    return (
                        <div key={p.subject} className="group">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700 truncate max-w-[150px]">{p.subject}</span>
                            <span className="text-slate-500 font-mono text-xs">{p.completedTasks}/{p.totalTasks} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out relative" 
                            style={{ width: `${percent}%`, backgroundColor: p.color }}
                            >
                                <div className="absolute inset-0 bg-white opacity-20 w-full animate-pulse"></div>
                            </div>
                        </div>
                        </div>
                    );
                    })}
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCwIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
    </svg>
)