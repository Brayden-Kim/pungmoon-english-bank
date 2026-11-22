import React from 'react';
import { ScrambleQuestion } from '../../types/exam';
import { RotateCcw, Undo2, Sparkles, HelpCircle } from 'lucide-react';

interface ScrambleItemProps {
  question: ScrambleQuestion;
  selectedIndices: number[]; // 사용자가 선택한 순서대로의 chunks 인덱스 배열
  onChange: (indices: number[]) => void;
}

export const ScrambleItem: React.FC<ScrambleItemProps> = ({
  question,
  selectedIndices,
  onChange,
}) => {
  const chunks = question.chunks || [];

  // 칩을 조립 영역에 추가
  const handleAddChunk = (index: number) => {
    if (selectedIndices.includes(index)) return;
    onChange([...selectedIndices, index]);
  };

  // 조립 영역에서 칩 클릭 시 제거 (원위치 복귀)
  const handleRemoveChunkAt = (pos: number) => {
    const updated = [...selectedIndices];
    updated.splice(pos, 1);
    onChange(updated);
  };

  // 마지막 칩 하나 취소
  const handleUndo = () => {
    if (selectedIndices.length === 0) return;
    onChange(selectedIndices.slice(0, -1));
  };

  // 전체 초기화
  const handleReset = () => {
    onChange([]);
  };

  // 현재 조립된 완성 문장 미리보기 문자열
  const assembledSentence = selectedIndices.map((i) => chunks[i]).join(' ');

  return (
    <div className="space-y-6">
      {/* Korean Meaning Prompt */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-slate-800">
        <div className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>조건 영작 서술형 · 한국어 해석</span>
        </div>
        <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          "{question.korean}"
        </p>
      </div>

      {/* Assembly Area (조립 영역) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            조립된 문장 영역 (클릭 시 원래 자리로 돌아갑니다)
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={selectedIndices.length === 0}
              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100 flex items-center gap-1 transition-colors"
              title="마지막 단어 취소"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>실행취소</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={selectedIndices.length === 0}
              className="px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-rose-50 flex items-center gap-1 transition-colors"
              title="전체 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          </div>
        </div>

        <div className="min-h-[110px] p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/30 flex flex-wrap gap-2 items-start content-start transition-colors">
          {selectedIndices.length === 0 ? (
            <div className="w-full h-20 flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm">
              <HelpCircle className="w-5 h-5 mb-1 stroke-1" />
              <span>아래의 단어/어구 칩을 순서대로 터치하여 문장을 완성하세요.</span>
            </div>
          ) : (
            selectedIndices.map((chunkIndex, pos) => (
              <button
                key={`${chunkIndex}-${pos}`}
                type="button"
                onClick={() => handleRemoveChunkAt(pos)}
                className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-rose-600 text-white text-sm sm:text-base font-semibold shadow-xs transition-all hover:scale-95 cursor-pointer"
                title="클릭하면 취소됩니다"
              >
                <span>{chunks[chunkIndex]}</span>
                <span className="text-[11px] opacity-70 group-hover:opacity-100 font-mono">✕</span>
              </button>
            ))
          )}
        </div>

        {/* Real-time assembled sentence preview */}
        {selectedIndices.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-700 font-mono">
            <span className="font-bold text-slate-500 mr-1.5">미리보기:</span>
            <span>{assembledSentence}</span>
          </div>
        )}
      </div>

      {/* Available Chunks Chips (단어/어구 목록) */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          단어 및 어구 칩 (터치하여 선택)
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {chunks.map((chunk, idx) => {
            const isUsed = selectedIndices.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                disabled={isUsed}
                onClick={() => handleAddChunk(idx)}
                className={`px-3.5 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all cursor-pointer ${
                  isUsed
                    ? 'bg-slate-100 text-slate-300 border border-slate-200 line-through opacity-40 cursor-not-allowed'
                    : 'bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-sm active:scale-95'
                }`}
              >
                {chunk}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
