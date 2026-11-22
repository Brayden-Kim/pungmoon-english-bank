import React from 'react';
import { GraduationCap, ShieldCheck, UserCheck, ArrowRight, BookOpen } from 'lucide-react';

interface HeaderProps {
  currentMode: 'student' | 'teacher';
  onSwitchMode: (mode: 'student' | 'teacher') => void;
  studentName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onSwitchMode, studentName }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & School Badge */}
        <div 
          onClick={() => onSwitchMode('student')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">풍문고 2학년</span>
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">영어 내신 대비</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1">
              AI 영어 변형문제은행
            </h1>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentMode === 'student' ? (
            <>
              {studentName && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{studentName} 학생</span>
                </div>
              )}
              <button
                onClick={() => onSwitchMode('teacher')}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-all shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                <span>선생님 모드</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                관리자(교사용)
              </span>
              <button
                onClick={() => onSwitchMode('student')}
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-600 transition-all shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>학생 화면 보기</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
