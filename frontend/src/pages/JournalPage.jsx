import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import JournalDayModal from '../components/JournalDayModal';

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const toISO = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const JournalPage = ({ theme }) => {
  const isDark = theme === 'dark' || theme === 'design';
  const bgClass = isDark ? 'bg-[#0c0c0e]' : 'bg-slate-50';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const cardClass = isDark ? 'bg-[#16161a] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-600';
  const cellEmpty = isDark ? 'bg-white/5' : 'bg-slate-100';
  const cellHover = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [nutrition, setNutrition] = useState(null);

  const fetchCalendar = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/journal/calendar`, {
      params: { year, month },
      headers: authHeaders(),
    })
      .then(res => setCalendar(res.data))
      .catch(() => setCalendar({ year, month, days: [] }))
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  // 영양 목표 한 번만 받아서 모달에 내려준다 (모달 매번 fetch 안 하도록).
  useEffect(() => {
    axios.get(`${API_BASE_URL}/user/me`, { headers: authHeaders() })
      .then(res => setNutrition(res.data?.nutrition || null))
      .catch(() => setNutrition(null));
  }, []);

  // 진입 직후 오늘 날짜 모달을 한 번 펼친다 — 메인 페이지로서 즉시 오늘 상태를 보여주기 위함.
  // 사용자가 닫으면 그대로 캘린더만 보이고, 페이지 다시 진입 시 또 펼침.
  useEffect(() => {
    setSelectedDate(toISO(today.getFullYear(), today.getMonth() + 1, today.getDate()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goPrevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayISO = toISO(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const dayMap = (calendar?.days || []).reduce((acc, d) => {
    acc[d.date] = d;
    return acc;
  }, {});

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ kind: 'pad', key: `pad-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    cells.push({ kind: 'day', key: iso, day: d, iso, info: dayMap[iso] });
  }

  return (
    <div
      className={`fixed inset-0 ${bgClass} ${textClass} overflow-y-auto [&::-webkit-scrollbar]:hidden animate-in slide-in-from-right duration-300`}
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="w-full max-w-3xl mx-auto pt-[80px] pb-[120px] px-6">
        <header className="mb-8">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">
            Fitness &amp; Meals Journal
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1">My Daily Journal</h1>
          <p className={`text-sm ${subText}`}>날짜를 누르면 그날의 운동·식단·AI 코멘트가 열립니다.</p>
        </header>

        <div className={`${cardClass} rounded-[2rem] p-6 border`}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goPrevMonth}
              className={`p-2 rounded-full ${cellHover}`}
              aria-label="이전 달"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-black tabular-nums">
              {year}년 {String(month).padStart(2, '0')}월
            </h2>
            <button
              onClick={goNextMonth}
              className={`p-2 rounded-full ${cellHover}`}
              aria-label="다음 달"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEK_LABELS.map((w, i) => (
              <div
                key={w}
                className={`text-center text-[10px] font-black uppercase tracking-widest py-2 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : subText
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map(cell => {
              if (cell.kind === 'pad') {
                return <div key={cell.key} className="aspect-square" />;
              }
              const isToday = cell.iso === todayISO;
              const info = cell.info;
              const has = info && (info.has_workout || info.has_meal || info.has_ai || info.has_note);
              return (
                <button
                  key={cell.key}
                  onClick={() => setSelectedDate(cell.iso)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-start p-1.5 transition-colors ${
                    has ? cellEmpty : ''
                  } ${cellHover} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <span className={`text-xs font-black ${isToday ? 'text-blue-500' : ''}`}>{cell.day}</span>
                  {info && (
                    <div className="flex gap-0.5 mt-auto pb-0.5">
                      {info.has_workout && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="운동" />}
                      {info.has_meal && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="식단" />}
                      {info.has_ai && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="AI 코멘트" />}
                      {info.has_note && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="한 줄 메모" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className={`mt-6 flex items-center justify-center gap-2 ${subText}`}>
              <Loader2 className="animate-spin" size={14} />
              <span className="text-xs">불러오는 중...</span>
            </div>
          )}

          <div className={`mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[10px] ${subText}`}>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />운동</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />식단</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />AI</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />한 줄</span>
          </div>
        </div>
      </div>

      {selectedDate && (
        <JournalDayModal
          date={selectedDate}
          theme={theme}
          nutrition={nutrition}
          onClose={() => setSelectedDate(null)}
          onAfterChange={fetchCalendar}
        />
      )}
    </div>
  );
};

export default JournalPage;
