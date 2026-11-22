import React from 'react';
import { MultipleChoiceQuestion } from '../../types/exam';
import { CheckCircle2, Circle } from 'lucide-react';

interface MultipleChoiceItemProps {
  question: MultipleChoiceQuestion;
  selectedAnswer: number | null;
  onSelect: (index: number) => void;
}

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤'];

export const MultipleChoiceItem: React.FC<MultipleChoiceItemProps> = ({
  question,
  selectedAnswer,
  onSelect,
}) => {
  return (
    <div className="space-y-6">
      {/* Passage box */}
      {question.passage && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 text-slate-800 leading-relaxed font-sans text-sm sm:text-base shadow-xs select-text">
          <div className="text-xs font-bold text-blue-600 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Passage 지문
          </div>
          <div className="whitespace-pre-line leading-7 text-slate-800 font-normal">
            {question.passage}
          </div>
        </div>
      )}

      {/* Question text */}
      <div className="flex items-start gap-2.5 pt-1">
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0 mt-0.5">
          {question.subType || '객관식'}
        </span>
        <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {question.question}
        </h4>
      </div>

      {/* 5 Options */}
      <div className="space-y-2.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(idx)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-start gap-3 group relative cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 text-slate-700 bg-white'
              }`}
            >
              <div className="shrink-0 mt-0.5 flex items-center justify-center">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-50" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                )}
              </div>
              <div className="flex-1 text-sm sm:text-base leading-snug flex items-baseline gap-2">
                <span className={`font-semibold shrink-0 ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                  {CIRCLED_NUMBERS[idx]}
                </span>
                <span className="font-medium">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
