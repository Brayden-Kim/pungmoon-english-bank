import React, { useEffect, useState } from 'react';
import { StudentSubmission, QuestionGradingResult, Question } from '../../types/exam';
import { storage } from '../../services/storage';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Lightbulb, 
  RotateCcw, 
  Home, 
  Calendar, 
  Award, 
  HelpCircle,
  Flame,
  ArrowRight
} from 'lucide-react';

interface ExamResultProps {
  submission: StudentSubmission;
  onRetakeIncorrect: (incorrectQuestions: Question[]) => void;
  onGoHome: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({
  submission,
  onRetakeIncorrect,
  onGoHome,
}) => {
  const { totalScore, correctCount, totalQuestions, studentName, examTitle, questionResults, mode } = submission;
  const [remainingVaultCount, setRemainingVaultCount] = useState<number>(0);
  const [currentVaultList, setCurrentVaultList] = useState<Question[]>([]);

  useEffect(() => {
    // 1. 오답 보관함 동기화
    // 맞힌 문제 ID 추출 -> 보관함에서 삭제
    const correctIds = questionResults.filter((qr) => qr.isCorrect).map((qr) => qr.questionId);
    // 틀린 문제 원본 추출 -> 보관함에 추가
    const incorrectQuestions = questionResults.filter((qr) => !qr.isCorrect).map((qr) => qr.rawQuestion);

    const syncVault = async () => {
      if (correctIds.length > 0) {
        await storage.removeCorrectQuestions(studentName, correctIds);
      }
      if (incorrectQuestions.length > 0) {
        await storage.addIncorrectQuestions(studentName, incorrectQuestions);
      }
      const updatedVault = await storage.getIncorrectQuestions(studentName);
      setRemainingVaultCount(updatedVault.length);
      setCurrentVaultList(updatedVault);

      // 만약 80점 이상이거나 오답 완전 정복(보관함 0개)인 경우 confetti 폭죽!
      if (totalScore >= 80 || (mode === 'incorrect_quest' && updatedVault.length === 0)) {
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
    };

    syncVault();
  }, [submission]);

  const isQuestCleared = mode === 'incorrect_quest' && remainingVaultCount === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Score Hero Card */}
      <div className={`relative overflow-hidden text-white p-6 sm:p-10 rounded-3xl shadow-xl border ${
        isQuestCleared
          ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-indigo-950 border-amber-400/40'
          : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-blue-900/50'
      }`}>
        <div className="relative z-10 text-center max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-semibold backdrop-blur-xs">
            {mode === 'incorrect_quest' ? (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>오답 완전 정복 퀘스트 채점표</span>
              </>
            ) : (
              <>
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>풍문고 영어 셔플 모의고사 성적표</span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-2">
            {examTitle}
          </h2>

          {/* Big Score Display */}
          <div className="py-2">
            <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-200 tracking-tighter">
              {totalScore}<span className="text-3xl sm:text-4xl font-bold text-blue-300/80">점</span>
            </div>
            <div className="text-sm sm:text-base text-slate-300 mt-1 font-medium">
              총 {totalQuestions}문항 중 <strong className="text-emerald-400 font-bold">{correctCount}문항 정답</strong>
            </div>
          </div>

          {/* Quest Status Announcement */}
          {isQuestCleared ? (
            <div className="p-4 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-200 space-y-1">
              <div className="text-lg font-black text-amber-300 flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
                <span>🎉 오답 0개 완전 정복 완료!</span>
              </div>
              <p className="text-xs text-amber-100">
                축하합니다! 보관함에 있던 모든 오답을 마스터했습니다.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-xs text-slate-200 flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>
                현재 {studentName} 학생의 오답 보관함 잔여 문항: <strong className="text-amber-300 font-bold text-sm">{remainingVaultCount}문제</strong>
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-400" />
              <span>응시자: <strong className="text-slate-200">{studentName}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{new Date(submission.submittedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-slate-800/80 mt-6">
          {remainingVaultCount > 0 ? (
            <button
              type="button"
              onClick={() => onRetakeIncorrect(currentVaultList)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-500/30 transition-all hover:scale-102 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>남은 오답 {remainingVaultCount}문제 바로 계속 풀기</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>모의고사 목록으로 돌아가기</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>홈으로</span>
          </button>
        </div>
      </div>

      {/* Coaching & Question Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>문항별 정오답 및 선생님의 '왜?' 코칭 해설</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            풍문고 내신 1등급 원리 분석
          </span>
        </div>

        <div className="space-y-6">
          {questionResults.map((result: QuestionGradingResult, idx: number) => {
            const isCorrect = result.isCorrect;

            return (
              <div
                key={result.questionId || idx}
                className={`bg-white rounded-3xl border-2 transition-all p-5 sm:p-7 shadow-sm ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      {result.unit}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {result.passageTitle}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {result.subType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        정답 (정복 완료)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        오답 (보관함에 저장됨)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Info */}
                <div className="space-y-3 mb-5">
                  {result.rawQuestion.type === 'multiple_choice' && (
                    <>
                      {result.rawQuestion.passage && (
                        <div className="p-4 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans border border-slate-200/60 max-h-48 overflow-y-auto">
                          {result.rawQuestion.passage}
                        </div>
                      )}
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        {result.rawQuestion.question}
                      </h4>
                    </>
                  )}

                  {result.rawQuestion.type === 'scramble' && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                      <div className="text-xs font-bold text-amber-800 mb-1">한국어 해석:</div>
                      <p className="text-sm sm:text-base font-bold text-slate-800">
                        "{result.rawQuestion.korean}"
                      </p>
                    </div>
                  )}

                  {result.rawQuestion.type === 'grammar_select' && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                      <div className="text-xs font-bold text-indigo-800 mb-1">어법 선택 문장:</div>
                      <p className="text-sm sm:text-base font-medium text-slate-800">
                        {(result.rawQuestion as any).sentenceParts?.map((part: string, pIdx: number) => {
                          const pair = (result.rawQuestion as any).choices?.[pIdx];
                          return (
                            <React.Fragment key={pIdx}>
                              <span>{part}</span>
                              {pair && (
                                <span className="font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 mx-1">
                                  [{pair[0]} / {pair[1]}]
                                </span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Compare: Student Answer vs Correct Answer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div className={`p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-slate-600">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>내가 제출한 답안</span>
                    </div>
                    <div className={`text-sm sm:text-base font-bold break-words ${isCorrect ? 'text-emerald-900' : 'text-rose-900 line-through'}`}>
                      {String(result.studentAnswer)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-blue-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>선생님의 실제 정답</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-blue-950 break-words">
                      {String(result.correctAnswer)}
                    </div>
                  </div>
                </div>

                {/* Coaching Explanation Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-wide mb-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-100" />
                    <span>선생님의 '왜?' 구문 & 어법 코칭 해설</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans font-normal">
                    {result.explanation || '등록된 해설이 없습니다.'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
