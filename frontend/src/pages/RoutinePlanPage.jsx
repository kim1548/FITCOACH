import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Plus, Minus, Calculator, Play, RotateCcw } from 'lucide-react';
import { programInitialState, getProgram, resolveSession } from '../programs';

const PROGRAMS = [
  {
    id: 'stronglifts',
    name: 'StrongLifts 5x5',
    level: '초급',
    img: '/resources/images/program_stronglifts.png',
    desc: '스쿼트·벤치·로우 5×5 기본, 세션마다 +2.5kg 자동 증량. 가장 단순한 입문 루틴.',
    gradient: 'from-blue-600 to-blue-900',
  },
  {
    id: 'madcow',
    name: 'Madcow 5x5',
    level: '중급',
    img: '/resources/images/program_madcow.png',
    desc: '주간 +2.5kg 증량, 50→100% 램핑 세트. StrongLifts 졸업자용 중급 루틴.',
    gradient: 'from-orange-600 to-red-900',
  },
  {
    id: 'nsuns',
    name: 'nSuns 5/3/1 LP',
    level: '중상~상급',
    img: '/resources/images/program_nsuns.png',
    desc: 'AMRAP 기반 자동 TM 조정, 9세트 고볼륨 다중 %. Wendler 5/3/1 LP 변형.',
    gradient: 'from-purple-600 to-purple-900',
  },
  {
    id: 'starting_strength',
    name: 'Starting Strength',
    level: '초급',
    img: '/resources/images/program_starting_strength.png',
    desc: '스쿼트·벤치·데드·OHP·파워클린 3×5. Mark Rippetoe의 입문 표준.',
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    id: 'greyskull_lp',
    name: 'Greyskull LP',
    level: '초급',
    img: '/resources/images/program_greyskull.png',
    desc: '마지막 세트 AMRAP, 상·하체 격일 분할. AMRAP 도입 입문 LP.',
    gradient: 'from-teal-600 to-emerald-900',
  },
  {
    id: 'gzclp',
    name: 'GZCLP',
    level: '초중급',
    img: '/resources/images/program_gzclp.png',
    desc: 'T1(5/3/1)·T2(10×3)·T3(15+) 3-tier 세트, AMRAP 기반 증량. Cody LeFever.',
    gradient: 'from-amber-600 to-yellow-900',
  },
  {
    id: 'wendler_531',
    name: 'Wendler 5/3/1',
    level: '중급',
    img: '/resources/images/program_wendler_531.png',
    desc: '4주 사이클(5/3/1/디로드), TM 90% 기준. 보수적이고 지속 가능한 클래식.',
    gradient: 'from-rose-700 to-pink-900',
  },
  {
    id: 'texas_method',
    name: 'Texas Method',
    level: '중급',
    img: '/resources/images/program_texas_method.png',
    desc: '월 볼륨·수 라이트·금 인텐시티 3분할, PR 세트 기반 중급 LP의 고전.',
    gradient: 'from-yellow-700 to-orange-900',
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    level: '중급',
    img: '/resources/images/program_ppl.png',
    desc: '푸시·풀·레그 3분할 또는 6일. 부위별 보디빌딩식 하이퍼트로피.',
    gradient: 'from-cyan-700 to-sky-900',
  },
  {
    id: 'phul',
    name: 'PHUL',
    level: '중급',
    img: '/resources/images/program_phul.png',
    desc: '주 4일 파워(2일) + 하이퍼트로피(2일). 근력·근비대 동시 추구. Layne Norton.',
    gradient: 'from-fuchsia-700 to-purple-900',
  },
];

const PROGRAM_LIFTS = {
  stronglifts: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
    { id: 'row',      name: '바벨 로우' },
  ],
  madcow: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
    { id: 'row',      name: '바벨 로우' },
  ],
  nsuns: [
    { id: 'bench',    name: '벤치프레스' },
    { id: 'squat',    name: '스쿼트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
    { id: 'deadlift', name: '데드리프트' },
  ],
  starting_strength: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
  ],
  greyskull_lp: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
  ],
  gzclp: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
    { id: 'row',      name: '바벨 로우' },
  ],
  wendler_531: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
  ],
  texas_method: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
    { id: 'row',      name: '바벨 로우' },
  ],
  ppl: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
    { id: 'row',      name: '바벨 로우' },
  ],
  phul: [
    { id: 'squat',    name: '스쿼트' },
    { id: 'bench',    name: '벤치프레스' },
    { id: 'deadlift', name: '데드리프트' },
    { id: 'ohp',      name: '오버헤드 프레스' },
    { id: 'row',      name: '바벨 로우' },
  ],
};

