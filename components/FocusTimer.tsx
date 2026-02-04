import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RefreshCw, CheckCircle } from 'lucide-react';

interface FocusTimerProps {
  onSessionComplete: (minutes: number) => void;
}

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;

export const FocusTimer: React.FC<FocusTimerProps> = ({ onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        onSessionComplete(25);
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
        setMode('break');
        setTimeLeft(SHORT_BREAK);
      } else {
        setMode('focus');
        setTimeLeft(POMODORO_TIME);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, onSessionComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(POMODORO_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = 100 - (timeLeft / (mode === 'focus' ? POMODORO_TIME : SHORT_BREAK)) * 100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        {mode === 'focus' ? 'Deep Work Mode' : 'Rest & Recharge'}
        {mode === 'focus' && <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>}
      </h3>
      
      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * ((100 - progressPercentage) / 100)}
            className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'text-indigo-600' : 'text-emerald-500'}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-5xl font-bold text-slate-700 font-mono">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={toggleTimer}
          className={`p-4 rounded-full text-white transition-colors shadow-lg ${
            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
        </button>
        <button
          onClick={resetTimer}
          className="p-4 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <RefreshCw size={24} />
        </button>
      </div>
      
      {mode === 'focus' && (
         <p className="mt-4 text-xs text-slate-400">
           Tip: Notifications are muted while timer is active.
         </p>
      )}
    </div>
  );
};
