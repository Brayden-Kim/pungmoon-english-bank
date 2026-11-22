export type QuestionType = 'multiple_choice' | 'scramble' | 'grammar_select';

export interface BaseQuestion {
  id: string;
  unit: string; // 예: "Unit 16"
  passageTitle: string; // 예: "Unit 16 - 01번"
  type: QuestionType;
  subType: string; // 수능 8대 유형(제목, 주제, 밑줄 함축의미, 순서배열, 문장삽입, 빈칸추론, 지문요약, 적절한 어휘) 또는 서술형
  explanation: string; // 구문 독해 및 '왜?' 코칭 해설
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  passage: string;
  question: string;
  options: string[]; // 5개 선지
  answer: number; // 0 ~ 4 인덱스
}

export interface ScrambleQuestion extends BaseQuestion {
  type: 'scramble';
  korean: string;
  chunks: string[]; // 섞인 영어 단어/어구 배열
  answer: string; // 완성 문장 문자열
}

export interface GrammarSelectQuestion extends BaseQuestion {
  type: 'grammar_select';
  sentenceParts: string[]; // 괄호 앞뒤 문장 조각들
  choices: [string, string][]; // 2차원 선택지 배열
  answers: string[]; // 정답 문자열 배열
}

export type Question = MultipleChoiceQuestion | ScrambleQuestion | GrammarSelectQuestion;

export interface ExamSet {
  id: string;
  title: string;
  createdAt: string;
  questions: Question[];
}

export interface QuestionGradingResult {
  questionId: string;
  questionType: QuestionType;
  unit: string;
  passageTitle: string;
  subType: string;
  isCorrect: boolean;
  studentAnswer: any;
  correctAnswer: any;
  explanation: string;
  rawQuestion: Question;
}

export interface StudentSubmission {
  id: string;
  examTitle: string;
  mode: 'random_shuffle' | 'incorrect_quest';
  studentName: string;
  submittedAt: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  questionResults: QuestionGradingResult[];
}
