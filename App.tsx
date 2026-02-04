import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Timer, Settings, Plus, GraduationCap, WifiOff } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { FocusTimer } from './components/FocusTimer';
import { SyllabusUploader } from './components/SyllabusUploader';
import { Task, UserStats, TaskStatus, TaskType } from './types';
import { suggestRescheduling } from './services/geminiService';

// Mock initial data if storage is empty
const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Intro to Psychology Reading',
    subject: 'Psychology 101',
    dueDate: new Date().toISOString().split('T')[0],
    durationMinutes: 45,
    status: TaskStatus.TODO,
    type: TaskType.STUDY_SESSION,
    priority: 'medium',
  },
  {
    id: '2',
    title: 'Calculus Problem Set 3',
    subject: 'Calculus II',
    dueDate: new Date().toISOString().split('T')[0],
    durationMinutes: 90,
    status: TaskStatus.TODO,
    type: TaskType.ASSIGNMENT,
    priority: 'high',
  }
];

const INITIAL_STATS: UserStats = {
  streak: 3,
  xp: 450,
  totalFocusMinutes: 120,
  level: 4,
  badges: ['Early Bird']
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'focus' | 'syllabus'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [hasCheckedKey, setHasCheckedKey] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Load state from local storage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('ssp_tasks');
    const savedStats = localStorage.getItem('ssp_stats');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    else setTasks(INITIAL_TASKS);

    if (savedStats) setStats(JSON.parse(savedStats));
    
    // Check key on mount (simulated)
    const checkKey = async () => {
      // In a real app with proper window.aistudio types we would check:
      // if (window.aistudio && await window.aistudio.hasSelectedApiKey()) ...
      // Here we assume if env is set we are good, otherwise we'd prompt.
      // Since we can't interact with the real `window.aistudio` object in this generated iframe env properly without it being injected,
      // we'll rely on the process.env.API_KEY being present or user handling it.
      setHasCheckedKey(true);
    };
    checkKey();

    // Offline status detection
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save state on change
  useEffect(() => {
    if (tasks.length > 0) localStorage.setItem('ssp_tasks', JSON.stringify(tasks));
    localStorage.setItem('ssp_stats', JSON.stringify(stats));
  }, [tasks, stats]);

  const handleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: TaskStatus.COMPLETED } : t
    ));
    
    // Award XP
    setStats(prev => ({
      ...prev,
      xp: prev.xp + 50,
      streak: prev.streak // Logic to update streak would go here (check if already incremented today)
    }));
    
    // Spaced Repetition Logic
    const completedTask = tasks.find(t => t.id === taskId);
    if (completedTask && completedTask.type === TaskType.STUDY_SESSION) {
      scheduleReview(completedTask);
    }
  };

  const scheduleReview = (originalTask: Task) => {
    // Schedule reviews 1 day, 7 days later
    const reviews = [1, 7].map(days => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return {
        id: crypto.randomUUID(),
        title: `Review: ${originalTask.title}`,
        subject: originalTask.subject,
        dueDate: date.toISOString().split('T')[0],
        durationMinutes: 20, // Shorter for review
        status: TaskStatus.TODO,
        type: TaskType.REVIEW,
        priority: 'medium',
        isSpacedRepetition: true
      } as Task;
    });
    
    setTasks(prev => [...prev, ...reviews]);
  };

  const handleFocusComplete = (minutes: number) => {
    setStats(prev => ({
      ...prev,
      totalFocusMinutes: prev.totalFocusMinutes + minutes,
      xp: prev.xp + (minutes * 2) // 2 XP per minute of focus
    }));
  };

  const handleTasksGenerated = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
    setActiveTab('dashboard');
  };

  const handleReschedule = async () => {
    if (!isOnline) {
        alert("Smart rescheduling requires an internet connection.");
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    const missed = tasks.filter(t => t.dueDate < today && t.status !== TaskStatus.COMPLETED);
    
    if (missed.length === 0) return;

    // Optimistic update notification or loading state could go here
    const rescheduled = await suggestRescheduling(missed, tasks);
    
    setTasks(prev => {
      const remaining = prev.filter(t => !missed.find(m => m.id === t.id));
      return [...remaining, ...rescheduled];
    });
  };

  const openKeySelection = async () => {
    if ((window as any).aistudio) {
        try {
            await (window as any).aistudio.openSelectKey();
            window.location.reload(); // Reload to pick up the new key in env if necessary
        } catch (e) {
            console.error("Failed to select key", e);
        }
    } else {
        alert("API Key selection not available in this environment. Please ensure API_KEY is set.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center py-1 text-sm font-medium flex items-center justify-center gap-2 shadow-md">
            <WifiOff size={16} />
            <span>You are offline. Planner is working in local mode.</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 fixed bottom-0 md:relative md:h-screen z-50 md:flex md:flex-col justify-between">
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-3 text-indigo-600 font-bold text-xl">
            <GraduationCap size={28} />
            <span>SmartStudy</span>
          </div>
        </div>

        <nav className="flex md:flex-col justify-around md:justify-start md:px-4 gap-1 p-2 md:p-0 bg-white border-t md:border-t-0 border-slate-200">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="My Day" 
          />
          <NavButton 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
            icon={<CalendarIcon size={20} />} 
            label="Schedule" 
          />
          <NavButton 
            active={activeTab === 'focus'} 
            onClick={() => setActiveTab('focus')} 
            icon={<Timer size={20} />} 
            label="Focus" 
          />
           <NavButton 
            active={activeTab === 'syllabus'} 
            onClick={() => setActiveTab('syllabus')} 
            icon={<Plus size={20} />} 
            label="Add Course" 
          />
        </nav>

        <div className="p-6 hidden md:block">
            <div className="bg-slate-900 rounded-xl p-4 text-white">
                <p className="text-xs font-medium text-slate-400 mb-2">PRO PLAN</p>
                <p className="text-sm mb-3">Get unlimited AI scans and advanced analytics.</p>
                <button className="w-full bg-indigo-500 hover:bg-indigo-600 py-2 rounded-lg text-xs font-bold transition-colors">
                    Upgrade to Degree Pass
                </button>
            </div>
            {/* API Key Trigger for Demo */}
            <button onClick={openKeySelection} className="mt-4 text-xs text-slate-400 underline w-full text-center">
                Manage API Key
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0 pt-8 md:pt-8">
        <div className="max-w-5xl mx-auto">
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              tasks={tasks} 
              stats={stats} 
              onTaskComplete={handleTaskComplete}
              onReschedule={handleReschedule}
            />
          )}

          {activeTab === 'focus' && (
            <div className="max-w-md mx-auto mt-12">
               <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Focus Session</h2>
               <FocusTimer onSessionComplete={handleFocusComplete} />
               <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-semibold mb-4 text-slate-700">Recent Activity</h3>
                  <div className="text-sm text-slate-500">
                    You have focused for <span className="font-bold text-indigo-600">{stats.totalFocusMinutes} minutes</span> total.
                    Keep it up to unlock the "Deep Work" badge!
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'syllabus' && (
             <div className="max-w-2xl mx-auto mt-8">
                 <h2 className="text-2xl font-bold text-slate-800 mb-6">Import Syllabus</h2>
                 <SyllabusUploader onTasksGenerated={handleTasksGenerated} />
             </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-slate-800">Full Schedule</h2>
                 <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="space-y-4">
                        {tasks.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(task => (
                            <div key={task.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                                <div className="w-24 text-sm font-mono text-slate-500">
                                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className={`w-3 h-3 rounded-full ${task.status === TaskStatus.COMPLETED ? 'bg-emerald-400' : 'bg-indigo-400'}`}></div>
                                <div className="flex-1">
                                    <div className={`font-medium ${task.status === TaskStatus.COMPLETED ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</div>
                                    <div className="text-xs text-slate-400">{task.subject}</div>
                                </div>
                                <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                                    {task.type}
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && <p className="text-slate-400 text-center">No tasks found. Upload a syllabus!</p>}
                    </div>
                 </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center md:gap-3 p-3 md:px-4 md:py-3 rounded-xl transition-all ${
      active 
        ? 'bg-indigo-50 text-indigo-600 font-semibold' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}
  >
    {icon}
    <span className="text-xs md:text-sm hidden md:inline">{label}</span>
  </button>
);