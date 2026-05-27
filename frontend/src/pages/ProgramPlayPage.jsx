import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import {
  ChevronLeft, Check, CheckCheck, Clock, Pause, Play, SkipForward,
  Plus, Minus, Video, Flame, Trophy,
} from 'lucide-react';
import {
  LIFT_NAMES_KO, getProgram, resolveSession, resolveExercises,
  computeSetWeight, computeProgression, initialAnchor,
} from '../programs';

const REST_DEFAULTS_SEC = {
  squat: 180, deadlift: 180,
  bench: 120, ohp: 120, row: 120,
};

const formatElapsed = (sec) => {
  if (sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatRest = (sec) => {
  const abs = Math.abs(sec);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const sign = sec < 0 ? '+' : '';
  return `${sign}${m}:${String(s).padStart(2, '0')}`;
};

const ProgramPlayPage = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [programState, setProgramState] = useState(null);
  const [setData, setSetData] = useState({});
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [sessionPausedAt, setSessionPausedAt] = useState(null);
  const [sessionPauseAccumMs, setSessionPauseAccumMs] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState(null);

  useEffect(() => {
    const fromNav = location.state;
    const fromStorage = (() => {
      try { return JSON.parse(localStorage.getItem('fiteating.program') || 'null'); }
      catch { return null; }
    })();
    const state = fromNav || fromStorage;

    if (!state || !state.selectedId) {
      navigate('/program', { replace: true });
      return;
    }
    setProgramState(state);
    setSessionStartedAt(Date.now());
    if (fromNav) {
      localStorage.setItem('fiteating.program', JSON.stringify(state));
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const startRest = (liftId) => {
    const total = REST_DEFAULTS_SEC[liftId] ?? 120;
    setRest({ liftId, endsAt: Date.now() + total * 1000, paused: false });
  };

  const adjustRest = (deltaSec) => {
    setRest(r => {
      if (!r) return r;
      if (r.paused) {
        return { ...r, pausedRemaining: r.pausedRemaining + deltaSec };
      }
      return { ...r, endsAt: r.endsAt + deltaSec * 1000 };
    });
  };

  const pauseRest = () => {
    setRest(r => {
      if (!r || r.paused) return r;
      const remaining = Math.ceil((r.endsAt - Date.now()) / 1000);
      return { ...r, paused: true, pausedRemaining: remaining };
    });
  };

  const resumeRest = () => {
    setRest(r => {
      if (!r || !r.paused) return r;
      return { ...r, paused: false, endsAt: Date.now() + r.pausedRemaining * 1000, pausedRemaining: undefined };
    });
  };

  const skipRest = () => setRest(null);

  const pauseSession = () => {
    if (!sessionStartedAt || sessionPausedAt) return;
    setSessionPausedAt(Date.now());
  };

  const resumeSession = () => {
    if (!sessionPausedAt) return;
    setSessionPauseAccumMs(prev => prev + (Date.now() - sessionPausedAt));
    setSessionPausedAt(null);
  };

  const elapsedSec = sessionStartedAt
    ? Math.floor((((sessionPausedAt ?? now) - sessionStartedAt - sessionPauseAccumMs)) / 1000)
    : 0;
  const restRemaining = rest
    ? (rest.paused ? rest.pausedRemaining : Math.ceil((rest.endsAt - now) / 1000))
    : 0;

  const isDark = theme === 'dark' || theme === 'design';
  const bgClass = isDark ? 'bg-[#0c0c0e]' : 'bg-slate-50';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const cardClass = isDark ? 'bg-[#16161a] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const subTextClass = isDark ? 'text-slate-400' : 'text-slate-600';

  if (!programState) return null;

  const program = getProgram(programState);

  // 세션 구현이 아직 없는 프로그램용 안내 화면
  if (!program) {
    return (
      <div
        className={`fixed inset-0 ${bgClass} ${textClass} overflow-y-auto [&::-webkit-scrollbar]:hidden animate-in slide-in-from-right duration-300`}
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="w-full max-w-3xl mx-auto pt-[80px] pb-[120px] px-6">
          <button
            onClick={() => navigate('/program')}
            className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ChevronLeft size={16} /> 프로그램 목록
          </button>
          <div className={`${cardClass} rounded-[2rem] p-10 border text-center`}>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-3">
              {programState.selectedId}
            </p>
            <h1 className="text-2xl font-black tracking-tight mb-2">선택한 프로그램 정보를 찾을 수 없습니다</h1>
            <p className={`text-sm ${subTextClass}`}>
              프로그램 목록에서 다시 선택해 주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const session = resolveSession(program, programState.lastCompletedWorkout);
  const nextSession = resolveSession(program, session.id);
  const exercises = resolveExercises(session, programState);

  // 복합 anchorKey(GZCLP·PHUL) 운동의 방어적 폴백 — 보통은 workingWeights 에 존재
  const anchorOf = (ex) => {
    const saved = programState.workingWeights?.[ex.anchorKey];
    if (saved !== undefined) return saved;
    const orm = programState.weights?.[ex.liftId] || 0;
    if (ex.prog === 'gzclp') {
      const pct = ex.tier === 'T1' ? 0.7 : ex.tier === 'T2' ? 0.5 : 0.45;
      return orm > 0 ? Math.max(20, Math.round(orm * pct / 2.5) * 2.5) : 20;
    }
    if (ex.role === 'P' || ex.role === 'H') {
      const pct = ex.role === 'P' ? 0.6 : 0.45;
      return orm > 0 ? Math.max(20, Math.round(orm * pct / 2.5) * 2.5) : 20;
    }
    return initialAnchor(programState.selectedId, orm);
  };

  const toggleSet = (anchorKey, idx, targetReps, liftId) => {
    const key = `${anchorKey}-${idx}`;
    const wasCompleted = setData[key]?.completed === true;
    setSetData(prev => {
      const current = prev[key] || { reps: targetReps, completed: false };
      return { ...prev, [key]: { ...current, completed: !current.completed } };
    });
    if (!wasCompleted) startRest(liftId);
  };

  const updateReps = (anchorKey, idx, reps, targetReps) => {
    const key = `${anchorKey}-${idx}`;
    setSetData(prev => {
      const current = prev[key] || { reps: targetReps, completed: false };
      return { ...prev, [key]: { ...current, reps } };
    });
  };

  // AMRAP·PR·여분 반복 세트는 직접 입력해야 하므로 일괄 완료에서 제외
  const completeAllAutoSets = () => {
    setSetData(prev => {
      const next = { ...prev };
      exercises.forEach(ex => {
        ex.sets.forEach((spec, i) => {
          if (spec.kind === 'amrap' || spec.kind === 'top' || spec.kind === 'plus') return;
          const key = `${ex.anchorKey}-${i}`;
          if (next[key]?.completed) return;
          next[key] = { reps: next[key]?.reps ?? spec.reps, completed: true };
        });
      });
      return next;
    });
  };

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const doneSets = Object.values(setData).filter(d => d.completed).length;
  const progress = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  const handleFinish = () => {
    const newWW = { ...(programState.workingWeights || {}) };
    const newFails = { ...(programState.consecutiveFails || {}) };
    const newStages = { ...(programState.stages || {}) };
    const liftResults = [];

    exercises.forEach(ex => {
      const anchor = anchorOf(ex);
      const setStates = ex.sets.map((spec, i) => {
        const d = setData[`${ex.anchorKey}-${i}`];
        return { reps: d?.reps ?? 0, completed: !!d?.completed };
      });
      const { nextAnchor, nextFails, nextStage, outcome } = computeProgression(
        program, ex, anchor, newFails[ex.anchorKey] || 0, setStates,
      );
      newWW[ex.anchorKey] = nextAnchor;
      newFails[ex.anchorKey] = nextFails;
      if (ex.prog === 'gzclp') newStages[ex.anchorKey] = nextStage;
      liftResults.push({
        liftId: ex.liftId,
        anchorKey: ex.anchorKey,
        role: ex.role || null,
        prevWeight: anchor,
        nextWeight: nextAnchor,
        outcome,
        sets: setStates,
      });
    });

    const finishedAt = Date.now();
    const totalPausedMs = sessionPauseAccumMs + (sessionPausedAt ? finishedAt - sessionPausedAt : 0);
    const durationSec = sessionStartedAt
      ? Math.round((finishedAt - sessionStartedAt - totalPausedMs) / 1000)
      : 0;

    const historyEntry = {
      date: new Date(finishedAt).toISOString(),
      workout: session.id,
      workoutLabel: session.label,
      durationSec,
      lifts: liftResults.map(r => ({
        liftId: r.liftId,
        anchorKey: r.anchorKey,
        weight: r.nextWeight,
        prevWeight: r.prevWeight,
        outcome: r.outcome,
        sets: r.sets,
      })),
    };

    let history = [];
    try { history = JSON.parse(localStorage.getItem('fiteating.program.history') || '[]'); }
    catch { history = []; }
    history.push(historyEntry);
    localStorage.setItem('fiteating.program.history', JSON.stringify(history));

    // 로그인 상태면 백엔드 DB에도 세션 기록을 보낸다 (실패해도 무시 — localStorage가 우선).
    const token = localStorage.getItem('token');
    if (token) {
      axios.post(
        `${API_BASE_URL}/routine/log`,
        {
          date: historyEntry.date,
          workout: historyEntry.workout,
          workout_label: historyEntry.workoutLabel,
          duration_sec: historyEntry.durationSec,
          lifts: historyEntry.lifts.map(l => ({
            lift_id: l.liftId,
            anchor_key: l.anchorKey,
            weight: l.weight,
            prev_weight: l.prevWeight,
            outcome: l.outcome,
            sets: l.sets || [],
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      ).catch(() => {});
    }

    const updated = {
      ...programState,
      workingWeights: newWW,
      consecutiveFails: newFails,
      stages: newStages,
      lastCompletedWorkout: session.id,
    };
    localStorage.setItem('fiteating.program', JSON.stringify(updated));

    navigate('/program/summary', {
      state: {
        programId: programState.selectedId,
        workout: session.id,
        workoutLabel: session.label,
        durationSec,
        liftResults,
      },
    });
  };

  return (
    <div
      className={`fixed inset-0 ${bgClass} ${textClass} overflow-y-auto [&::-webkit-scrollbar]:hidden animate-in slide-in-from-right duration-300`}
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="w-full max-w-3xl mx-auto pt-[80px] pb-[120px] px-6">
        <button
          onClick={() => navigate('/program')}
          className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
            isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          <ChevronLeft size={16} /> 프로그램 목록
        </button>

        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">
                {program.label}{program.variantLabel ? ` · ${program.variantLabel}` : ''}
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
                {session.label}
              </h1>
            </div>
            <button
              type="button"
              onClick={sessionPausedAt ? resumeSession : pauseSession}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tabular-nums whitespace-nowrap transition-colors active:scale-95 ${
                sessionPausedAt
                  ? (isDark ? 'bg-white/5 text-slate-500 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                  : (isDark ? 'bg-white/5 text-blue-400 hover:bg-white/10' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')
              }`}
              aria-label={sessionPausedAt ? '운동 재개' : '운동 일시정지'}
            >
              <Clock size={12} />
              {formatElapsed(elapsedSec)}
              {sessionPausedAt ? <Play size={12} /> : <Pause size={12} />}
            </button>
          </div>
          <p className={`text-sm ${subTextClass}`}>
            {program.desc} 다음 세션은 <span className="font-black text-blue-500">{nextSession.label}</span> 입니다.
          </p>

          <div className="mt-5 flex justify-end mb-2">
            <button
              onClick={completeAllAutoSets}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                isDark ? 'bg-blue-600/15 hover:bg-blue-600/30 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
            >
              <CheckCheck size={14} />
              전체 완료
            </button>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${subTextClass}`}>
            {doneSets} / {totalSets} 세트 · {progress}%
          </p>
        </header>

        <section className="space-y-5">
          {exercises.map(ex => {
            const anchor = anchorOf(ex);
            const setWeights = ex.sets.map(spec => computeSetWeight(anchor, spec.pct));
            const topWeight = Math.max(...setWeights);
            const first = ex.sets[0];
            const uniform = ex.sets.every(x => x.pct === first.pct && x.reps === first.reps);
            const schemeText = uniform
              ? `${ex.sets.length}×${first.reps} · ${topWeight} kg`
              : `${ex.sets.length}세트 · 최대 ${topWeight} kg`;
            return (
              <div key={ex.anchorKey} className={`${cardClass} rounded-[2rem] p-6 border`}>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-2xl font-black tracking-tight truncate">{LIFT_NAMES_KO[ex.liftId]}</h2>
                    {ex.role && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ex.role === 'T1'
                          ? 'bg-purple-500/15 text-purple-400'
                          : isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {ex.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest whitespace-nowrap">
                      {schemeText}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(`/formcheck/${encodeURIComponent(LIFT_NAMES_KO[ex.liftId])}`, '_blank', 'noopener')}
                      aria-label="자세 분석"
                      title="자세 분석 (새 탭에서 열기)"
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors active:scale-95 ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Video size={12} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {ex.sets.map((spec, i) => {
                    const key = `${ex.anchorKey}-${i}`;
                    const data = setData[key] || { reps: spec.reps, completed: false };
                    const w = setWeights[i];
                    const isAmrap = spec.kind === 'amrap';
                    const isTop = spec.kind === 'top';
                    const isPlus = spec.kind === 'plus';
                    const allowsExtra = isAmrap || isPlus;
                    const isDone = data.completed;
                    const isShort = isDone && !allowsExtra && data.reps < spec.reps;

                    let rowClass;
                    let circleClass;
                    let btnClass;
                    if (isDone && isShort) {
                      rowClass = isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200';
                      circleClass = 'bg-orange-500 text-white';
                      btnClass = 'bg-orange-500 text-white';
                    } else if (isDone && isAmrap) {
                      rowClass = isDark ? 'bg-purple-500/15 border-purple-500/40' : 'bg-purple-50 border-purple-200';
                      circleClass = 'bg-purple-500 text-white';
                      btnClass = 'bg-purple-500 text-white';
                    } else if (isDone && isTop) {
                      rowClass = isDark ? 'bg-amber-500/15 border-amber-500/40' : 'bg-amber-50 border-amber-200';
                      circleClass = 'bg-amber-500 text-white';
                      btnClass = 'bg-amber-500 text-white';
                    } else if (isDone) {
                      rowClass = isDark ? 'bg-blue-600/15 border-blue-500/40' : 'bg-blue-50 border-blue-200';
                      circleClass = 'bg-blue-600 text-white';
                      btnClass = 'bg-blue-600 text-white';
                    } else {
                      rowClass = isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200';
                      circleClass = isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600';
                      btnClass = isDark
                        ? 'bg-white/10 hover:bg-white/20 text-slate-400'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-500';
                    }

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${rowClass}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${circleClass}`}>
                          {i + 1}
                        </div>

                        <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
                          <span className="font-black">{w}</span>
                          <span className={`text-xs ${subTextClass}`}>kg</span>
                          <span className={`text-xs ${subTextClass} mx-1`}>×</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="1"
                            value={data.reps}
                            onChange={(e) =>
                              updateReps(ex.anchorKey, i, parseInt(e.target.value, 10) || 0, spec.reps)
                            }
                            style={{ MozAppearance: 'textfield' }}
                            className={`w-12 rounded-lg px-2 py-1 text-center font-black outline-none border focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 ${
                              isDone ? (isShort ? 'text-orange-500' : isAmrap ? 'text-purple-500' : isTop ? 'text-amber-500' : 'text-blue-500') : ''
                            } ${isDark ? 'bg-transparent border-white/10' : 'bg-white border-slate-200'}`}
                          />
                          <span className={`text-xs ${subTextClass}`}>회</span>

                          {isAmrap && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 ml-1">
                              <Flame size={10} /> AMRAP
                            </span>
                          )}
                          {isTop && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 ml-1">
                              <Trophy size={10} /> PR
                            </span>
                          )}

                          <span className={`text-[10px] ml-auto whitespace-nowrap ${subTextClass}`}>
                            목표 {spec.reps}{allowsExtra ? '+' : ''}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleSet(ex.anchorKey, i, spec.reps, ex.liftId)}
                          aria-label={isDone ? '완료 취소' : '완료'}
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${btnClass}`}
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {rest && (
          <div
            className={`mt-8 p-4 rounded-2xl border ${
              restRemaining > 0
                ? (isDark ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-50 border-blue-200')
                : (isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200')
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  restRemaining > 0 ? 'text-blue-500' : 'text-orange-500'
                }`}
              >
                쉬는 시간 · {LIFT_NAMES_KO[rest.liftId] || rest.liftId}
              </span>
              <span
                className={`text-3xl font-black tabular-nums ${
                  restRemaining <= 0 ? 'text-orange-500' : ''
                }`}
              >
                {formatRest(restRemaining)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => adjustRest(-30)}
                className={`flex-1 min-w-[64px] inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-black ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Minus size={12} /> 30s
              </button>
              <button
                onClick={() => adjustRest(30)}
                className={`flex-1 min-w-[64px] inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-black ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Plus size={12} /> 30s
              </button>
              <button
                onClick={rest.paused ? resumeRest : pauseRest}
                className={`flex-1 min-w-[64px] inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-black ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {rest.paused ? <><Play size={12} /> 재개</> : <><Pause size={12} /> 일시정지</>}
              </button>
              <button
                onClick={skipRest}
                className={`flex-1 min-w-[64px] inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-black ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <SkipForward size={12} /> 스킵
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleFinish}
          className="w-full mt-6 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg tracking-wide active:scale-95 transition-all shadow-xl shadow-blue-600/20"
        >
          운동 완료
        </button>
      </div>
    </div>
  );
};

export default ProgramPlayPage;
