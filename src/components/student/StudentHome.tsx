import React, { useState, useEffect } from 'react';
import { Question, StudentSubmission } from '../../types/exam';
import { storage } from '../../services/storage';
import { 
  Sparkles, 
  Shuffle, 
  Flame, 
  Award, 
  User, 
  ArrowRight, 
  RotateCcw,
  Trophy,
  ShieldCheck,
  FileQuestion,
  Hash
} from 'lucide-react';

interface StudentHomeProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  allQuestions: Question[];
  onStartExam: (questions: Question[], title: string, mode: 'random_shuffle' | 'incorrect_quest') => void;
  submissions: StudentSubmission[];
  onViewSubmission: (sub: StudentSubmission) => void;
  onOpenTeacherMode?: () => void;
}

// 피셔-예이츠 셔플 알고리즘
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  studentName,
  onStudentNameChange,
  allQuestions,
  onStartExam,
  submissions,
  onViewSubmission,
  onOpenTeacherMode,
}) => {
  const [nameInput, setNameInput] = useState(studentName);
  const [nameError, setNameError] = useState(false);

  // 문항 수 선택: 프리셋(5, 10, 20, 30, 'all') 또는 학생 직접 입력 숫자
  const [selectedCountPreset, setSelectedCountPreset] = useState<number | 'all' | 'custom'>(10);
  const [customCountInput, setCustomCountInput] = useState<string>('15');

  // 오답 보관함 상태
  const [incorrectList, setIncorrectList] = useState<Question[]>([]);
  const studentSubmissions = submissions.filter(
    (submission) =>
      submission.studentName.trim().replace(/\s+/g, '').toLowerCase()
      === studentName.trim().replace(/\s+/g, '').toLowerCase(),
  );

  // 학생 이름에 따른 오답 보관함 로드
  useEffect(() => {
    if (studentName.trim()) {
      storage.getIncorrectQuestions(studentName).then((list) => {
        setIncorrectList(list);
      });
    } else {
      setIncorrectList([]);
    }
  }, [studentName]);

  // 최종 출제할 문항 수 계산
  const getResolvedQuestionCount = (): number => {
    const totalAvailable = allQuestions.length;
    if (totalAvailable === 0) return 0;

    if (selectedCountPreset === 'all') {
      return totalAvailable;
    }
    if (selectedCountPreset === 'custom') {
      const parsed = parseInt(customCountInput, 10);
      if (isNaN(parsed) || parsed <= 0) return Math.min(10, totalAvailable);
      return Math.min(parsed, totalAvailable);
    }
    return Math.min(selectedCountPreset, totalAvailable);
  };

  // 모드 1: 랜덤 셔플 모의고사 시작
  const handleStartShuffle = () => {
    if (!nameInput.trim()) {
      setNameError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setNameError(false);
    onStudentNameChange(nameInput.trim());

    if (allQuestions.length === 0) {
      alert('현재 등록된 문제가 없습니다. 선생님 모드에서 JSON 문제 파일을 먼저 업로드해 주세요.');
      return;
    }

    const resolvedCount = getResolvedQuestionCount();
    if (resolvedCount <= 0) {
      alert('출제할 문항 수를 올바르게 입력해 주세요.');
      return;
    }

    const shuffled = shuffleArray(allQuestions);
    const selectedQuestions = shuffled.slice(0, resolvedCount);
    const examTitle = `[풍문고 실전 셔플 모의고사] ${selectedQuestions.length}문항`;

    onStartExam(selectedQuestions, examTitle, 'random_shuffle');
  };

  // 모드 2: 오답 완전 정복 퀘스트 시작
  const handleStartIncorrectQuest = () => {
    if (!nameInput.trim()) {
      setNameError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setNameError(false);
    onStudentNameChange(nameInput.trim());

    if (incorrectList.length === 0) {
      alert('현재 오답 보관함이 비어 있습니다! 먼저 모의고사를 풀어보세요.');
      return;
    }

    const shuffled = shuffleArray(incorrectList);
    const examTitle = `[오답 완전 정복 퀘스트] ${nameInput.trim()} 학생의 틀린 문제 다시 풀기 (${shuffled.length}제)`;

    onStartExam(shuffled, examTitle, 'incorrect_quest');
  };

  const hasQuestions = allQuestions.length > 0;
  const currentResolvedCount = getResolvedQuestionCount();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>풍문고 2학년 영어 내신 1등급 완벽 대비</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            스마트폰과 PC로 언제 어디서나<br />
            <span className="text-amber-300">풍문고 영어 변형문제은행</span>
          </h2>

          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            원하는 문항 수를 선택하거나 직접 입력해 무작위 셔플 모의고사를 치르고,
            틀린 문제는 <strong className="text-white underline decoration-amber-300 underline-offset-4 ml-1">오답이 0개가 될 때까지 무한 반복 정복</strong>하세요!
          </p>

          {/* Student Name Input Box */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-blue-100 mb-1.5">
              응시자 이름 (학생 성명을 입력해 주세요)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="예: 홍길동 (2학년 3반)"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  onBlur={() => {
                    if (nameInput.trim()) onStudentNameChange(nameInput.trim());
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm shadow-sm placeholder:text-slate-400 focus:outline-hidden ${
                    nameError ? 'ring-3 ring-rose-400' : 'focus:ring-2 focus:ring-amber-300'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (nameInput.trim()) {
                    onStudentNameChange(nameInput.trim());
                  }
                }}
                className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer shrink-0"
              >
                이름 확인
              </button>
            </div>
            {nameError && (
              <p className="text-rose-200 text-xs font-semibold mt-1.5 animate-pulse">
                ⚠️ 문제를 풀기 전 학생 이름을 먼저 입력해 주세요!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Empty State: If no questions uploaded yet */}
      {!hasQuestions && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-amber-300 p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              현재 문제 은행에 등록된 문제가 없습니다
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              외부(파이썬 스크립트 또는 Gemini)에서 생성한 JSON 문제 파일(<span className="font-mono font-bold text-slate-700">all_exams.json</span> 등)을 선생님 모드에서 등록하면 즉시 문제가 채워집니다.
            </p>
          </div>
          {onOpenTeacherMode && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenTeacherMode}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>선생님 모드로 이동하여 JSON 업로드하기</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Two Core Learning Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode 1: Random Shuffle Mock Exam (문항 수 선택 & 직접 입력만 남김) */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-blue-400 transition-all p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Shuffle className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                실전 무작위 셔플
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                ① 전체 랜덤 셔플 모의고사
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                등록된 문제 전체({allQuestions.length}제)에서 풀고 싶은 문항 수만큼 무작위로 섞어서 실전처럼 응시합니다.
              </p>
            </div>

            {/* Question Count Selection & Custom Input */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span>출제 문항 수 선택</span>
                </label>
                <span className="text-xs font-semibold text-blue-700">
                  선택: <strong>{currentResolvedCount}</strong>문제 출제
                </span>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {[5, 10, 20, 30].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setSelectedCountPreset(cnt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedCountPreset === cnt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cnt}제
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedCountPreset('all')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedCountPreset === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  전체 ({allQuestions.length})
                </button>
              </div>

              {/* Student Custom Input */}
              <div className="pt-1">
                <div 
                  onClick={() => setSelectedCountPreset('custom')}
                  className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    selectedCountPreset === 'custom'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <label className="text-xs font-bold text-slate-700 cursor-pointer">
                    ✍️ 학생 직접 문제 수 입력:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, allQuestions.length)}
                      value={customCountInput}
                      onFocus={() => setSelectedCountPreset('custom')}
                      onChange={(e) => {
                        setSelectedCountPreset('custom');
                        setCustomCountInput(e.target.value);
                      }}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-center bg-white focus:outline-hidden focus:border-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-600">문제</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={!hasQuestions}
              onClick={handleStartShuffle}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm sm:text-base shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>랜덤 셔플 모의고사 응시하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-center text-[11px] text-slate-400 mt-2">
              전체 {allQuestions.length}문제 중 {currentResolvedCount}문제가 무작위 순서로 출제됩니다
            </div>
          </div>
        </div>

        {/* Mode 2: Incorrect Vault Quest (Infinite Loop) */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-rose-400 transition-all p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                오답 0개 무한 루프
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                ② 오답 완전 정복 퀘스트 (무한 반복)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                틀린 문제만 모아 무작위로 다시 풉니다. 맞히면 보관함에서 지워지고, <strong>오답이 0개가 될 때까지 계속 반복</strong>됩니다!
              </p>
            </div>

            {/* Current Vault Status Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">
                  {nameInput ? `${nameInput} 학생의 오답 보관함` : '오답 보관함 현황'}
                </span>
                <span className="text-xs font-mono font-bold text-rose-600">
                  {incorrectList.length}문항 대기 중
                </span>
              </div>

              {incorrectList.length === 0 ? (
                <div className="p-4 rounded-xl bg-white text-center border border-emerald-200 space-y-1">
                  <div className="text-emerald-700 font-black text-base flex items-center justify-center gap-1.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>현재 틀린 문제가 0개입니다!</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    모든 문제를 정복했습니다. 모의고사를 풀어 새로운 오답을 정복해 보세요.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-rose-200 text-center space-y-1">
                  <div className="text-3xl font-black text-rose-600">
                    {incorrectList.length} <span className="text-sm font-bold text-slate-600">문제 미정복</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    다시 도전하여 정답을 맞히면 오답 보관함에서 즉시 삭제됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleStartIncorrectQuest}
              disabled={incorrectList.length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm sm:text-base shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>오답만 다시 풀기 ({incorrectList.length}문제)</span>
            </button>
            <div className="text-center text-[11px] text-slate-400 mt-2">
              틀린 문제들이 무작위 순서로 재출제됩니다
            </div>
          </div>
        </div>
      </div>

      {/* Submissions History */}
      {studentSubmissions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>최근 응시 성적 및 '왜?' 코칭 다시보기</span>
            </h3>
            <span className="text-xs text-slate-400">총 {studentSubmissions.length}회 기록</span>
          </div>

          <div className="divide-y divide-slate-100">
            {studentSubmissions.slice(0, 5).map((sub) => (
              <div
                key={sub.id}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl px-2 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      sub.mode === 'incorrect_quest' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sub.mode === 'incorrect_quest' ? '오답 정복' : '랜덤 셔플'}
                    </span>
                    <span className="text-sm font-bold text-slate-800 line-clamp-1">{sub.examTitle}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <span>{sub.studentName}</span>
                    <span>·</span>
                    <span>{new Date(sub.submittedAt).toLocaleString('ko-KR')}</span>
                    <span>·</span>
                    <span>정답 {sub.correctCount} / {sub.totalQuestions}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-lg font-black text-blue-600">{sub.totalScore}</span>
                    <span className="text-xs text-slate-500 font-bold">점</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewSubmission(sub)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white transition-all cursor-pointer"
                  >
                    해설 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
