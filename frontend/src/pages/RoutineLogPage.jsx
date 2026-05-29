import React from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import { Loader2 } from 'lucide-react';

/**
 * FeedbackDetail — AI 자세 분석 결과 매거진 리포트 (Editorial Magazine 톤).
 *
 * /formcheck/:exId 의 분석 종료 후 RoutinePlayPage 내부에 렌더된다.
 * Page wrapper 는 부모(RoutinePlayPage)에서 PageSurface 로 감싸므로 여기는
 * 내부 콘텐츠 영역만 담당.
 */

const CATEGORIES = [
  { key: 'Stability', label: '안정성' },
  { key: 'ROM', label: '가동범위' },
  { key: 'Movement Quality', label: '동작 품질' },
  { key: 'Posture', label: '자세' },
  { key: 'Core', label: '코어' },
];

const verdictOf = (score) => {
  if (score >= 85) return { tag: 'Excellent', cls: 'text-accent-gold' };
  if (score >= 70) return { tag: 'Solid',     cls: 'text-ink' };
  if (score >= 50) return { tag: 'Needs work', cls: 'text-body' };
  return { tag: 'Critical', cls: 'text-accent-red' };
};

const FeedbackDetail = ({ result, exerciseName, onReset, onSaveToJournal }) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-taupe gap-3">
        <Loader2 className="animate-spin" size={20} />
        <p className="font-mono text-[11px] tracking-meta uppercase">Loading report…</p>
      </div>
    );
  }

  const score = result.score || 0;
  const verdict = verdictOf(score);

  const radarData = CATEGORIES.map((c) => ({
    subject: c.label,
    A: result.cat_scores?.[c.key] || 0,
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Headline */}
      <header className="pb-6">
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-mono text-[11px] text-accent-red tracking-label uppercase">
            — Entry · Form analysis
          </div>
          <div className={`font-mono text-[10px] tracking-label uppercase ${verdict.cls}`}>
            {verdict.tag}
          </div>
        </div>

        <h1 className="font-display text-4xl md:text-5xl leading-[1.0] tracking-tight font-normal">
          {exerciseName}, <em className="italic text-accent-gold">analyzed.</em>
        </h1>

        {result.overall && (
          <blockquote className="font-display italic text-[15px] text-body leading-relaxed border-l-2 border-accent-red pl-3 mt-4 m-0">
            "{result.overall}"
          </blockquote>
        )}
      </header>

      {/* Score + Radar */}
      <section className="border-t border-ink/15 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 md:gap-8 py-6">

        {/* Score */}
        <div>
          <div className="font-mono text-[10px] text-taupe tracking-label uppercase mb-3">
            — Score
          </div>
          <div className="flex items-baseline gap-3">
            <div className="font-display text-7xl md:text-8xl text-ink leading-none tabular-nums">
              {score}
            </div>
            <div className="font-display italic text-base text-taupe">
              / 100 pts
            </div>
          </div>

          {/* Mini bar */}
          <div className="mt-5 h-0.5 w-full bg-ink/10 overflow-hidden">
            <div
              className="h-full bg-accent-red transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            />
          </div>

          {/* Per-category mini rows */}
          <div className="border-t border-ink/12 mt-5 pt-1">
            {CATEGORIES.map((c, i, arr) => {
              const v = result.cat_scores?.[c.key];
              return (
                <div
                  key={c.key}
                  className={`flex justify-between items-baseline py-1.5 ${
                    i < arr.length - 1 ? 'border-b border-ink/8' : ''
                  }`}
                >
                  <span className="font-mono text-[10px] text-taupe tracking-meta uppercase">
                    {c.key}
                  </span>
                  <span className="font-display italic text-base tabular-nums text-ink">
                    {v != null ? v : <span className="text-hint">—</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar */}
        <div className="md:border-l md:border-ink/12 md:pl-8">
          <div className="font-mono text-[10px] text-accent-gold tracking-label uppercase mb-3">
            — Performance chart
          </div>
          <div className="w-full h-[300px] md:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 12, right: 30, bottom: 12, left: 30 }}>
                <PolarGrid stroke="rgba(240, 232, 216, 0.12)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#aaa098', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#c43c2f"
                  fill="#c43c2f"
                  fillOpacity={0.28}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Captured frame */}
      {result.capture_url && (
        <section className="border-t border-ink/15 py-6">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-mono text-[11px] text-accent-red tracking-label uppercase">
              — Captured frame
            </div>
            <div className="font-mono text-[9px] text-hint tracking-meta uppercase">
              Most representative pose
            </div>
          </div>
          <figure className="m-0">
            <div className="border border-accent-red/30 bg-black overflow-hidden">
              <img
                src={result.capture_url}
                alt="Captured pose"
                className="w-full h-auto object-cover"
              />
            </div>
            <figcaption className="font-display italic text-sm text-taupe mt-2 leading-relaxed">
              분석 알고리즘이 잡아낸 가장 중요한 순간 — 위 진단은 이 프레임을 기준으로 합니다.
            </figcaption>
          </figure>
        </section>
      )}

      {/* Diagnosis details */}
      {result.cat_details && Object.keys(result.cat_details).length > 0 && (
        <section className="border-t border-ink/15 py-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-mono text-[11px] text-accent-red tracking-label uppercase">
              — Detailed diagnosis
            </div>
            <div className="font-mono text-[9px] text-hint tracking-meta uppercase">
              {Object.keys(result.cat_details).length.toString().padStart(2, '0')} notes
            </div>
          </div>

          <div className="border-t border-ink/12">
            {Object.entries(result.cat_details).map(([cat, msg]) => {
              const catScore = result.cat_scores?.[cat];
              const tag = catScore != null ? verdictOf(catScore).tag : '—';
              const tagCls = catScore != null ? verdictOf(catScore).cls : 'text-hint';
              return (
                <article
                  key={cat}
                  className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 md:gap-6 py-4 border-b border-ink/8 last:border-b-0"
                >
                  <div>
                    <div className="font-mono text-[10px] text-taupe tracking-label uppercase">
                      {cat}
                    </div>
                    <div className={`font-mono text-[9px] tracking-meta uppercase mt-1 ${tagCls}`}>
                      · {tag}
                      {catScore != null && (
                        <span className="text-hint normal-case tracking-normal"> ({catScore})</span>
                      )}
                    </div>
                  </div>
                  <p className="font-display italic text-[15px] text-body leading-relaxed m-0">
                    "{msg}"
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="border-t border-ink/15 pt-6 mt-2 flex flex-col md:flex-row gap-3">
        <button
          onClick={onReset}
          className="font-mono text-[11px] tracking-label uppercase px-5 py-3 border border-ink/20 text-taupe hover:text-ink hover:border-ink/40 transition-colors"
        >
          ↻ Analyze another
        </button>
        {onSaveToJournal && (
          <button
            onClick={onSaveToJournal}
            className="flex-1 font-mono text-[11px] tracking-label uppercase px-5 py-3 bg-accent-red text-ink hover:bg-accent-red/90 transition-colors"
          >
            → Save report to journal
          </button>
        )}
      </section>

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 mt-10 border-t border-ink/15 font-mono text-[11px] text-hint tracking-meta">
        <span className="uppercase">— FITCOACH —</span>
        <span className="uppercase text-taupe">Form analysis · {exerciseName}</span>
      </div>
    </div>
  );
};

export default FeedbackDetail;
