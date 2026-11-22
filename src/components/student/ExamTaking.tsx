import React, { useState } from 'react';
import { Question, QuestionGradingResult, StudentSubmission, ScrambleQuestion, GrammarSelectQuestion } from '../../types/exam';
import { MultipleChoiceItem } from './MultipleChoiceItem';
import { ScrambleItem } from './ScrambleItem';
import { GrammarSelectItem } from './GrammarSelectItem';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, ArrowLeft, Flame, Shuffle } from 'lucide-react';

interface ExamTakingProps {
  questions: Question[];
  title: string;
  mode: 'random_shuffle' | 'incorrect_quest';
  studentName: string;
  onComplete: (submission: StudentSubmission) => void;
  onExit: () => void;
}

// 문장 배열 채점을 위한 정규화 함수
function normalizeSentence(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const ExamTaking: React.FC<ExamTakingProps> = ({
  questions,
  title,
  mode,
  studentName,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentQuestion: Question | undefined = questions[currentIndex];
  const totalCount = questions.length;

  if (!currentQuestion) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">문항이 없습니다.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">돌아가기</button>
      </div>
    );
  }

  // 각 문항 유형별 답변 여부 체크
  const isQuestionAnswered = (q: Question): boolean => {
    const ans = answers[q.id];
    if (ans === undefined || ans === null) return false;
    if (q.type === 'multiple_choice') return typeof ans === 'number';
    if (q.type === 'scramble') return Array.isArray(ans) && ans.length === (q as ScrambleQuestion).chunks.length;
    if (q.type === 'grammar_select') {
      const gs = q as GrammarSelectQuestion;
      return Array.isArray(ans) && ans.length === gs.choices.length && ans.every((item) => !!item);
    }
    return false;
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalCount) * 100);

  const handleUpdateAnswer = (val: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  // 자동 채점 및 제출
  const handleSubmitExam = () => {
    let correctCount = 0;

    const questionResults: QuestionGradingResult[] = questions.map((q) => {
      const rawAns = answers[q.id];
      let isCorrect = false;
      let studentDisplayAnswer: any = rawAns;
      let correctDisplayAnswer: any = '';

      if (q.type === 'multiple_choice') {
        isCorrect = rawAns === q.answer;
        studentDisplayAnswer = typeof rawAns === 'number' ? `${rawAns + 1}번 (${q.options[rawAns]})` : '미응답';
        correctDisplayAnswer = `${q.answer + 1}번 (${q.options[q.answer]})`;
      } else if (q.type === 'scramble') {
        const sc = q as ScrambleQuestion;
        const studentAssembled = Array.isArray(rawAns)
          ? rawAns.map((i: number) => sc.chunks[i]).join(' ')
          : '';
        isCorrect = normalizeSentence(studentAssembled) === normalizeSentence(sc.answer);
        studentDisplayAnswer = studentAssembled || '미응답';
        correctDisplayAnswer = sc.answer;
      } else if (q.type === 'grammar_select') {
        const gs = q as GrammarSelectQuestion;
        const studentArr = Array.isArray(rawAns) ? rawAns : [];
        isCorrect =
          studentArr.length === gs.answers.length &&
          studentArr.every((choice, idx) => choice === gs.answers[idx]);
        studentDisplayAnswer = studentArr.length ? studentArr.join(', ') : '미응답';
        correctDisplayAnswer = gs.answers.join(', ');
      }

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        questionType: q.type,
        unit: q.unit,
        passageTitle: q.passageTitle,
        subType: q.subType,
        isCorrect,
        studentAnswer: studentDisplayAnswer,
        correctAnswer: correctDisplayAnswer,
        explanation: q.explanation,
        rawQuestion: q,
      };
    });

    const totalScore = Math.round((correctCount / totalCount) * 100);

    const submission: StudentSubmission = {
      id: `sub-${Date.now()}`,
      examTitle: title,
      mode,
      studentName,
      submittedAt: new Date().toISOString(),
      totalScore,
      correctCount,
      totalQuestions: totalCount,
      questionResults,
    };

    onComplete(submission);
  };

  const handleNextOrSubmit = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (answeredCount < totalCount) {
        setShowConfirmModal(true);
      } else {
        handleSubmitExam();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Bar: Title & Exit */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="시험 나가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              {mode === 'incorrect_quest' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  오답 완전 정복 퀘스트
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                  랜덤 셔플 실전 모의고사
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 mt-0.5">
              {title}
            </h2>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500">응시 학생</div>
          <div className="text-sm sm:text-base font-bold text-slate-800">{studentName}</div>
        </div>
      </div>

      {/* Progress & Question Numbers */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">
              문항 <strong className="text-blue-600">{currentIndex + 1}</strong> / {totalCount}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {currentQuestion.unit} · {currentQuestion.passageTitle}
            </span>
          </div>
          <span className="text-slate-500">
            답변 완료 {answeredCount} / {totalCount} 문항 ({progressPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              mode === 'incorrect_quest'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = isQuestionAnswered(q);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 shrink-0 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? mode === 'incorrect_quest'
                      ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-2'
                      : 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2'
                    : isAnswered
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Question Body Card */}
      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
        {currentQuestion.type === 'multiple_choice' && (
          <MultipleChoiceItem
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id] ?? null}
            onSelect={handleUpdateAnswer}
          />
        )}

        {currentQuestion.type === 'scramble' && (
          <ScrambleItem
            question={currentQuestion as ScrambleQuestion}
            selectedIndices={answers[currentQuestion.id] || []}
            onChange={handleUpdateAnswer}
          />
        )}

        {currentQuestion.type === 'grammar_select' && (
          <GrammarSelectItem
            question={currentQuestion as GrammarSelectQuestion}
            selectedAnswers={answers[currentQuestion.id] || []}
            onChange={handleUpdateAnswer}
          />
        )}
      </div>

      {/* Bottom Sticky Action Navigation */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-lg">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>이전 문제</span>
        </button>

        <div className="text-xs font-semibold text-slate-400 hidden sm:block">
          풍문고 영어 내신 AI 원리 코칭
        </div>

        {currentIndex < totalCount - 1 ? (
          <button
            type="button"
            onClick={handleNextOrSubmit}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs sm:text-sm text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg cursor-pointer"
          >
            <span>다음 문제</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNextOrSubmit}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs sm:text-sm text-white shadow-md shadow-emerald-500/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>답안 제출 및 자동 채점</span>
          </button>
        )}
      </div>

      {/* Incomplete Warning Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">미답변 문제가 있습니다</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                총 {totalCount}문항 중 <strong className="text-amber-600">{totalCount - answeredCount}문항</strong>에 아직 답을 선택하지 않았습니다. 그래도 제출하시겠습니까?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                돌아가서 풀기
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmitExam();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-500/20"
              >
                그냥 제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
