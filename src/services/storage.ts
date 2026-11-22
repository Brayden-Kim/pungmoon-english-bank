import { ExamSet, Question, StudentSubmission } from '../types/exam';
import { parseAndValidateExamJson } from '../utils/jsonValidator';

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

  async getIncorrectQuestions(studentName: string): Promise<Question[]> {
    if (!studentName.trim()) return [];
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
    localStorage.setItem(this.getVaultKey(studentName), JSON.stringify(Array.from(map.values())));
  }

  async removeCorrectQuestions(studentName: string, correctQuestionIds: string[]): Promise<void> {
    if (!studentName.trim() || correctQuestionIds.length === 0) return;
    const current = await this.getIncorrectQuestions(studentName);
    const removeSet = new Set(correctQuestionIds);
    const updated = current.filter((q) => !removeSet.has(q.id));
    localStorage.setItem(this.getVaultKey(studentName), JSON.stringify(updated));
  }

  async clearIncorrectVault(studentName: string): Promise<void> {
    if (!studentName.trim()) return;
    localStorage.removeItem(this.getVaultKey(studentName));
  }

  // ================= SUBMISSIONS =================
  async getSubmissions(): Promise<StudentSubmission[]> {
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
    const submissions = await this.getSubmissions();
    submissions.unshift(submission);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }

  async deleteSubmission(id: string): Promise<void> {
    const submissions = await this.getSubmissions();
    const filtered = submissions.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(filtered));
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
