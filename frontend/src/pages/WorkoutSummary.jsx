import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Minus, ArrowDown, Clock, Dumbbell, Video } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const LIFT_NAMES_KO = {
  squat: '스쿼트',
  bench: '벤치프레스',
  row: '바벨 로우',
  ohp: '오버헤드 프레스',
  deadlift: '데드리프트',
};

const LIFT_MUSCLE_MAP = {
  squat:    { primary: ['quads'],                      secondary: ['core', 'calves', 'glutes'] },
  bench:    { primary: ['chest'],                      secondary: ['front_delts', 'triceps'] },
  row:      { primary: ['lats'],                       secondary: ['biceps', 'forearms', 'traps'] },
  ohp:      { primary: ['front_delts'],                secondary: ['upper_chest', 'triceps', 'traps'] },
  deadlift: { primary: ['lats', 'traps'],              secondary: ['forearms', 'core', 'quads', 'glutes'] },
};

const computeMuscleActivation = (lifts) => {
  const result = {};
  lifts.forEach(({ liftId }) => {
    const map = LIFT_MUSCLE_MAP[liftId];
    if (!map) return;
    map.primary.forEach(m => { result[m] = 'primary'; });
    map.secondary.forEach(m => { if (result[m] !== 'primary') result[m] = 'secondary'; });
  });
  return result;
};

const formatDuration = (sec) => {
  if (!sec || sec < 0) return '0분';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
};

const ANATOMY_IMG_SRC = '/resources/images/anatomy_sketch_no_eyes_mouth.png';

