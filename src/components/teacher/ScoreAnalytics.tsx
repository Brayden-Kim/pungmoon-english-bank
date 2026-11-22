import React, { useState } from 'react';
import { StudentSubmission, QuestionGradingResult } from '../../types/exam';
import { 
  Users, 
  BarChart3, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  X,
  Lightbulb,
  Award,
  Filter,
  Sparkles
} from 'lucide-react';

interface ScoreAnalyticsProps {
  submissions: StudentSubmission[];
  onDeleteSubmission?: (id: string) => void;
}

export const ScoreAnalytics: React.FC<ScoreAnalyticsProps> = ({
  submissions,
  onDeleteSubmission,
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');
  const [activeModalSub, setActiveModalSub] = useState<StudentSubmission | null>(null);

  // 필터링된 제출 데이터
  const filteredSubmissions = submissions.filter((sub) => {
    const matchMode = selectedMode === 'all' || sub.mode === selectedMode;
    const matchName = !searchName.trim() || sub.studentName.toLowerCase().includes(searchName.trim().toLowerCase());
    return matchMode && matchName;
  });

  // 평균 점수 계산
  const avgScore = filteredSubmissions.length > 0
    ? Math.round(filteredSubmissions.reduce((acc, cur) => acc + cur.totalScore, 0) / filteredSubmissions.length)
    : 0;

  // 80점 이상 비율
  const highScorersCount = filteredSubmissions.filter((s) => s.totalScore >= 80).length;
  const highScorersRate = filteredSubmissions.length > 0
    ? Math.round((highScorersCount / filteredSubmissions.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">총 응시 건수</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {filteredSubmissions.length} <span className="text-sm font-semibold text-slate-500">회</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">응시생 평균 점수</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {avgScore} <span className="text-sm font-semibold text-slate-500">점</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">1~2등급권 (80점 이상)</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {highScorersRate}% <span className="text-sm font-semibold text-slate-500">({highScorersCount}명)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-hidden"
          >
            <option value="all">전체 학습 모드 (모의고사 + 오답 퀘스트)</option>
            <option value="random_shuffle">랜덤 셔플 모의고사</option>
            <option value="incorrect_quest">오답 완전 정복 퀘스트</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="학생 이름 검색..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3.5 px-4 sm:px-6">학생 이름</th>
                <th className="py-3.5 px-4">학습 모드</th>
                <th className="py-3.5 px-4">시험지명</th>
                <th className="py-3.5 px-4 text-center">점수</th>
                <th className="py-3.5 px-4 text-center">정답수</th>
                <th className="py-3.5 px-4">문항별 정오답</th>
                <th className="py-3.5 px-4">응시 일시</th>
                <th className="py-3.5 px-4 text-center">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    제출된 학생 응시 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                      {sub.studentName}
                    </td>

                    <td className="py-3.5 px-4">
                      {sub.mode === 'incorrect_quest' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          <Sparkles className="w-3 h-3 text-rose-500" />
                          오답 정복
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          랜덤 셔플
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[200px] truncate" title={sub.examTitle}>
                      {sub.examTitle}
                    </td>

                    <td className="py-3.5 px-4 text-center font-black">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                        sub.totalScore >= 80 ? 'bg-emerald-100 text-emerald-800' : sub.totalScore >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sub.totalScore}점
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                      {sub.correctCount} / {sub.totalQuestions}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {sub.questionResults.map((qr, qIdx) => (
                          <span
                            key={qr.questionId || qIdx}
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                              qr.isCorrect
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                : 'bg-rose-100 text-rose-700 border border-rose-300'
                            }`}
                            title={`Q${qIdx + 1}: ${qr.isCorrect ? '정답' : '오답'}`}
                          >
                            {qr.isCorrect ? 'O' : 'X'}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {new Date(sub.submittedAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveModalSub(sub)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                        >
                          오답 확인
                        </button>
                        {onDeleteSubmission && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('이 응시 기록을 삭제하시겠습니까?')) {
                                onDeleteSubmission(sub.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="기록 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Result Detail Modal */}
      {activeModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  응시 상세 분석
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {activeModalSub.studentName} 학생의 제출 답안 & 오답 코칭
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  {activeModalSub.examTitle} · 총점 <strong className="text-blue-600">{activeModalSub.totalScore}점</strong> ({activeModalSub.correctCount}/{activeModalSub.totalQuestions})
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalSub(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {activeModalSub.questionResults.map((qr, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border-2 space-y-2.5 ${
                    qr.isCorrect ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">문항 {idx + 1} ({qr.unit} · {qr.passageTitle} · {qr.subType})</span>
                    <span className={qr.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                      {qr.isCorrect ? '✓ 정답' : '✗ 오답'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-500 block mb-0.5">학생 답안:</span>
                      <span className={qr.isCorrect ? 'text-emerald-800 font-semibold' : 'text-rose-700 font-bold'}>
                        {String(qr.studentAnswer)}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-500 block mb-0.5">정답:</span>
                      <span className="text-blue-800 font-bold">{String(qr.correctAnswer)}</span>
                    </div>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl text-xs text-slate-700 border border-slate-200/80 whitespace-pre-line leading-relaxed">
                    <div className="font-bold text-blue-700 flex items-center gap-1 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>선생님의 '왜?' 코칭 해설:</span>
                    </div>
                    {qr.explanation}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalSub(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
