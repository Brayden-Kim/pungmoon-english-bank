import React, { useState, useRef } from 'react';
import { parseAndValidateExamJson } from '../../utils/jsonValidator';
import { ExamSet, Question } from '../../types/exam';
import { 
  UploadCloud, 
  FileCode2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  FileText, 
  Sparkles,
  Layers
} from 'lucide-react';

interface JsonUploaderProps {
  onExamSetRegistered: (newSet: ExamSet) => void;
}

const SAMPLE_TEMPLATE = `[
  {
    "id": "q-sample-01",
    "unit": "Unit 16",
    "passageTitle": "Unit 16 - 01번 (지식의 착각)",
    "type": "multiple_choice",
    "subType": "빈칸추론",
    "passage": "Most people believe that they understand the world... collaborative division of cognitive labor leads us to ________________.",
    "question": "다음 빈칸에 들어갈 말로 가장 적절한 것은?",
    "options": [
      "distrust the collective wisdom of specialists",
      "overestimate our individual intellectual competence",
      "refuse to cooperate with others",
      "strive to become independent learners",
      "accurately assess our own depth of understanding"
    ],
    "answer": 1,
    "explanation": "[정답 분석]\\n정답: ② overestimate...\\n💡 왜 이 답일까요? 타인의 지식을 자신의 것으로 착각하는 인지적 분업의 결과입니다."
  },
  {
    "id": "q-sample-02",
    "unit": "Unit 16",
    "passageTitle": "Unit 16 - 01번 서술형 영작",
    "type": "scramble",
    "subType": "서술형-문장배열",
    "korean": "우리는 단순히 다른 사람들에게 의존할 수 있기 때문에 우리 스스로 모든 세부 사항을 알 필요가 거의 없다.",
    "chunks": ["We", "rarely need", "to know", "all the details", "ourselves", "because", "we can", "simply rely", "on others."],
    "answer": "We rarely need to know all the details ourselves because we can simply rely on others.",
    "explanation": "[어법 코칭]\\n준부정어 rarely의 위치와 강조를 위한 재귀대명사 ourselves 용법입니다."
  },
  {
    "id": "q-sample-03",
    "unit": "Unit 16",
    "passageTitle": "Unit 16 - 01번 어법 선택",
    "type": "grammar_select",
    "subType": "서술형-어법선택",
    "sentenceParts": [
      "This persistent illusion persists because we mistake the knowledge that ",
      " in other people for our own, which ultimately ",
      " us to misjudge."
    ],
    "choices": [["resides", "reside"], ["leads", "lead"]],
    "answers": ["resides", "leads"],
    "explanation": "[어법 코칭]\\n1. 선행사 the knowledge가 단수이므로 resides\\n2. 앞 절 전체를 받는 계속적 용법의 which는 단수이므로 leads"
  }
]`;

