import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import {
  X, Activity, Utensils, Save, Pencil, Loader2, TrendingUp, Sparkles,
} from 'lucide-react';
import NutritionProgressRow from './NutritionProgressRow';

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

              {/* 체성분 (InBody) — 그 날 측정이 있을 때만 */}
              {data.body && (
                <section>
                  <div className="flex items-center gap-2 mb-3 text-blue-500">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">체성분</span>
                  </div>
                  <div className={`p-4 rounded-2xl ${sectionBg} space-y-4`}>
                    {/* 4 지표 + 직전 대비 델타 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: '체중', key: 'weight', unit: 'kg', betterLower: false },
                        { label: '골격근', key: 'skeletal_muscle', unit: 'kg', betterLower: false },
                        { label: '체지방', key: 'body_fat_mass', unit: 'kg', betterLower: true },
                        { label: '체지방률', key: 'body_fat_percent', unit: '%', betterLower: true },
                      ].map(m => {
                        const v = data.body.values?.[m.key];
                        const d = data.body.deltas?.[m.key];
                        const improving = d != null && d !== 0 && (m.betterLower ? d < 0 : d > 0);
                        const declining = d != null && d !== 0 && (m.betterLower ? d > 0 : d < 0);
                        const deltaCls = d == null || d === 0
                          ? subText
                          : improving ? 'text-green-500' : declining ? 'text-orange-500' : subText;
                        return (
                          <div key={m.key}>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${subText} mb-1`}>{m.label}</p>
                            <p className="text-lg font-black tabular-nums">
                              {v != null ? v : <span className={subText}>—</span>}
                              {v != null && <span className={`text-[10px] font-normal ${subText} ml-1`}>{m.unit}</span>}
                            </p>
                            {d != null && (
                              <p className={`text-[10px] font-black mt-0.5 ${deltaCls}`}>
                                {d > 0 ? '+' : ''}{d}{m.unit}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* AI 코멘트 */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={12} className="text-blue-400" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${subText}`}>
                          {data.body.deltas ? '직전 대비 분석' : '첫 측정 평가'}
                        </span>
                      </div>
                      {data.body.ai_comment ? (
                        <p className="text-sm leading-relaxed">{data.body.ai_comment}</p>
                      ) : (
                        <p className={`text-xs ${subText} italic`}>
                          AI 코멘트 생성 중이거나 아직 받아오지 못했어요. 잠시 후 다시 열어보세요.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

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
