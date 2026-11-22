import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PasswordModal } from './components/PasswordModal';
import { StudentHome } from './components/student/StudentHome';
import { ExamTaking } from './components/student/ExamTaking';
import { ExamResult } from './components/student/ExamResult';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { storage } from './services/storage';
import { ExamSet, Question, StudentSubmission } from './types/exam';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'student' | 'teacher'>('student');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('pungmoon_recent_student_name') || '';
  });

  // 전역 데이터 상태
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  // 학생 모드 네비게이션 상태 ('home' | 'exam' | 'result')
  const [studentView, setStudentView] = useState<'home' | 'exam' | 'result'>('home');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeExamTitle, setActiveExamTitle] = useState<string>('');
  const [activeExamMode, setActiveExamMode] = useState<'random_shuffle' | 'incorrect_quest'>('random_shuffle');
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);

  // 데이터 로드
  const loadData = async () => {
    const loadedSets = await storage.getExamSets();
    const loadedQuestions = await storage.getAllQuestions();
    const loadedSubmissions = await storage.getSubmissions();

    setExamSets(loadedSets);
    setAllQuestions(loadedQuestions);
    setSubmissions(loadedSubmissions);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentNameChange = (name: string) => {
    setStudentName(name);
    localStorage.setItem('pungmoon_recent_student_name', name);
  };

  // 모드 전환 시도
  const handleSwitchMode = (mode: 'student' | 'teacher') => {
    if (mode === 'teacher') {
      setIsPasswordModalOpen(true);
    } else {
      setCurrentMode('student');
    }
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    setCurrentMode('teacher');
  };

  // 학생 시험 시작 (랜덤 셔플 or 오답 퀘스트)
  const handleStartExam = (questions: Question[], title: string, mode: 'random_shuffle' | 'incorrect_quest') => {
    setActiveQuestions(questions);
    setActiveExamTitle(title);
    setActiveExamMode(mode);
    setStudentView('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 학생 시험 완료 및 제출
  const handleExamComplete = async (submission: StudentSubmission) => {
    await storage.saveSubmission(submission);
    setCurrentSubmission(submission);
    setStudentView('result');
    await loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 제출 이력 오답 상세 보기
  const handleViewSubmission = (sub: StudentSubmission) => {
    setCurrentSubmission(sub);
    setStudentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 남은 오답 바로 이어서 풀기
  const handleRetakeIncorrect = (incorrectQuestions: Question[]) => {
    if (incorrectQuestions.length === 0) {
      setStudentView('home');
      return;
    }
    const title = `[오답 완전 정복] ${studentName} 학생의 잔여 오답 정복 (${incorrectQuestions.length}제)`;
    handleStartExam(incorrectQuestions, title, 'incorrect_quest');
  };

  // 세트 등록 (선생님 모드)
  const handleRegisterExamSet = async (newSet: ExamSet) => {
    await storage.saveExamSet(newSet);
    await loadData();
  };

  // 세트 삭제 (선생님 모드)
  const handleDeleteExamSet = async (id: string) => {
    await storage.deleteExamSet(id);
    await loadData();
  };

  // 제출 기록 삭제 (선생님 모드)
  const handleDeleteSubmission = async (id: string) => {
    await storage.deleteSubmission(id);
    await loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      <Header
        currentMode={currentMode}
        onSwitchMode={handleSwitchMode}
        studentName={studentName}
      />

      <main className="flex-1 pb-16">
        {currentMode === 'teacher' ? (
          <TeacherDashboard
            examSets={examSets}
            allQuestions={allQuestions}
            submissions={submissions}
            onRegisterExamSet={handleRegisterExamSet}
            onDeleteExamSet={handleDeleteExamSet}
            onDeleteSubmission={handleDeleteSubmission}
          />
        ) : (
          <>
            {studentView === 'home' && (
              <StudentHome
                studentName={studentName}
                onStudentNameChange={handleStudentNameChange}
                allQuestions={allQuestions}
                onStartExam={handleStartExam}
                submissions={submissions}
                onViewSubmission={handleViewSubmission}
                onOpenTeacherMode={() => setIsPasswordModalOpen(true)}
              />
            )}

            {studentView === 'exam' && activeQuestions.length > 0 && (
              <ExamTaking
                questions={activeQuestions}
                title={activeExamTitle}
                mode={activeExamMode}
                studentName={studentName}
                onComplete={handleExamComplete}
                onExit={() => setStudentView('home')}
              />
            )}

            {studentView === 'result' && currentSubmission && (
              <ExamResult
                submission={currentSubmission}
                onRetakeIncorrect={handleRetakeIncorrect}
                onGoHome={() => setStudentView('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            풍문고등학교 2학년 영어 내신 1등급 완전 정복 문제은행
          </p>
          <p className="text-slate-400">
            초경량 JSON 문제 등록기 · 오답 무한 루프 시스템
          </p>
        </div>
      </footer>

      {/* Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};
