import React from 'react';
import { GrammarSelectQuestion } from '../../types/exam';
import { Check, CheckCircle2 } from 'lucide-react';

interface GrammarSelectItemProps {
  question: GrammarSelectQuestion;
  selectedAnswers: (string | null)[];
  onChange: (answers: (string | null)[]) => void;
}

export const GrammarSelectItem: React.FC<GrammarSelectItemProps> = ({
  question,
  selectedAnswers,
  onChange,
}) => {
  const { sentenceParts, choices } = question;

  const handleSelectChoice = (choiceIndex: number, option: string) => {
    const updated = [...selectedAnswers];
    updated[choiceIndex] = option;
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Question banner */}
      <div className="flex items-start gap-2.5">
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 mt-0.5">
          {question.subType || '어법 선택'}
        </span>
        <div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            다음 글의 네모/괄호 안에서 문맥에 맞는 알맞은 어법 표현을 고르시오.
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            문장 속 괄호 안의 단어를 직접 클릭하여 올바른 어법을 선택하세요.
          </p>
        </div>
      </div>

      {/* Inline Interactive Sentence Box */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 text-slate-800 leading-loose text-base sm:text-lg shadow-xs select-none">
        <div className="font-serif leading-10 tracking-normal">
          {sentenceParts.map((part, idx) => {
            const choicePair = choices[idx];
            const currentSelected = selectedAnswers[idx] || null;

            return (
              <React.Fragment key={idx}>
                <span className="font-sans text-slate-800 font-normal">{part}</span>
                {choicePair && (
                  <span className="inline-flex items-center align-middle mx-1.5 my-1 bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleSelectChoice(idx, choicePair[0])}
                      className={`px-2.5 py-1 rounded-lg text-sm sm:text-base font-bold transition-all cursor-pointer ${
                        currentSelected === choicePair[0]
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {choicePair[0]}
                    </button>
                    <span className="text-slate-400 mx-1 text-xs select-none font-bold">/</span>
                    <button
                      type="button"
                      onClick={() => handleSelectChoice(idx, choicePair[1])}
                      className={`px-2.5 py-1 rounded-lg text-sm sm:text-base font-bold transition-all cursor-pointer ${
                        currentSelected === choicePair[1]
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {choicePair[1]}
                    </button>
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selection Status Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
        <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>나의 어법 선택 상태 확인:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {choices.map((pair, idx) => {
            const chosen = selectedAnswers[idx];
            return (
              <div
                key={idx}
                className={`text-xs sm:text-sm px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 ${
                  chosen
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                }`}
              >
                <span className="font-bold">[{idx + 1}번 괄호]</span>
                {chosen ? (
                  <span className="font-bold flex items-center gap-0.5 text-blue-700">
                    <Check className="w-3 h-3 text-blue-600 stroke-[3]" />
                    {chosen}
                  </span>
                ) : (
                  <span className="text-amber-600 italic">미선택 (클릭 필요)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