const PROGRAM_META = {
  stronglifts: {
    label: 'StrongLifts 5x5',
    note: '1RM × 50%부터 시작합니다. 모르겠으면 5회 완수 가능한 무게로 입력하세요.',
  },
  madcow: {
    label: 'Madcow 5x5',
    note: '1RM × 50%부터 시작해 매주 +2.5kg 증량합니다.',
  },
  nsuns: {
    label: 'nSuns 5/3/1 LP',
    note: 'TM(Training Max) = 1RM × 90%으로 자동 설정되어 세트 무게가 계산됩니다.',
  },
  starting_strength: {
    label: 'Starting Strength',
    note: '1RM × 50%부터 시작합니다. 모르겠으면 5회 완수 가능한 무게로 입력하세요.',
  },
  greyskull_lp: {
    label: 'Greyskull LP',
    note: '1RM × 50%부터 시작합니다. 각 운동 마지막 세트는 가능한 최대 반복(AMRAP)으로 수행합니다.',
  },
  gzclp: {
    label: 'GZCLP',
    note: 'T1은 1RM의 70%, T2는 50%, 보조 운동(T3)은 45%로 시작해 3단 구조로 진행됩니다.',
  },
  wendler_531: {
    label: 'Wendler 5/3/1',
    note: 'TM(Training Max) = 1RM × 90%으로 시작하며, 4주 사이클로 진행됩니다.',
  },
  texas_method: {
    label: 'Texas Method',
    note: '1RM × 50%부터 시작합니다. 월(볼륨)·수(회복)·금(강도)으로 주간 증량합니다.',
  },
  ppl: {
    label: 'Push / Pull / Legs',
    note: '1RM × 50%부터 시작합니다. 마지막 세트에서 목표+4회 이상이면 증량됩니다.',
  },
  phul: {
    label: 'PHUL',
    note: '파워일은 1RM의 60%, 하이퍼트로피일은 45%로 시작해 4분할로 진행됩니다.',
  },
};

const PROGRAM_VARIANTS = {
  nsuns: [
    {
      id: '4day',
      label: '주 4일',
      tag: '시간 부족',
      desc: '4개 Day 패턴. 시간이 부족하거나 회복 위주로 가고 싶을 때.',
      gradient: 'from-purple-700 to-purple-950',
    },
    {
      id: '5day',
      label: '주 5일',
      tag: '표준 · 권장',
      desc: '원본 nSuns 의 기본 구성. 가장 일반적으로 사용되는 변형.',
      gradient: 'from-purple-600 to-indigo-900',
    },
    {
      id: '6day',
      label: '주 6일',
      tag: '고볼륨 · 상급',
      desc: '회복력이 충분하고 추가 볼륨을 원할 때. 가장 공격적인 변형.',
      gradient: 'from-fuchsia-600 to-purple-900',
    },
  ],
};