export const JsonUploader: React.FC<JsonUploaderProps> = ({ onExamSetRegistered }) => {
  const [title, setTitle] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setSuccessInfo(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      // 파일명이 all_exams.json 처럼 의미가 있다면 제목 자동 제안
      if (!title.trim()) {
        const inferredTitle = file.name.replace(/\.json$/i, '').replace(/[-_]/g, ' ');
        setTitle(`[업로드] ${inferredTitle}`);
      }
    };
    reader.onerror = () => {
      setError('파일을 읽는 도중 오류가 발생했습니다.');
    };
    reader.readAsText(file, 'utf-8');
  };

  // 문제 등록하기
  const handleRegister = () => {
    setError(null);
    setSuccessInfo(null);

    if (!jsonText.trim()) {
      setError('JSON 데이터를 입력하거나 JSON 파일을 업로드해 주세요.');
      return;
    }

    const validation = parseAndValidateExamJson(jsonText);
    if (!validation.success || !validation.questions) {
      setError(validation.error || 'JSON 데이터 검증에 실패했습니다.');
      return;
    }

    const finalTitle = title.trim() || validation.suggestedTitle || `풍문고 영어 문제 세트 (${new Date().toLocaleDateString('ko-KR')})`;

    const newSet: ExamSet = {
      id: `set-${Date.now()}`,
      title: finalTitle,
      createdAt: new Date().toISOString(),
      questions: validation.questions,
    };

    onExamSetRegistered(newSet);

    // 카운트 계산
    const mc = validation.questions.filter((q) => q.type === 'multiple_choice').length;
    const sc = validation.questions.filter((q) => q.type === 'scramble').length;
    const gs = validation.questions.filter((q) => q.type === 'grammar_select').length;
    const units = Array.from(new Set(validation.questions.map((q) => q.unit))).join(', ');

    setSuccessInfo(
      `🎉 총 ${validation.questions.length}문항 (객관식 ${mc}개, 문장배열 ${sc}개, 어법선택 ${gs}개 / 단원: ${units}) 등록 완료! 학생 모드에 즉시 반영되었습니다.`
    );

    // 폼 초기화
    setTitle('');
    setJsonText('');
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 템플릿 복사
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_TEMPLATE);
    alert('샘플 JSON 규격이 클립보드에 복사되었습니다. 파이썬 스크립트 작성 시 참고하세요!');
  };

  // 템플릿 채우기
  const handleFillSample = () => {
    setTitle('[풍문고 2학년] 수능특강 라이트 Unit 16 모의고사 변형 예시');
    setJsonText(SAMPLE_TEMPLATE);
    setError(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md mb-1.5">
            <FileCode2 className="w-3.5 h-3.5" />
            <span>초경량 원클릭 문제 데이터 업로더</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            영어 변형문제 JSON 데이터 일괄 등록
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            외부(파이썬 스크립트나 Gemini 등)에서 생성한 JSON 파일을 올리거나 붙여넣으면 즉시 문제 은행에 반영됩니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyTemplate}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title="JSON 규격 복사"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>JSON 규격 복사</span>
          </button>
          <button
            type="button"
            onClick={handleFillSample}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>예시 데이터 채우기</span>
          </button>
        </div>
      </div>

      {/* Error alert with detailed diagnosis */}
      {error && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>JSON 데이터 검증 오류 안내</span>
          </div>
          <div className="whitespace-pre-line font-mono text-xs pl-7 text-rose-700 leading-relaxed">
            {error}
          </div>
        </div>
      )}

      {/* Success alert */}
      {successInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="font-semibold leading-relaxed">{successInfo}</div>
        </div>
      )}

      <div className="space-y-5">
        {/* Exam Title */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
            시험지(세트) 제목 <span className="text-slate-400 font-normal">(비워두면 JSON 내 제목 또는 자동 지정)</span>
          </label>
          <input
            type="text"
            placeholder="예: [풍문고 2학년] 수능특강 라이트 Unit 16~18 변형 470제"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
          />
        </div>

        {/* File Drag & Drop / Upload Box */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
            JSON 파일 업로드 (대용량 all_exams.json 등)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-xs border border-slate-200 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700">
                {fileName ? (
                  <span className="text-blue-700 font-mono">선택된 파일: {fileName}</span>
                ) : (
                  <span>여기를 클릭하여 .json 파일을 선택하세요</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                대용량 문제 파일(문항 수 제한 없음)을 한 번에 올릴 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* JSON Direct Paste Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700">
              또는 JSON 데이터 직접 붙여넣기
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {jsonText ? `${jsonText.length.toLocaleString()} 자` : '0 자'}
            </span>
          </div>
          <textarea
            rows={10}
            placeholder={`파이썬 스크립트나 Gemini가 생성한 JSON 데이터를 여기에 붙여넣으세요...\n\n예시 형식:\n[\n  {\n    "id": "q1",\n    "unit": "Unit 16",\n    "passageTitle": "Unit 16 - 01번",\n    "type": "multiple_choice",\n    "subType": "빈칸추론",\n    "passage": "...",\n    "question": "...",\n    "options": ["1", "2", "3", "4", "5"],\n    "answer": 1,\n    "explanation": "..."\n  }\n]`}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (error) setError(null);
            }}
            className="w-full p-4 rounded-2xl border border-slate-300 font-mono text-xs leading-relaxed focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleRegister}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Layers className="w-5 h-5 text-amber-300" />
            <span>문제 은행에 등록하기 (학생 모드 즉시 반영)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