const BodyDiagram = ({ activation, isDark }) => {
  const [imgError, setImgError] = useState(false);

  const muscleColor = (muscle) => {
    const state = activation?.[muscle] || 'inactive';
    if (state === 'primary') return isDark ? 'rgba(59,130,246,0.7)' : 'rgba(37,99,235,0.55)';
    return 'transparent';
  };

  const imgFilter = isDark ? 'invert(1)' : 'none';
  const imgOpacity = isDark ? 0.9 : 0.95;

  // 이미지를 알파 마스크로 사용 → 색칠은 이미지 픽셀 위에서만 나타남
  const maskStyle = {
    maskImage: `url(${ANATOMY_IMG_SRC})`,
    WebkitMaskImage: `url(${ANATOMY_IMG_SRC})`,
    maskMode: 'alpha',
    WebkitMaskMode: 'alpha',
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };

  return (
    <div
      className="relative w-full max-w-[240px] mx-auto"
      style={{ aspectRatio: '408 / 612' }}
    >
      {!imgError ? (
        <img
          src={ANATOMY_IMG_SRC}
          alt=""
          aria-hidden
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{ filter: imgFilter, opacity: imgOpacity }}
        />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center text-center text-[10px] font-bold px-4 leading-relaxed ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          이미지 누락
          <br />
          public/resources/images/
          <br />
          anatomy_sketch_no_eyes_mouth.png
        </div>
      )}

      <svg
        viewBox="0 0 408 612"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-label="활성 근육 도해"
        style={{
          shapeRendering: 'geometricPrecision',
          mixBlendMode: isDark ? 'screen' : 'multiply',
          ...maskStyle,
        }}
      >
        {/* path는 mask로 이미지 알파 영역에 자동 클리핑되므로 넉넉히 크게 잡음 */}

        {/* TRAPS (목 옆을 제외하고 어깨로 가는 사선 + 어깨 끝까지) */}
        <path d="M170,120 Q204,116 238,120 L268,145 Q204,138 140,145 Z" fill={muscleColor('traps')} />

        {/* FRONT DELTS (어깨 외측 끝까지 덮음) */}
        <path d="M180,120 Q132,122 110,160 Q98,200 130,220 Q170,205 184,168 Q186,142 180,120 Z" fill={muscleColor('front_delts')} />
        <path d="M228,120 Q276,122 298,160 Q310,200 278,220 Q238,205 224,168 Q222,142 228,120 Z" fill={muscleColor('front_delts')} />

        {/* UPPER PEC */}
        <path d="M170,130 Q188,126 204,126 L204,170 L168,176 Q165,150 170,130 Z" fill={muscleColor('upper_chest')} />
        <path d="M238,130 Q220,126 204,126 L204,170 L240,176 Q243,150 238,130 Z" fill={muscleColor('upper_chest')} />

        {/* LOWER PEC */}
        <path d="M168,176 Q190,180 204,170 L204,232 Q188,242 168,232 Q160,200 168,176 Z" fill={muscleColor('chest')} />
        <path d="M240,176 Q218,180 204,170 L204,232 Q220,242 240,232 Q248,200 240,176 Z" fill={muscleColor('chest')} />

        {/* BICEPS (상완 전체 + 안쪽까지) */}
        <path d="M115,175 Q102,225 115,275 Q140,290 165,278 Q172,225 168,178 Z" fill={muscleColor('biceps')} />
        <path d="M293,175 Q306,225 293,275 Q268,290 243,278 Q236,225 240,178 Z" fill={muscleColor('biceps')} />

        {/* TRICEPS (상완 바깥쪽) */}
        <path d="M105,195 Q92,238 102,278 Q120,278 122,238 Q120,200 105,195 Z" fill={muscleColor('triceps')} />
        <path d="M303,195 Q316,238 306,278 Q288,278 286,238 Q288,200 303,195 Z" fill={muscleColor('triceps')} />

        {/* FOREARMS (전완 전체 + 손목까지) */}
        <path d="M110,272 Q86,308 98,348 Q122,372 155,368 L170,358 Q172,300 158,272 Z" fill={muscleColor('forearms')} />
        <path d="M298,272 Q322,308 310,348 Q286,372 253,368 L238,358 Q236,300 250,272 Z" fill={muscleColor('forearms')} />

        {/* LATS (옆구리 V-taper 넓게) */}
        <path d="M145,165 L175,180 L178,228 L150,224 Q132,194 145,165 Z" fill={muscleColor('lats')} />
        <path d="M263,165 L233,180 L230,228 L258,224 Q276,194 263,165 Z" fill={muscleColor('lats')} />

        {/* SERRATUS / OBLIQUES */}
        <path d="M148,215 Q168,228 172,278 L176,322 L156,330 Q142,278 148,215 Z" fill={muscleColor('core')} opacity="0.8" />
        <path d="M260,215 Q240,228 236,278 L232,322 L252,330 Q266,278 260,215 Z" fill={muscleColor('core')} opacity="0.8" />

        {/* RECTUS ABDOMINIS 6-pack (가운데 복근 영역 전체 덮음) */}
        <path d="M170,212 Q190,208 204,210 L204,326 Q190,330 170,326 Q160,270 170,212 Z" fill={muscleColor('core')} />
        <path d="M238,212 Q218,208 204,210 L204,326 Q218,330 238,326 Q248,270 238,212 Z" fill={muscleColor('core')} />

        {/* GLUTES (옆 hip area 넓게) */}
        <path d="M138,325 Q126,365 142,395 L172,388 Q174,355 158,325 Z" fill={muscleColor('glutes')} />
        <path d="M270,325 Q282,365 266,395 L236,388 Q234,355 250,325 Z" fill={muscleColor('glutes')} />

        {/* QUADRICEPS 3 heads (다리 전체 덮음) */}
        {/* Left */}
        <path d="M148,330 Q132,410 144,470 L182,478 Q188,400 184,335 Z" fill={muscleColor('quads')} />
        <path d="M186,335 Q188,410 196,478 L204,478 L204,330 Z" fill={muscleColor('quads')} />
        {/* Right */}
        <path d="M260,330 Q276,410 264,470 L226,478 Q220,400 224,335 Z" fill={muscleColor('quads')} />
        <path d="M222,335 Q220,410 212,478 L204,478 L204,330 Z" fill={muscleColor('quads')} />

        {/* CALVES (종아리 전체) */}
        <path d="M158,488 Q140,545 152,592 Q172,612 196,608 L204,602 Q206,545 196,488 Z" fill={muscleColor('calves')} />
        <path d="M250,488 Q268,545 256,592 Q236,612 212,608 L204,602 Q202,545 212,488 Z" fill={muscleColor('calves')} />
      </svg>
    </div>
  );
};