const RoutinePlanPage = ({ theme }) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [brokenImgs, setBrokenImgs] = useState({});
  const [weights, setWeights] = useState({ squat: 0, bench: 0, deadlift: 0, ohp: 0, row: 0 });
  const [showCalc, setShowCalc] = useState(false);
  const [calcWeight, setCalcWeight] = useState(60);
  const [calcReps, setCalcReps] = useState(5);
  const [applyTarget, setApplyTarget] = useState('squat');
  const [programVariant, setProgramVariant] = useState(null);
  const [existingProgram, setExistingProgram] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fiteating.program') || 'null');
      if (saved?.selectedId) setExistingProgram(saved);
    } catch {}
  }, []);

  const handleResume = () => {
    if (!existingProgram) return;
    navigate('/program/play', { state: existingProgram });
  };

  const handleReset = () => {
    if (!window.confirm('현재 진행 중인 프로그램을 초기화하시겠습니까?\n증량 기록 그래프(히스토리)는 유지됩니다.')) return;
    localStorage.removeItem('fiteating.program');
    setExistingProgram(null);
  };

  const estimated1RM = calcWeight > 0 && calcReps > 0
    ? calcWeight * (1 + calcReps / 30)
    : 0;

  const applyEstimate = () => {
    const rounded = Math.round(estimated1RM / 2.5) * 2.5;
    setWeights(prev => ({ ...prev, [applyTarget]: rounded }));
    setShowCalc(false);
  };

  const handleStartProgram = () => {
    let existing = null;
    try { existing = JSON.parse(localStorage.getItem('fiteating.program') || 'null'); } catch {}
    const isSameProgram = existing?.selectedId === selectedId;

    if (existing?.selectedId && !isSameProgram) {
      const prevName = PROGRAMS.find(p => p.id === existing.selectedId)?.name || existing.selectedId;
      if (!window.confirm(`진행 중인 "${prevName}" 프로그램의 증량 진행 상태가 초기화됩니다.\n그래도 시작하시겠습니까?`)) {
        return;
      }
    }

    // 프로그램별 초기 무게·단계 (GZCLP·PHUL 은 복합키) — 같은 프로그램 이어하기면 기존값 유지
    const init = programInitialState(selectedId, weights);
    const workingWeights = isSameProgram && existing?.workingWeights
      ? { ...init.workingWeights, ...existing.workingWeights }
      : init.workingWeights;
    const consecutiveFails = isSameProgram && existing?.consecutiveFails
      ? { ...init.consecutiveFails, ...existing.consecutiveFails }
      : init.consecutiveFails;
    const stages = isSameProgram && existing?.stages
      ? { ...init.stages, ...existing.stages }
      : init.stages;

    const navState = {
      selectedId,
      programVariant,
      weights,
      workingWeights,
      consecutiveFails,
      stages,
      lastCompletedWorkout: isSameProgram ? existing.lastCompletedWorkout : null,
    };
    localStorage.setItem('fiteating.program', JSON.stringify(navState));
    navigate('/program/play', { state: navState });
  };

  useEffect(() => {
    if (selectedId && PROGRAM_LIFTS[selectedId]) {
      const firstLift = PROGRAM_LIFTS[selectedId][0].id;
      const isValid = PROGRAM_LIFTS[selectedId].some(l => l.id === applyTarget);
      if (!isValid) setApplyTarget(firstLift);
    }
    setProgramVariant(null);

    if (selectedId && existingProgram?.selectedId === selectedId && existingProgram.weights) {
      setWeights(prev => ({ ...prev, ...existingProgram.weights }));
    }
  }, [selectedId, existingProgram]);

  const needsVariantPick = selectedId && PROGRAM_VARIANTS[selectedId] && !programVariant;

  const isDark = theme === 'dark' || theme === 'design';
  const bgClass = isDark ? "bg-[#0c0c0e]" : "bg-slate-50";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const cardClass = isDark ? "bg-[#16161a] border-white/5" : "bg-white border-slate-200 shadow-sm";
  const subTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const adjustWeight = (liftId, delta) => {
    setWeights(prev => {
      const next = Math.max(0, Math.min(500, (prev[liftId] || 0) + delta));
      return { ...prev, [liftId]: next };
    });
  };

  return (
    <div
      className={`fixed inset-0 ${bgClass} ${textClass} overflow-y-auto [&::-webkit-scrollbar]:hidden`}
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="w-full max-w-7xl mx-auto pt-[80px] pb-[120px]">
        {existingProgram && (() => {
          const prog = PROGRAMS.find(p => p.id === existingProgram.selectedId);
          const lifts = PROGRAM_LIFTS[existingProgram.selectedId] || [];
          const resumeProgram = getProgram(existingProgram);
          const nextLabel = resumeProgram
            ? resolveSession(resumeProgram, existingProgram.lastCompletedWorkout).label
            : '다음 세션';
          return (
            <div className="px-6 mb-6">
              <div className={`${cardClass} rounded-[2rem] p-6 border-2 border-blue-500/30`}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">
                      진행 중인 프로그램
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
                      {prog?.name || existingProgram.selectedId}
                    </h2>
                    <p className={`text-xs mb-4 ${subTextClass}`}>
                      다음 세션:{' '}
                      <span className="text-blue-500 font-black">{nextLabel}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {lifts.map(lift => {
                        // GZCLP·PHUL 은 복합키 — 대표 무게(GZCLP T1·T3, PHUL 파워)를 표시
                        const ww = existingProgram.workingWeights || {};
                        const w = ww[lift.id]
                          ?? ww[`${lift.id}-T1`] ?? ww[`${lift.id}-T3`]
                          ?? ww[`${lift.id}-P`];
                        if (w === undefined) return null;
                        return (
                          <span key={lift.id} className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`font-bold ${subTextClass}`}>{lift.name}</span>
                            <span className="font-black text-blue-500 tabular-nums">{w}kg</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleReset}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <RotateCcw size={12} />
                      초기화
                    </button>
                    <button
                      onClick={handleResume}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      <Play size={12} />
                      이어하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {!existingProgram && (
          <header className="px-6 mb-6">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Select Program</p>
          </header>
        )}

        <div className="relative">
          <section
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory px-6 pb-4 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {PROGRAMS.map(p => {
              const isSelected = selectedId === p.id;
              const showImg = p.img && !brokenImgs[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`${cardClass} flex-shrink-0 w-[280px] snap-start rounded-[2rem] overflow-hidden border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 scale-[1.02] shadow-2xl shadow-blue-600/20'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <div className={`aspect-[4/5] overflow-hidden relative bg-gradient-to-br ${p.gradient}`}>
                    {showImg ? (
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={() => setBrokenImgs(prev => ({ ...prev, [p.id]: true }))}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <span className="text-white font-black text-2xl text-center leading-tight drop-shadow-lg">
                          {p.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{p.level}</p>
                    <h3 className="text-lg font-black tracking-tight mb-2">{p.name}</h3>
                    <p className={`text-xs leading-relaxed ${subTextClass}`}>{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </section>

          <button
            onClick={() => scrollBy(-1)}
            aria-label="이전"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-95 z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="다음"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-95 z-10"
          >
            <ChevronRight size={24} />
          </button>
        </div>

      </div>

      {selectedId && PROGRAM_LIFTS[selectedId] && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${cardClass} w-full max-w-md rounded-[2rem] border shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden`}
          >
            <div className={`flex-shrink-0 flex justify-end items-center gap-2 px-4 pt-4 pb-2 ${
              isDark ? 'bg-[#16161a]/80' : 'bg-white/80'
            } backdrop-blur-md`}>
              {!needsVariantPick && (
                <button
                  onClick={() => setShowCalc(true)}
                  aria-label="1RM 계산기"
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                    isDark ? 'bg-blue-600/15 hover:bg-blue-600/30 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                  }`}
                >
                  <Calculator size={14} />
                  1RM 계산기
                </button>
              )}
              <button
                onClick={() => setSelectedId(null)}
                aria-label="닫기"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="overflow-y-auto px-8 pt-2 pb-8 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {needsVariantPick ? (
                <>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
                    {PROGRAM_META[selectedId].label}
                  </p>

                  <div className="space-y-3">
                    {PROGRAM_VARIANTS[selectedId].map(v => (
                      <button
                        key={v.id}
                        onClick={() => setProgramVariant(v.id)}
                        className={`w-full text-left rounded-2xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all active:scale-[0.99] ${
                          isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`bg-gradient-to-br ${v.gradient} p-5 flex items-center justify-between`}>
                          <div>
                            <p className="text-white font-black text-xl tracking-tight">{v.label}</p>
                            <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mt-1">{v.tag}</p>
                          </div>
                          <ChevronRight size={20} className="text-white/80" />
                        </div>
                        <p className={`text-xs leading-relaxed px-5 py-3 ${subTextClass}`}>{v.desc}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">
                {PROGRAM_META[selectedId].label}{programVariant ? ` · ${PROGRAM_VARIANTS[selectedId].find(v => v.id === programVariant)?.label}` : ''}
              </p>
              <h2 className="text-2xl font-black tracking-tight mb-2">운동별 1RM 입력</h2>
              <p className={`text-xs mb-6 ${subTextClass}`}>
                {PROGRAM_META[selectedId].note}
              </p>

              <div className="space-y-3">
                {PROGRAM_LIFTS[selectedId].map(lift => (
                  <div
                    key={lift.id}
                    className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="font-bold">{lift.name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustWeight(lift.id, -2.5)}
                        aria-label="감소"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        step="2.5"
                        value={weights[lift.id]}
                        onChange={(e) =>
                          setWeights({ ...weights, [lift.id]: parseFloat(e.target.value) || 0 })
                        }
                        style={{ MozAppearance: 'textfield' }}
                        className={`w-16 rounded-lg px-2 py-2 text-center font-black text-blue-500 outline-none border focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 ${
                          isDark ? 'bg-transparent border-white/10' : 'bg-white border-slate-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => adjustWeight(lift.id, 2.5)}
                        aria-label="증가"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Plus size={14} />
                      </button>
                      <span className={`text-xs ${subTextClass} ml-1`}>kg</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartProgram}
                className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black tracking-wide active:scale-95 transition-all"
              >
                {existingProgram?.selectedId === selectedId ? '이어하기' : '프로그램 시작'}
              </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCalc && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowCalc(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${cardClass} w-full max-w-sm rounded-[2rem] border shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden`}
          >
            <div className={`flex-shrink-0 flex justify-end items-center px-4 pt-4 pb-2 ${
              isDark ? 'bg-[#16161a]/80' : 'bg-white/80'
            } backdrop-blur-md`}>
              <button
                onClick={() => setShowCalc(false)}
                aria-label="닫기"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="overflow-y-auto px-8 pt-2 pb-8 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">
                Epley Formula
              </p>
              <h2 className="text-2xl font-black tracking-tight mb-2">1RM 계산기</h2>
              <p className={`text-xs mb-6 ${subTextClass}`}>
                실제로 들어본 무게와 반복 횟수를 입력하면 추정 1RM을 계산합니다.
              </p>

              <div className="space-y-3">
                <div
                  className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="font-bold">무게</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCalcWeight(w => Math.max(0, w - 2.5))}
                      aria-label="감소"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      step="2.5"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                      style={{ MozAppearance: 'textfield' }}
                      className={`w-16 rounded-lg px-2 py-2 text-center font-black text-blue-500 outline-none border focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 ${
                        isDark ? 'bg-transparent border-white/10' : 'bg-white border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setCalcWeight(w => Math.min(500, w + 2.5))}
                      aria-label="증가"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Plus size={14} />
                    </button>
                    <span className={`text-xs ${subTextClass} ml-1`}>kg</span>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="font-bold">반복 횟수</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCalcReps(r => Math.max(1, r - 1))}
                      aria-label="감소"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="1"
                      value={calcReps}
                      onChange={(e) => setCalcReps(parseInt(e.target.value) || 1)}
                      style={{ MozAppearance: 'textfield' }}
                      className={`w-16 rounded-lg px-2 py-2 text-center font-black text-blue-500 outline-none border focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 ${
                        isDark ? 'bg-transparent border-white/10' : 'bg-white border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setCalcReps(r => Math.min(20, r + 1))}
                      aria-label="증가"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Plus size={14} />
                    </button>
                    <span className={`text-xs ${subTextClass} ml-1`}>회</span>
                  </div>
                </div>
              </div>

              <div className={`mt-6 p-6 rounded-2xl border text-center ${
                isDark ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
              }`}>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
                  추정 1RM
                </p>
                <p className="text-4xl font-black text-blue-500">
                  {estimated1RM.toFixed(1)}
                  <span className="text-lg ml-1">kg</span>
                </p>
                <p className={`mt-3 text-[10px] ${subTextClass}`}>
                  공식: 무게 × (1 + 반복/30)
                </p>
              </div>

              <div className="mt-6">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${subTextClass}`}>
                  Apply to
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={applyTarget}
                    onChange={(e) => setApplyTarget(e.target.value)}
                    className={`flex-1 rounded-xl px-4 py-3 font-bold outline-none border focus:border-blue-500 ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    {(selectedId && PROGRAM_LIFTS[selectedId] ? PROGRAM_LIFTS[selectedId] : []).map(lift => (
                      <option key={lift.id} value={lift.id} className={isDark ? 'bg-[#16161a]' : 'bg-white'}>
                        {lift.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={applyEstimate}
                    disabled={estimated1RM <= 0}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm tracking-wide active:scale-95 transition-all"
                  >
                    적용
                  </button>
                </div>
                <p className={`mt-2 text-[10px] ${subTextClass}`}>
                  적용 시 2.5kg 단위로 반올림되어 1RM 입력란에 반영됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutinePlanPage;
