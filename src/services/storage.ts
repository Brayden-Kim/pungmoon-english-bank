import { ExamSet, Question, StudentSubmission } from '../types/exam';
import { parseAndValidateExamJson } from '../utils/jsonValidator';
import { supabase, supabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  EXAM_SETS: 'pungmoon_exam_sets_v3',
  SUBMISSIONS: 'pungmoon_submissions_v3',
  INCORRECT_VAULT_PREFIX: 'pungmoon_incorrect_v3_',
  TEACHER_PASSWORD: 'pungmoon_teacher_pw',
} as const;

class LocalStorageService {
  private bundledSetCache: ExamSet | null = null;
  private bundledAttempted = false;

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    const existing = localStorage.getItem(STORAGE_KEYS.EXAM_SETS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEYS.EXAM_SETS, JSON.stringify([]));
    }
    try {
      localStorage.removeItem('pungmoon_exams_v1');
      localStorage.removeItem('pungmoon_exam_sets_v2');
      localStorage.removeItem('pungmoon_submissions_v1');
    } catch {
      // ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.TEACHER_PASSWORD)) {
      localStorage.setItem(STORAGE_KEYS.TEACHER_PASSWORD, '5272');
    }
  }

  /**
   * 프로젝트 내 public/all_exams.json 파일이 있으면 자동으로 읽어와
   * 클라우드 배포 시 전교생에게 영구 서비스할 수 있도록 지원합니다.
   */
  private async loadBundledFileIfAvailable(): Promise<ExamSet | null> {
    if (this.bundledAttempted) return this.bundledSetCache;
    this.bundledAttempted = true;

    try {
      const res = await fetch('/all_questions.json');
      if (res.ok) {
        const text = await res.text();
        const validation = parseAndValidateExamJson(text);
        if (validation.success && validation.questions && validation.questions.length > 0) {
          this.bundledSetCache = {
            id: 'bundled-all-exams',
            title: validation.suggestedTitle || '기본 탑재 문제 세트 (all_exams.json)',
            createdAt: new Date().toISOString(),
            questions: validation.questions,
          };
          return this.bundledSetCache;
        }
      }
    } catch {
      // all_exams.json 파일이 없는 경우 정상 패스
    }
    return null;
  }

  // ================= EXAM SETS =================
  async getExamSets(): Promise<ExamSet[]> {
    const sets: ExamSet[] = [];

    // 1. 클라우드/프로젝트 내장 all_exams.json 확인
    const bundled = await this.loadBundledFileIfAvailable();
    if (bundled) {
      sets.push(bundled);
    }

    // 2. 브라우저 localStorage에 업로드된 세트 로드
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAM_SETS);
      if (data) {
        const parsed: ExamSet[] = JSON.parse(data);
        // 번들 세트와 중복 ID 방지 병합
        for (const s of parsed) {
          if (!sets.some((existing) => existing.id === s.id)) {
            sets.push(s);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse exam sets from localStorage:', e);
    }

    return sets;
  }

  async saveExamSet(newSet: ExamSet): Promise<void> {
    const rawData = localStorage.getItem(STORAGE_KEYS.EXAM_SETS);
    let userSets: ExamSet[] = rawData ? JSON.parse(rawData) : [];
    
    const existingIdx = userSets.findIndex((s) => s.id === newSet.id);
    if (existingIdx >= 0) {
      userSets[existingIdx] = newSet;
    } else {
      userSets.unshift(newSet);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_SETS, JSON.stringify(userSets));
  }

  async deleteExamSet(id: string): Promise<void> {
    const rawData = localStorage.getItem(STORAGE_KEYS.EXAM_SETS);
    if (!rawData) return;
    const userSets: ExamSet[] = JSON.parse(rawData);
    const filtered = userSets.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXAM_SETS, JSON.stringify(filtered));

    if (this.bundledSetCache && this.bundledSetCache.id === id) {
      this.bundledSetCache = null;
    }
  }

  // 등록된 모든 시험지의 전체 문제 풀 반환
  async getAllQuestions(): Promise<Question[]> {
    const sets = await this.getExamSets();
    const map = new Map<string, Question>();
    for (const set of sets) {
      for (const q of set.questions) {
        if (!map.has(q.id)) {
          map.set(q.id, q);
        }
      }
    }
    return Array.from(map.values());
  }

  // ================= INCORRECT VAULT (오답 보관함) =================
  private getVaultKey(studentName: string): string {
    const cleanName = studentName.trim().toLowerCase();
    return `${STORAGE_KEYS.INCORRECT_VAULT_PREFIX}${cleanName}`;
  }

  private getStudentKey(studentName: string): string {
    return studentName.trim().replace(/\s+/g, '').toLowerCase();
  }

  async getIncorrectQuestions(studentName: string): Promise<Question[]> {
    if (!studentName.trim()) return [];
    if (supabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('student_progress')
        .select('incorrect_questions')
        .eq('student_key', this.getStudentKey(studentName))
        .maybeSingle();
      if (!error && data?.incorrect_questions) {
        localStorage.setItem(this.getVaultKey(studentName), JSON.stringify(data.incorrect_questions));
        return data.incorrect_questions as Question[];
      }
    }
    try {
      const key = this.getVaultKey(studentName);
      const data = localStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async addIncorrectQuestions(studentName: string, questions: Question[]): Promise<void> {
    if (!studentName.trim() || questions.length === 0) return;
    const current = await this.getIncorrectQuestions(studentName);
    const map = new Map<string, Question>();
    current.forEach((q) => map.set(q.id, q));
    questions.forEach((q) => map.set(q.id, q));
    const updated = Array.from(map.values());
    localStorage.setItem(this.getVaultKey(studentName), JSON.stringify(updated));
    await this.saveStudentProgress(studentName, updated);
  }

  async removeCorrectQuestions(studentName: string, correctQuestionIds: string[]): Promise<void> {
    if (!studentName.trim() || correctQuestionIds.length === 0) return;
    const current = await this.getIncorrectQuestions(studentName);
    const removeSet = new Set(correctQuestionIds);
    const updated = current.filter((q) => !removeSet.has(q.id));
    localStorage.setItem(this.getVaultKey(studentName), JSON.stringify(updated));
    await this.saveStudentProgress(studentName, updated);
  }

  async clearIncorrectVault(studentName: string): Promise<void> {
    if (!studentName.trim()) return;
    localStorage.removeItem(this.getVaultKey(studentName));
    await this.saveStudentProgress(studentName, []);
  }

  private async saveStudentProgress(studentName: string, incorrectQuestions: Question[]): Promise<void> {
    if (!supabaseConfigured || !supabase) return;
    const { error } = await supabase.from('student_progress').upsert({
      student_key: this.getStudentKey(studentName),
      student_name: studentName.trim(),
      incorrect_questions: incorrectQuestions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_key' });
    if (error) console.error('Failed to save student progress:', error);
  }

  // ================= SUBMISSIONS =================
  async getSubmissions(): Promise<StudentSubmission[]> {
    if (supabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map((row: any) => ({
          id: row.id,
          examTitle: row.exam_title,
          mode: row.mode,
          studentName: row.student_name,
          submittedAt: row.submitted_at,
          totalScore: row.total_score,
          correctCount: row.correct_count,
          totalQuestions: row.total_questions,
          questionResults: row.question_results || [],
        })) as StudentSubmission[];
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(mapped));
        return mapped;
      }
      console.error('Failed to load cloud submissions:', error);
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse submissions from localStorage:', e);
      return [];
    }
  }

  async saveSubmission(submission: StudentSubmission): Promise<void> {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.from('submissions').upsert({
        id: submission.id,
        exam_title: submission.examTitle,
        mode: submission.mode,
        student_name: submission.studentName,
        student_key: this.getStudentKey(submission.studentName),
        submitted_at: submission.submittedAt,
        total_score: submission.totalScore,
        correct_count: submission.correctCount,
        total_questions: submission.totalQuestions,
        question_results: submission.questionResults,
      });
      if (error) console.error('Failed to save cloud submission:', error);
    }
    const submissions = await this.getLocalSubmissions();
    submissions.unshift(submission);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }

  async deleteSubmission(id: string): Promise<void> {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (error) console.error('Failed to delete cloud submission:', error);
    }
    const submissions = await this.getLocalSubmissions();
    const filtered = submissions.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(filtered));
  }

  private async getLocalSubmissions(): Promise<StudentSubmission[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  subscribeToSubmissions(onChange: () => void): (() => void) | null {
    if (!supabaseConfigured || !supabase) return null;
    const client = supabase;
    const channel = client
      .channel('submissions-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        onChange,
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }

  // ================= TEACHER PASSWORD =================
  getTeacherPassword(): string {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_PASSWORD) || '5272';
  }

  setTeacherPassword(pw: string): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PASSWORD, pw.trim());
  }
}

export const storage = new LocalStorageService();
