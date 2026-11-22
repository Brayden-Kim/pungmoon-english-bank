import { ExamSet } from '../types/exam';

// 기본 샘플 문제는 모두 삭제되었으며, 선생님 모드에서 JSON 업로드 시 문제가 채워집니다.
export const SAMPLE_EXAM_SET: ExamSet = {
  id: 'empty-init',
  title: '새 문제 세트',
  createdAt: new Date().toISOString(),
  questions: []
};
