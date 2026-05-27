import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import {
  X, Activity, Utensils, MessageSquare, Save, Pencil, RefreshCw, Loader2, Sparkles,
} from 'lucide-react';
import NutritionProgressRow from './NutritionProgressRow';

// Ollama + gemma3:4b 가 로컬에 깔리고 동작 검증되면 true로 바꾼다.
// false 동안에도 과거에 생성돼 DB 에 남아있는 ai_comment 는 그대로 보여준다.
const AI_ENABLED = false;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatDateLabel = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${iso} (${dow})`;
};

const JournalDayModal = ({ date, theme, nutrition, onClose, onAfterChange }) => {
  const isDark = theme === 'dark' || theme === 'design';
  const overlayClass = 'bg-black/60 backdrop-blur-sm';
  const cardClass = isDark ? 'bg-[#16161a] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-600';
  const sectionBg = isDark ? 'bg-white/5' : 'bg-slate-50';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteEditing, setNoteEditing] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios.get(`${API_BASE_URL}/journal/${date}`, { headers: authHeaders() })
      .then(res => {
        if (!alive) return;
        setData(res.data);
        setNoteDraft(res.data.user_note || '');
        setNoteEditing(!res.data.user_note);
      })
      .catch(err => alive && setError(err?.response?.data?.detail || '불러오기에 실패했습니다.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [date]);

  const hasAnyData = data && (data.workout || data.diet);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/journal/${date}/note`,
        { note: noteDraft },
        { headers: authHeaders() },
      );
      setData(d => ({ ...d, user_note: res.data.user_note }));
      setNoteEditing(false);
      onAfterChange?.();
    } catch (err) {
      setError(err?.response?.data?.detail || '저장에 실패했습니다.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/journal/${date}/regenerate`,
        {},
        { headers: authHeaders() },
      );
      setData(d => ({ ...d, ai_comment: res.data.ai_comment, ai_generated_at: res.data.ai_generated_at }));
      onAfterChange?.();
    } catch (err) {
      setError(err?.response?.data?.detail || 'AI 코멘트 생성에 실패했습니다.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[200] ${overlayClass} flex items-end md:items-center justify-center p-0 md:p-6`}
      onClick={onClose}
    >
      <div
        className={`w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-[2rem] md:rounded-[2rem] border ${cardClass} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md bg-inherit">
          <h2 className="text-xl font-black tracking-tight">{formatDateLabel(date)}</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`} aria-label="닫기">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {loading && (
            <div className={`flex items-center gap-2 ${subText}`}>
              <Loader2 className="animate-spin" size={18} /> 불러오는 중...
            </div>
          )}

          {!loading && error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          {!loading && data && (
            <>
              {/* 운동 */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-orange-500">
                  <Activity size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">운동</span>
                </div>
                {data.workout ? (
                  <div className="space-y-3">
                    {data.workout.sessions.map(s => (
                      <div key={s.id} className={`p-4 rounded-2xl ${sectionBg}`}>
                        <p className="font-bold text-sm mb-2">{s.routine_name}</p>
                        <ul className="space-y-1 text-xs">
                          {s.lifts.map((lift, i) => {
                            const inc = lift.weight > lift.prev_weight;
                            const sets = Array.isArray(lift.sets) ? lift.sets : [];
                            const reps = sets.map(x => x.reps);
                            const allCompleted = sets.length > 0 && sets.every(x => x.completed);
                            const allSame = sets.length > 0 && reps.every(r => r === reps[0]);
                            let repsLabel = null;
                            if (sets.length > 0) {
                              repsLabel = (allSame && allCompleted)
                                ? `${sets.length}×${reps[0]}`
                                : reps.join(',');
                            }
                            return (
                              <li key={i} className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold">{lift.lift_id}</span>
                                <span className={subText}>·</span>
                                <span>{lift.weight}kg</span>
                                {repsLabel && (
                                  <>
                                    <span className={subText}>·</span>
                                    <span className="tabular-nums">{repsLabel}</span>
                                  </>
                                )}
                                {inc && <span className="text-blue-500 text-[10px]">↑ {lift.prev_weight}→{lift.weight}</span>}
                                {lift.outcome === 'success' && <span className="text-green-500 text-[10px]">성공</span>}
                                {lift.outcome === 'fail' && <span className="text-red-500 text-[10px]">실패</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${subText}`}>이 날 운동 기록이 없어요.</p>
                )}
              </section>

              {/* 식단 */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-green-500">
                  <Utensils size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">식단</span>
                </div>
                {data.diet ? (
                  <div className={`p-4 rounded-2xl ${sectionBg} space-y-4`}>
                    {nutrition ? (
                      <div className="space-y-3">
                        <NutritionProgressRow
                          label="칼로리"
                          consumed={data.diet.total.kcal}
                          target={nutrition.target_kcal}
                          unit=" kcal"
                          accent={isDark ? "text-white" : "text-slate-900"}
                          isDark={isDark}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
                          <NutritionProgressRow
                            label="탄수"
                            consumed={data.diet.total.carbs}
                            target={nutrition.target_carbs}
                            unit="g"
                            accent="text-blue-400"
                            isDark={isDark}
                          />
                          <NutritionProgressRow
                            label="단백"
                            consumed={data.diet.total.protein}
                            target={nutrition.target_protein}
                            unit="g"
                            accent="text-orange-400"
                            isDark={isDark}
                          />
                          <NutritionProgressRow
                            label="지방"
                            consumed={data.diet.total.fat}
                            target={nutrition.target_fat}
                            unit="g"
                            accent="text-yellow-400"
                            isDark={isDark}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold">
                        총 {data.diet.total.kcal} kcal
                        <span className={`ml-2 text-xs font-normal ${subText}`}>
                          탄 {data.diet.total.carbs}g · 단 {data.diet.total.protein}g · 지 {data.diet.total.fat}g
                        </span>
                      </p>
                    )}
                    <div className="space-y-1 pt-2 border-t border-white/5">
                      {Object.entries(data.diet.by_meal).map(([meal, foods]) => (
                        <div key={meal} className="text-xs">
                          <span className="font-bold mr-2">{meal}</span>
                          <span className={subText}>{foods.map(f => f.food_name).join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${subText}`}>이 날 식단 기록이 없어요.</p>
                )}
              </section>

              {/* AI 코멘트 */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-blue-500">
                  <MessageSquare size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI 코멘트</span>
                </div>
                {data.ai_comment ? (
                  <div className={`p-4 rounded-2xl ${sectionBg} border border-blue-500/20`}>
                    <p className="text-sm leading-relaxed italic">{data.ai_comment}</p>
                    {AI_ENABLED && (
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          onClick={handleRegenerate}
                          disabled={regenerating}
                          className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'} disabled:opacity-50`}
                        >
                          {regenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          다시 생성
                        </button>
                      </div>
                    )}
                  </div>
                ) : AI_ENABLED ? (
                  hasAnyData ? (
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className={`w-full p-4 rounded-2xl border border-dashed ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 hover:bg-slate-50'} text-sm flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
                      {regenerating ? (
                        <><Loader2 size={16} className="animate-spin" /> 생성 중... (약 8초)</>
                      ) : (
                        <><RefreshCw size={16} /> AI 코멘트 생성</>
                      )}
                    </button>
                  ) : (
                    <p className={`text-sm ${subText}`}>코멘트할 데이터가 없어요.</p>
                  )
                ) : (
                  <div className={`p-4 rounded-2xl ${sectionBg} flex items-center gap-3`}>
                    <Sparkles size={18} className="text-blue-400 flex-shrink-0" />
                    <p className={`text-sm leading-relaxed ${subText}`}>
                      AI 코멘트 기능은 준비 중입니다. 로컬 AI 모델 연결 후 활성화될 예정이에요.
                    </p>
                  </div>
                )}
              </section>

              {/* 한 줄 평 */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-purple-500">
                  <Pencil size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">오늘 한 줄</span>
                </div>
                {noteEditing ? (
                  <div className={`p-4 rounded-2xl ${sectionBg} space-y-3`}>
                    <textarea
                      value={noteDraft}
                      onChange={e => setNoteDraft(e.target.value)}
                      placeholder="오늘 어땠나요?"
                      rows={2}
                      className={`w-full bg-transparent outline-none resize-none text-sm border-b ${isDark ? 'border-white/10' : 'border-slate-200'} focus:border-blue-500 pb-1`}
                    />
                    <div className="flex justify-end gap-2">
                      {data.user_note && (
                        <button
                          onClick={() => { setNoteDraft(data.user_note); setNoteEditing(false); }}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
                        >
                          취소
                        </button>
                      )}
                      <button
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        {savingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl ${sectionBg} flex items-start justify-between gap-3`}>
                    <p className="text-sm leading-relaxed">{data.user_note}</p>
                    <button
                      onClick={() => setNoteEditing(true)}
                      className={`flex-shrink-0 p-1.5 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
                      aria-label="수정"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalDayModal;
