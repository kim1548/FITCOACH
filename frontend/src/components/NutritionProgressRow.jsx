import React from "react";

// 섭취량 / 목표량 비율에 따라 막대 색을 결정.
// 80% 미만: 파랑(부족), 80~110%: 초록(적정), 그 이상: 주황(과잉).
export const barColor = (pct) => {
  if (pct < 80) return "bg-blue-500";
  if (pct <= 110) return "bg-green-500";
  return "bg-orange-500";
};

/**
 * 영양 목표 진행률 한 줄.
 * MEALS 페이지와 Journal 모달이 공유.
 *
 * props:
 *   label    상단 라벨 (예: "칼로리")
 *   consumed 현재 섭취량
 *   target   목표량 (0/없을 때는 1로 보정)
 *   unit     단위 문자열 (" kcal" 또는 "g")
 *   accent   라벨 컬러 tailwind 클래스 (옵션)
 *   isDark   다크 테마 여부 — 트랙 배경색만 영향 (기본 true)
 */
const NutritionProgressRow = ({ label, consumed, target, unit, accent, isDark = true }) => {
  const safeTarget = target || 1;
  const pct = Math.round(((consumed || 0) / safeTarget) * 100);
  const trackBg = isDark ? "bg-white/5" : "bg-slate-200";
  const dimText = isDark ? "text-slate-500" : "text-slate-500";
  const fadeText = isDark ? "text-slate-600" : "text-slate-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest ${accent || dimText}`}>
          {label}
        </span>
        <span className="text-xs font-black tabular-nums">
          {Math.round(consumed || 0)}
          <span className={dimText}> / {target}{unit}</span>
          <span className={`ml-2 ${fadeText}`}>{pct}%</span>
        </span>
      </div>
      <div className={`h-1.5 ${trackBg} rounded-full overflow-hidden`}>
        <div
          className={`h-full transition-all ${barColor(pct)}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
};

export default NutritionProgressRow;
