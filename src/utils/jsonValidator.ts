import { Question, MultipleChoiceQuestion, ScrambleQuestion, GrammarSelectQuestion } from '../types/exam';

export interface ParseResult {
  success: boolean;
  questions?: Question[];
  suggestedTitle?: string;
  error?: string;
}

export function parseAndValidateExamJson(rawJson: string): ParseResult {
  if (!rawJson.trim()) {
    return { success: false, error: 'JSON 데이터가 비어 있습니다. 데이터를 입력하거나 파일을 업로드해 주세요.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    return { 
      success: false, 
      error: `유효한 JSON 문법이 아닙니다.\n오류 상세: ${err.message}` 
    };
  }

  let rawList: any[] = [];
  let suggestedTitle: string | undefined;

  // 1. 객체 내 questions 프로퍼티가 있는 경우
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (parsed.title) suggestedTitle = String(parsed.title);
    if (Array.isArray(parsed.questions)) {
      rawList = parsed.questions;
    } else {
      return { 
        success: false, 
        error: 'JSON 객체 안에 "questions" 배열이 존재하지 않습니다. {"questions": [...]} 규격을 확인해 주세요.' 
      };
    }
  } 
  // 2. 최상위가 배열인 경우 (여러 세트의 배열이거나 문항들의 배열)
  else if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { success: false, error: '배열이 비어 있습니다. 최소 1개 이상의 문항이 필요합니다.' };
    }
    // all_exams.json 처럼 ExamSet[] 배열 형태인 경우 병합 처리 지원
    if (parsed[0] && Array.isArray(parsed[0].questions)) {
      suggestedTitle = parsed[0].title || '통합 업로드 문제 세트';
      rawList = parsed.flatMap((set: any) => set.questions || []);
    } else {
      rawList = parsed;
    }
  } else {
    return { success: false, error: '최상위 데이터는 문항 배열 [ ... ] 또는 { "questions": [ ... ] } 형태여야 합니다.' };
  }

  if (rawList.length === 0) {
    return { success: false, error: '파싱된 문항이 0개입니다. 데이터를 확인해 주세요.' };
  }

  // 문항 하나하나 상세 유효성 검사
  const validatedQuestions: Question[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    const indexLabel = `[문항 ${i + 1}번]`;

    if (!item || typeof item !== 'object') {
      return { success: false, error: `${indexLabel} 문항 데이터가 유효한 객체 형식이 아닙니다.` };
    }

    // 공통 필드 검증
    const id = item.id ? String(item.id) : `q-${Date.now()}-${i + 1}`;
    const unit = item.unit ? String(item.unit) : 'Unit 일반';
    const passageTitle = item.passageTitle ? String(item.passageTitle) : `${unit} 지문`;
    const subType = item.subType ? String(item.subType) : '변형문제';
    const explanation = item.explanation ? String(item.explanation) : '';

    if (!item.type) {
      return { success: false, error: `${indexLabel} 필수 필드 "type"이 누락되었습니다. (multiple_choice, scramble, grammar_select 중 하나)` };
    }

    if (!['multiple_choice', 'scramble', 'grammar_select'].includes(item.type)) {
      return { 
        success: false, 
        error: `${indexLabel} 알 수 없는 type: "${item.type}". multiple_choice, scramble, grammar_select 중 하나여야 합니다.` 
      };
    }

    // 1. 객관식 (multiple_choice) 검증
    if (item.type === 'multiple_choice') {
      if (!item.question || typeof item.question !== 'string') {
        return { success: false, error: `${indexLabel} 객관식의 "question"(질문) 필드가 누락되었거나 문자열이 아닙니다.` };
      }
      if (!Array.isArray(item.options) || item.options.length !== 5) {
        return { 
          success: false, 
          error: `${indexLabel} 객관식의 "options"는 반드시 5개의 보기 배열이어야 합니다. (현재: ${item.options ? item.options.length : 0}개)` 
        };
      }
      if (typeof item.answer !== 'number' || item.answer < 0 || item.answer > 4) {
        return { 
          success: false, 
          error: `${indexLabel} 객관식의 "answer"는 0부터 4까지의 숫자 인덱스여야 합니다. (입력값: ${item.answer})` 
        };
      }

      const mc: MultipleChoiceQuestion = {
        id,
        unit,
        passageTitle,
        type: 'multiple_choice',
        subType,
        explanation,
        passage: item.passage ? String(item.passage) : '',
        question: item.question,
        options: item.options.map(String),
        answer: item.answer,
      };
      validatedQuestions.push(mc);
    }

    // 2. 문장 배열 (scramble) 검증
    else if (item.type === 'scramble') {
      if (!item.korean || typeof item.korean !== 'string') {
        return { success: false, error: `${indexLabel} 문장 배열의 "korean"(한국어 해석) 필드가 누락되었습니다.` };
      }
      if (!Array.isArray(item.chunks) || item.chunks.length === 0) {
        return { success: false, error: `${indexLabel} 문장 배열의 "chunks"(단어/어구 조각 배열) 필드가 누락되었거나 비어 있습니다.` };
      }
      if (!item.answer || typeof item.answer !== 'string') {
        return { success: false, error: `${indexLabel} 문장 배열의 "answer"(정답 완성 문장) 필드가 누락되었습니다.` };
      }

      const sc: ScrambleQuestion = {
        id,
        unit,
        passageTitle,
        type: 'scramble',
        subType: subType || '서술형-문장배열',
        explanation,
        korean: item.korean,
        chunks: item.chunks.map(String),
        answer: item.answer,
      };
      validatedQuestions.push(sc);
    }

    // 3. 어법 선택 (grammar_select) 검증
    else if (item.type === 'grammar_select') {
      if (!Array.isArray(item.sentenceParts) || item.sentenceParts.length === 0) {
        return { success: false, error: `${indexLabel} 어법 선택의 "sentenceParts"(문장 조각 배열)이 누락되었습니다.` };
      }
      if (!Array.isArray(item.choices) || item.choices.length === 0) {
        return { success: false, error: `${indexLabel} 어법 선택의 "choices"(2차원 선택지 쌍 배열)이 누락되었습니다.` };
      }
      if (!Array.isArray(item.answers) || item.answers.length === 0) {
        return { success: false, error: `${indexLabel} 어법 선택의 "answers"(정답 문자열 배열)이 누락되었습니다.` };
      }
      if (item.choices.length !== item.answers.length) {
        return { 
          success: false, 
          error: `${indexLabel} 어법 선택의 choices 쌍의 개수(${item.choices.length})와 answers 개수(${item.answers.length})가 일치하지 않습니다.` 
        };
      }

      const gs: GrammarSelectQuestion = {
        id,
        unit,
        passageTitle,
        type: 'grammar_select',
        subType: subType || '서술형-어법선택',
        explanation,
        sentenceParts: item.sentenceParts.map(String),
        choices: item.choices.map((pair: any) => [String(pair[0] || ''), String(pair[1] || '')]),
        answers: item.answers.map(String),
      };
      validatedQuestions.push(gs);
    }
  }

  return {
    success: true,
    questions: validatedQuestions,
    suggestedTitle,
  };
}
