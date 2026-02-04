import React, { useState } from 'react';
import { Upload, FileText, Loader2, Wand2, WifiOff } from 'lucide-react';
import { parseSyllabusWithGemini } from '../services/geminiService';
import { Task } from '../types';

interface SyllabusUploaderProps {
  onTasksGenerated: (tasks: Task[]) => void;
}

export const SyllabusUploader: React.FC<SyllabusUploaderProps> = ({ onTasksGenerated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the Data URL prefix to get just base64
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleProcess = async () => {
    if (!navigator.onLine) {
        setError("You are currently offline. Please connect to the internet to use AI features.");
        return;
    }

    if (!file && !textInput) {
      setError("Please upload an image or paste syllabus text.");
      return;
    }
    
    // Check for API key in a real scenario, we are using process.env
    if (!process.env.API_KEY) {
        // In this demo, we can't actually inject it if it's missing, but we can alert the user to the "Select Key" flow if we were using it.
        // For now, assume it's there or handle error in service.
    }

    setLoading(true);
    setError(null);

    try {
      let imageBase64: string | null = null;
      if (file) {
        imageBase64 = await convertFileToBase64(file);
      }

      const tasks = await parseSyllabusWithGemini(imageBase64, textInput);
      onTasksGenerated(tasks);
      // Reset form
      setFile(null);
      setTextInput('');
    } catch (err: any) {
      setError(err.message || "Failed to process syllabus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
        <Wand2 className="text-indigo-500" /> Syllabus AI Parser
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Upload a screenshot of your course schedule or paste the text. AI will auto-schedule your exams and study sessions.
      </p>

      <div className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-center cursor-pointer relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-2">
             {file ? (
               <div className="text-indigo-600 font-medium flex items-center gap-2">
                 <FileText size={20} />
                 {file.name}
               </div>
             ) : (
               <>
                 <div className="bg-indigo-50 p-3 rounded-full text-indigo-500">
                    <Upload size={24} />
                 </div>
                 <span className="text-slate-600 font-medium">Click to upload image</span>
                 <span className="text-xs text-slate-400">PNG, JPG up to 5MB</span>
               </>
             )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">Or paste text</span>
          </div>
        </div>

        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste syllabus text here (e.g. 'Week 5: Midterm Exam on Oct 12...')"
          className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-24"
        />

        {error && (
          <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${error.includes('offline') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
            {error.includes('offline') && <WifiOff size={16}/>}
            {error}
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Parsing Syllabus...
            </>
          ) : (
            'Generate Schedule'
          )}
        </button>
      </div>
    </div>
  );
};