const WeightTrendChart = ({ chartKey, history, isDark }) => {
  const data = useMemo(() => {
    const points = [];
    history.forEach((entry) => {
      // 옛 기록은 anchorKey 가 없으므로 liftId 로 대체 매칭
      const lift = entry.lifts?.find(l => (l.anchorKey || l.liftId) === chartKey);
      if (!lift) return;
      if (points.length === 0 && lift.prevWeight != null) {
        points.push({ label: '시작', weight: lift.prevWeight });
      }
      points.push({
        label: new Date(entry.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        weight: lift.weight,
      });
    });
    return points;
  }, [history, chartKey]);

  if (data.length === 0) {
    return (
      <div className={`h-32 flex items-center justify-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        기록 없음
      </div>
    );
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e2e8f0'} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} />
          <YAxis tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} domain={['auto', 'auto']} width={32} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`,
              borderRadius: '12px',
              fontSize: '12px',
            }}
            formatter={(v) => [`${v} kg`, '무게']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#2563eb' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const WorkoutSummary = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  const isDark = theme === 'dark' || theme === 'design';
  const bgClass = isDark ? 'bg-[#0c0c0e]' : 'bg-slate-50';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const cardClass = isDark ? 'bg-[#16161a] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const subTextClass = isDark ? 'text-slate-400' : 'text-slate-600';

  const history = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('fiteating.program.history') || '[]'); }
    catch { return []; }
  }, []);

  const liftResults = state?.liftResults || [];
  const workout = state?.workout;
  const workoutLabel = state?.workoutLabel || (workout ? `Workout ${workout}` : '운동');
  const durationSec = state?.durationSec || 0;
  const activation = useMemo(() => computeMuscleActivation(liftResults), [liftResults]);

  if (!state || !state.liftResults) {
    return (
      <div className={`fixed inset-0 ${bgClass} ${textClass} overflow-y-auto`}>
        <div className="w-full max-w-3xl mx-auto pt-[80px] pb-[120px] px-6">
          <div className={`${cardClass} rounded-[2rem] p-10 border text-center`}>
            <h1 className="text-2xl font-black tracking-tight mb-2">결과 데이터가 없습니다</h1>
            <p className={`text-sm ${subTextClass} mb-6`}>운동을 완료한 후 다시 시도해주세요.</p>
            <button
              onClick={() => navigate('/program')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest"
            >
              프로그램 목록
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">
            Workout Summary
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
            {workoutLabel} 완료
          </h1>
          <div className={`flex items-center gap-4 text-sm ${subTextClass}`}>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> {formatDuration(durationSec)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dumbbell size={14} /> {liftResults.length}개 종목
            </span>
          </div>
        </header>

        {/* 1. 운동 부위 + 증량 결과 (좌우 배치) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 좌: 운동 부위 */}
          <section className={`${cardClass} rounded-[2rem] p-5 md:p-6 border`}>
            <h2 className="text-lg font-black tracking-tight mb-4">운동 부위</h2>
            <BodyDiagram activation={activation} isDark={isDark} />
          </section>

          {/* 우: 메인세트 증량 결과 */}
          <section className={`${cardClass} rounded-[2rem] p-5 md:p-6 border`}>
            <h2 className="text-lg font-black tracking-tight mb-1">메인세트 증량 결과</h2>
            <p className={`text-xs ${subTextClass} mb-4`}>
              다음 세션의 기준 무게입니다.
            </p>
            <div className="space-y-2.5">
              {liftResults.map(r => {
                const diff = r.nextWeight - r.prevWeight;
                const isUp = diff > 0;
                const isDown = diff < 0;
                const Icon = isUp ? TrendingUp : isDown ? ArrowDown : Minus;
                const tagColor = isUp
                  ? 'bg-blue-600 text-white'
                  : isDown
                    ? 'bg-orange-500 text-white'
                    : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600';
                const tagText = isUp ? `+${diff} kg` : isDown ? `${diff} kg` : '유지';
                const ko = LIFT_NAMES_KO[r.liftId] || r.liftId;
                const koDisplay = r.role ? `${ko} · ${r.role}` : ko;
                return (
                  <div
                    key={r.anchorKey || r.liftId}
                    className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl border ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black tracking-tight">{koDisplay}</p>
                      <p className={`text-xs ${subTextClass} mt-0.5`}>
                        <span className="font-bold">{r.prevWeight}</span>
                        <span className="mx-1.5">→</span>
                        <span className="font-black text-blue-500">{r.nextWeight} kg</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/formcheck/${encodeURIComponent(ko)}`)}
                        className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
                          isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        <Video size={11} />
                        자세 분석
                      </button>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${tagColor}`}>
                      <Icon size={12} /> {tagText}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* 3. 추이 그래프 */}
        <section className={`${cardClass} rounded-[2rem] p-6 md:p-8 border`}>
          <h2 className="text-lg font-black tracking-tight mb-1">무게 변화 추이</h2>
          <p className={`text-xs ${subTextClass} mb-6`}>
            오늘 수행한 종목의 세션별 작업 무게입니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liftResults.map(r => (
              <div
                key={r.anchorKey || r.liftId}
                className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}
              >
                <p className="text-xs font-black tracking-tight mb-2">
                  {LIFT_NAMES_KO[r.liftId] || r.liftId}{r.role ? ` · ${r.role}` : ''}
                </p>
                <WeightTrendChart chartKey={r.anchorKey || r.liftId} history={history} isDark={isDark} />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex gap-3">
          <button
            onClick={() => navigate('/journal')}
            className={`flex-1 py-4 rounded-2xl font-black text-sm tracking-wide active:scale-95 transition-all ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            }`}
          >
            홈으로
          </button>
          <button
            onClick={() => navigate('/program')}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm tracking-wide active:scale-95 transition-all shadow-xl shadow-blue-600/20"
          >
            프로그램 목록
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSummary;
