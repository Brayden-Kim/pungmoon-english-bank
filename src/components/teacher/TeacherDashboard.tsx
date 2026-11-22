import React, { useState } from 'react';
import { ExamSet, StudentSubmission, Question } from '../../types/exam';
import { JsonUploader } from './JsonUploader';
import { ScoreAnalytics } from './ScoreAnalytics';
import { 
  FileCode2, 
  Layers, 
  FileSpreadsheet, 
  Trash2, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle,
  Hash,
  FolderOpen
} from 'lucide-react';

interface TeacherDashboardProps {
  examSets: ExamSet[];
  allQuestions: Question[];
  submissions: StudentSubmission[];
  onRegisterExamSet: (newSet: ExamSet) => void;
  onDeleteExamSet: (id: string) => void;
  onDeleteSubmission: (id: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  examSets,
  allQuestions,
  submissions,
  onRegisterExamSet,
  onDeleteExamSet,
  onDeleteSubmission,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'analytics'>('upload');

  // 등록된 고유 Unit 목록
  const units = Array.from(new Set(allQuestions.map((q) => q.unit))).filter(Boolean);
  const mcCount = allQuestions.filter((q) => q.type === 'multiple_choice').length;
  const scCount = allQuestions.filter((q) => q.type === 'scramble').length;
  const gsCount = allQuestions.filter((q) => q.type === 'grammar_select').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Stats Overview */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            선생님 전용 관리 포털
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            풍문고 2학년 영어 변형문제은행 통합 관리기
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            외부에서 생성한 JSON 문제 데이터를 업로드하면 학생 모드의 랜덤 셔플 모의고사와 오답 정복 퀘스트에 즉시 반영됩니다.
          </p>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              <span>전체 등록 문항</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {allQuestions.length} <span className="text-xs font-semibold text-slate-500">문제</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>학생 총 응시 횟수</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {submissions.length} <span className="text-xs font-semibold text-slate-500">회</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>등록된 세트</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {examSets.length} <span className="text-xs font-semibold text-slate-500">개 세트</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>유형별 구성</span>
            </div>
            <div className="text-xs font-bold text-slate-700 space-y-0.5">
              <div>객관식 <span className="text-blue-600">{mcCount}</span></div>
              <div>배열 <span className="text-amber-600">{scCount}</span> · 어법 <span className="text-indigo-600">{gsCount}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>JSON 문제 일괄 등록 (업로더)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'manage'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>등록된 세트 목록 관리 ({examSets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>학생 응시 및 오답 통계 ({submissions.length})</span>
        </button>
      </div>

      {/* Tab 1: JSON Uploader */}
      {activeTab === 'upload' && (
        <JsonUploader onExamSetRegistered={onRegisterExamSet} />
      )}

      {/* Tab 2: Manage Registered Sets */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              현재 등록된 문제 세트 목록 ({examSets.length}개 세트 / 총 {allQuestions.length}문항)
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + 새 JSON 추가 등록
            </button>
          </div>

          {examSets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              등록된 문제 세트가 없습니다. [JSON 문제 일괄 등록]에서 문제를 추가해 주세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examSets.map((set) => {
                const setUnits = Array.from(new Set(set.questions.map((q) => q.unit))).filter(Boolean);
                const setMc = set.questions.filter((q) => q.type === 'multiple_choice').length;
                const setSc = set.questions.filter((q) => q.type === 'scramble').length;
                const setGs = set.questions.filter((q) => q.type === 'grammar_select').length;

                return (
                  <div
                    key={set.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          총 {set.questions.length}문항 탑재
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(set.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 leading-snug">
                        {set.title}
                      </h4>

                      {/* Units badge */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {setUnits.map((u) => (
                          <span key={u} className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {u}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-medium">
                        <span>객관식: <strong className="text-slate-800">{setMc}</strong></span>
                        <span>·</span>
                        <span>배열: <strong className="text-slate-800">{setSc}</strong></span>
                        <span>·</span>
                        <span>어법: <strong className="text-slate-800">{setGs}</strong></span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {set.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`'${set.title}' 세트를 정말 삭제하시겠습니까?`)) {
                            onDeleteExamSet(set.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>세트 삭제</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Student Analytics */}
      {activeTab === 'analytics' && (
        <ScoreAnalytics
          submissions={submissions}
          onDeleteSubmission={onDeleteSubmission}
        />
      )}
    </div>
  );
};
