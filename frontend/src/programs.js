// 운동 프로그램 엔진
// StrongLifts 5x5 / Madcow 5x5 / nSuns 5/3/1 LP / Starting Strength /
// Greyskull LP / GZCLP / Wendler 5/3/1 / Texas Method / Push·Pull·Legs / PHUL
//
// 모든 프로그램을 "세션(하루 운동) → 운동 → 세트 스펙" 구조로 통일한다.
// 세트 스펙의 pct 는 운동별 기준 무게(anchor) 대비 비율이며, anchor 의 의미는
// 프로그램마다 다르다.
//   StrongLifts / SS / Greyskull / PPL : anchor = 작업 무게
//   Madcow / Texas                     : anchor = 탑(인텐시티) 세트 무게
//   nSuns / Wendler                    : anchor = TM(1RM x 90%)
//   GZCLP                              : anchor = (운동 × 티어) 별 작업 무게
//   PHUL                               : anchor = (운동 × 파워/하이퍼) 별 작업 무게
//
// anchorKey 로 workingWeights / consecutiveFails / stages 를 키잉한다.
// GZCLP·PHUL 만 복합 anchorKey, 나머지는 anchorKey = liftId.

export const LIFT_NAMES_KO = {
  squat: '스쿼트',
  bench: '벤치프레스',
  row: '바벨 로우',
  ohp: '오버헤드 프레스',
  deadlift: '데드리프트',
};

export const VARIANT_LABELS = {
  '4day': '주 4일',
  '5day': '주 5일',
  '6day': '주 6일',
};

export const BARBELL_WEIGHT_KG = 20;
export const PLATE_STEP_KG = 2.5;

export const roundToPlate = (w) => Math.round(w / PLATE_STEP_KG) * PLATE_STEP_KG;
export const floorToPlate = (w) => Math.floor(w / PLATE_STEP_KG) * PLATE_STEP_KG;

// 세트 실제 무게 (빈 봉 미만으로는 내려가지 않음)
export const computeSetWeight = (anchor, pct) =>
  Math.max(BARBELL_WEIGHT_KG, roundToPlate((anchor || 0) * pct));

const oneAnchor = (oneRM, pct) =>
  !oneRM || oneRM <= 0 ? BARBELL_WEIGHT_KG : Math.max(BARBELL_WEIGHT_KG, roundToPlate(oneRM * pct));

// 1RM 입력값으로부터 프로그램별 시작 기준 무게(anchor)를 산출
export function initialAnchor(programId, oneRM) {
  const tmPrograms = programId === 'nsuns' || programId === 'wendler_531';
  return oneAnchor(oneRM, tmPrograms ? 0.9 : 0.5);
}

// GZCLP 는 (운동 × 티어) 별로 기준 무게가 다르다.
export function gzclpInitialAnchors(weights) {
  const out = {};
  ['squat', 'bench', 'ohp', 'deadlift'].forEach((lift) => {
    out[`${lift}-T1`] = oneAnchor(weights[lift], 0.7);
    out[`${lift}-T2`] = oneAnchor(weights[lift], 0.5);
  });
  out['row-T3'] = oneAnchor(weights.row, 0.45);
  return out;
}

// PHUL 은 (운동 × 파워/하이퍼트로피) 별로 기준 무게가 다르다.
export function phulInitialAnchors(weights) {
  const out = {};
  ['squat', 'bench', 'ohp', 'deadlift', 'row'].forEach((lift) => {
    out[`${lift}-P`] = oneAnchor(weights[lift], 0.6);
    out[`${lift}-H`] = oneAnchor(weights[lift], 0.45);
  });
  return out;
}

// 프로그램 시작 시의 초기 상태 (workingWeights / consecutiveFails / stages)
function makeInit(workingWeights) {
  const consecutiveFails = {};
  const stages = {};
  Object.keys(workingWeights).forEach((k) => {
    consecutiveFails[k] = 0;
    stages[k] = 0;
  });
  return { workingWeights, consecutiveFails, stages };
}

export function programInitialState(programId, weights) {
  if (programId === 'gzclp') return makeInit(gzclpInitialAnchors(weights));
  if (programId === 'phul') return makeInit(phulInitialAnchors(weights));
  const ww = {};
  Object.keys(weights).forEach((lift) => {
    ww[lift] = initialAnchor(programId, weights[lift] || 0);
  });
  return makeInit(ww);
}

// --- 세트 스펙 빌더 ---
// kind: 'normal' | 'amrap'(증량 결정 세트) | 'plus'(여분 반복) | 'top'(PR 세트)
const set = (pct, reps, kind = 'normal') => ({ pct, reps, kind });
const flat = (count, pct, reps) => Array.from({ length: count }, () => set(pct, reps));
const ramp = (pcts, reps) => pcts.map((p) => set(p, reps));

const INCREMENT = { squat: 2.5, bench: 2.5, row: 2.5, ohp: 2.5, deadlift: 5 };

// ============================ StrongLifts 5x5 ============================
const STRONGLIFTS = {
  id: 'stronglifts',
  label: 'StrongLifts 5x5',
  desc: '모든 세트를 5회씩 완료하면 다음 세션부터 자동 증량됩니다.',
  anchorLabel: '작업 무게',
  progression: 'stronglifts',
  sessions: [
    {
      id: 'A',
      label: 'Workout A',
      exercises: [
        { liftId: 'squat', sets: flat(5, 1, 5), prog: 'standard' },
        { liftId: 'bench', sets: flat(5, 1, 5), prog: 'standard' },
        { liftId: 'row', sets: flat(5, 1, 5), prog: 'standard' },
      ],
    },
    {
      id: 'B',
      label: 'Workout B',
      exercises: [
        { liftId: 'squat', sets: flat(5, 1, 5), prog: 'standard' },
        { liftId: 'ohp', sets: flat(5, 1, 5), prog: 'standard' },
        { liftId: 'deadlift', sets: flat(1, 1, 5), prog: 'standard' },
      ],
    },
  ],
};

// ============================== Madcow 5x5 ==============================
// 월: 볼륨(5x5 램핑) · 수: 회복(라이트) · 금: 강도(램핑 + PR 세트 + 백오프)
// 증량은 주간 단위 — OHP·데드는 수요일, 스쿼트·벤치·로우는 금요일 PR 세트로 판정.
const MADCOW = {
  id: 'madcow',
  label: 'Madcow 5x5',
  desc: 'OHP·데드리프트는 수요일, 스쿼트·벤치·로우는 금요일 PR 세트 성공 시 다음 주 무게가 오릅니다.',
  anchorLabel: '탑 세트 무게',
  progression: 'madcow',
  sessions: [
    {
      id: 'mon',
      label: '볼륨',
      exercises: [
        { liftId: 'squat', sets: ramp([0.5, 0.625, 0.75, 0.875, 1.0], 5), prog: 'none' },
        { liftId: 'bench', sets: ramp([0.5, 0.625, 0.75, 0.875, 1.0], 5), prog: 'none' },
        { liftId: 'row', sets: ramp([0.5, 0.625, 0.75, 0.875, 1.0], 5), prog: 'none' },
      ],
    },
    {
      id: 'wed',
      label: '회복',
      exercises: [
        { liftId: 'squat', sets: ramp([0.5, 0.6, 0.7, 0.75], 5), prog: 'none' },
        { liftId: 'ohp', sets: ramp([0.5, 0.625, 0.75, 0.875, 1.0], 5), prog: 'standard' },
        { liftId: 'deadlift', sets: ramp([0.55, 0.7, 0.85, 1.0], 5), prog: 'standard' },
      ],
    },
    {
      id: 'fri',
      label: '강도',
      exercises: [
        {
          liftId: 'squat',
          sets: [...ramp([0.5, 0.625, 0.75, 0.875], 5), set(1.05, 3, 'top'), set(0.75, 8)],
          prog: 'standard',
        },
        {
          liftId: 'bench',
          sets: [...ramp([0.5, 0.625, 0.75, 0.875], 5), set(1.05, 3, 'top'), set(0.75, 8)],
          prog: 'standard',
        },
        {
          liftId: 'row',
          sets: [...ramp([0.5, 0.625, 0.75, 0.875], 5), set(1.05, 3, 'top'), set(0.75, 8)],
          prog: 'standard',
        },
      ],
    },
  ],
};

// ============================ nSuns 5/3/1 LP ============================
// T1(주 운동) 9세트 — 3세트째(95% x 1+)가 AMRAP, 이 횟수로 TM 증감 결정.
const NSUNS_T1 = [
  set(0.75, 5),
  set(0.85, 3),
  set(0.95, 1, 'amrap'),
  set(0.9, 3),
  set(0.85, 3),
  set(0.8, 3),
  set(0.75, 5),
  set(0.7, 5),
  set(0.65, 5, 'plus'),
];
// T2(보조 운동) 8세트 — 증량에는 관여하지 않음.
const NSUNS_T2 = [
  set(0.5, 5),
  set(0.6, 5),
  set(0.7, 3),
  set(0.75, 5),
  set(0.8, 5),
  set(0.75, 6),
  set(0.7, 7),
  set(0.65, 8, 'plus'),
];

const nDay = (id, label, t1, t2) => ({
  id,
  label,
  exercises: [
    { liftId: t1, sets: NSUNS_T1, prog: 'amrap', role: 'T1' },
    { liftId: t2, sets: NSUNS_T2, prog: 'none', role: 'T2' },
  ],
});

const NSUNS = {
  id: 'nsuns',
  label: 'nSuns 5/3/1 LP',
  desc: '주 운동(T1)의 95% AMRAP 세트(3세트째) 횟수에 따라 다음 TM이 자동 조정됩니다.',
  anchorLabel: 'TM (1RM x 90%)',
  progression: 'nsuns',
  defaultVariant: '5day',
  variants: {
    // 운동 종목이 4개뿐이라 변형별로 Day 구성을 각각 별도로 정의한다.
    '4day': [
      nDay('d1', 'Day 1 · 벤치', 'bench', 'ohp'),
      nDay('d2', 'Day 2 · 스쿼트', 'squat', 'deadlift'),
      nDay('d3', 'Day 3 · OHP', 'ohp', 'bench'),
      nDay('d4', 'Day 4 · 데드리프트', 'deadlift', 'squat'),
    ],
    '5day': [
      nDay('d1', 'Day 1 · 벤치', 'bench', 'ohp'),
      nDay('d2', 'Day 2 · 스쿼트', 'squat', 'deadlift'),
      nDay('d3', 'Day 3 · OHP', 'ohp', 'bench'),
      nDay('d4', 'Day 4 · 데드리프트', 'deadlift', 'squat'),
      nDay('d5', 'Day 5 · 벤치 (보조 스쿼트)', 'bench', 'squat'),
    ],
    '6day': [
      nDay('d1', 'Day 1 · 벤치', 'bench', 'ohp'),
      nDay('d2', 'Day 2 · 스쿼트', 'squat', 'deadlift'),
      nDay('d3', 'Day 3 · OHP', 'ohp', 'bench'),
      nDay('d4', 'Day 4 · 데드리프트', 'deadlift', 'squat'),
      nDay('d5', 'Day 5 · 벤치 (보조 스쿼트)', 'bench', 'squat'),
      nDay('d6', 'Day 6 · 스쿼트 (보조 OHP)', 'squat', 'ohp'),
    ],
  },
};

// =========================== Starting Strength ===========================
// A/B 교대 3x5 — StrongLifts 와 동일한 세션별 선형 증량.
const STARTING_STRENGTH = {
  id: 'starting_strength',
  label: 'Starting Strength',
  desc: '모든 세트를 5회씩 완료하면 다음 세션부터 자동 증량됩니다.',
  anchorLabel: '작업 무게',
  progression: 'stronglifts',
  sessions: [
    {
      id: 'A',
      label: 'Workout A',
      exercises: [
        { liftId: 'squat', sets: flat(3, 1, 5), prog: 'standard' },
        { liftId: 'bench', sets: flat(3, 1, 5), prog: 'standard' },
        { liftId: 'deadlift', sets: flat(1, 1, 5), prog: 'standard' },
      ],
    },
    {
      id: 'B',
      label: 'Workout B',
      exercises: [
        { liftId: 'squat', sets: flat(3, 1, 5), prog: 'standard' },
        { liftId: 'ohp', sets: flat(3, 1, 5), prog: 'standard' },
        { liftId: 'deadlift', sets: flat(1, 1, 5), prog: 'standard' },
      ],
    },
  ],
};

// ============================== Greyskull LP ==============================
// A/B 교대 — 각 운동 2x5 + 1x5+(마지막 세트 AMRAP).
// 마지막 세트 5회 이상 정상 증량 / 10회 이상 2배 증량 / 5회 미만 디로드.
const gslpLift = (liftId, setCount) => ({
  liftId,
  prog: 'greyskull',
  sets:
    setCount <= 1
      ? [set(1, 5, 'amrap')]
      : [...flat(setCount - 1, 1, 5), set(1, 5, 'amrap')],
});

const GREYSKULL = {
  id: 'greyskull_lp',
  label: 'Greyskull LP',
  desc: '마지막 세트(AMRAP)에서 5회 이상이면 증량, 10회 이상이면 2배 증량, 5회 미만이면 디로드합니다.',
  anchorLabel: '작업 무게',
  progression: 'greyskull',
  sessions: [
    {
      id: 'A',
      label: 'Workout A',
      exercises: [gslpLift('ohp', 3), gslpLift('squat', 3)],
    },
    {
      id: 'B',
      label: 'Workout B',
      exercises: [gslpLift('bench', 3), gslpLift('deadlift', 1)],
    },
  ],
};

// ================================= GZCLP =================================
// T1/T2/T3 3단 구조 · 4일 로테이션. T1/T2 는 단계(stage) 시스템.
//   T1 : 5x3 → 6x2 → 10x1 (마지막 단계 실패 시 무게 리셋)
//   T2 : 3x10 → 3x8 → 3x6 (마지막 단계 후 무게 올리고 3x10 리셋)
//   T3 : 3x15+ (마지막 세트 25회 이상이면 증량)
const GZCLP_STAGES = {
  T1: [
    { count: 5, reps: 3 },
    { count: 6, reps: 2 },
    { count: 10, reps: 1 },
  ],
  T2: [
    { count: 3, reps: 10 },
    { count: 3, reps: 8 },
    { count: 3, reps: 6 },
  ],
  T3: [{ count: 3, reps: 15 }],
};

// 티어 + 단계 → 구체 세트 배열 (T1·T3 는 마지막 세트가 AMRAP)
function gzclpSets(tier, stageIndex) {
  const stages = GZCLP_STAGES[tier] || GZCLP_STAGES.T3;
  const st = stages[Math.min(Math.max(stageIndex || 0, 0), stages.length - 1)];
  const amrapLast = tier === 'T1' || tier === 'T3';
  return Array.from({ length: st.count }, (_, i) =>
    set(1, st.reps, amrapLast && i === st.count - 1 ? 'amrap' : 'normal'),
  );
}

const gzEx = (liftId, tier) => ({ liftId, tier, prog: 'gzclp' });

const GZCLP = {
  id: 'gzclp',
  label: 'GZCLP',
  desc: 'T1·T2·T3 3단 구조 — 단계를 완수하면 증량, 실패하면 다음 단계(반복수 감소)로 내려갑니다.',
  anchorLabel: '작업 무게',
  progression: 'gzclp',
  sessions: [
    {
      id: 'A1',
      label: 'Workout A1',
      exercises: [gzEx('squat', 'T1'), gzEx('bench', 'T2'), gzEx('row', 'T3')],
    },
    {
      id: 'B1',
      label: 'Workout B1',
      exercises: [gzEx('ohp', 'T1'), gzEx('deadlift', 'T2'), gzEx('row', 'T3')],
    },
    {
      id: 'A2',
      label: 'Workout A2',
      exercises: [gzEx('bench', 'T1'), gzEx('squat', 'T2'), gzEx('row', 'T3')],
    },
    {
      id: 'B2',
      label: 'Workout B2',
      exercises: [gzEx('deadlift', 'T1'), gzEx('ohp', 'T2'), gzEx('row', 'T3')],
    },
  ],
};

// ============================= Wendler 5/3/1 =============================
// 4주 사이클 × 4개 주 운동(OHP·데드·벤치·스쿼트) = 16세션.
//   1주: 5/5/5+  2주: 3/3/3+  3주: 5/3/1+  4주: 디로드
// TM(1RM x 90%) 의 % 로 무게 산출. 3주차 마지막 AMRAP 세트로 TM 증감.
const WENDLER_ORDER = ['ohp', 'deadlift', 'bench', 'squat'];
const WENDLER_WEEKS = [
  { wk: 1, build: () => [set(0.65, 5), set(0.75, 5), set(0.85, 5, 'amrap')], prog: 'none' },
  { wk: 2, build: () => [set(0.7, 3), set(0.8, 3), set(0.9, 3, 'amrap')], prog: 'none' },
  { wk: 3, build: () => [set(0.75, 5), set(0.85, 3), set(0.95, 1, 'amrap')], prog: 'wendler' },
  { wk: 4, build: () => [set(0.4, 5), set(0.5, 5), set(0.6, 5)], prog: 'none' },
];

const WENDLER_SESSIONS = [];
WENDLER_WEEKS.forEach((w) => {
  WENDLER_ORDER.forEach((lift) => {
    WENDLER_SESSIONS.push({
      id: `w${w.wk}-${lift}`,
      label: `${w.wk < 4 ? `${w.wk}주차` : '디로드'} · ${LIFT_NAMES_KO[lift]}`,
      exercises: [{ liftId: lift, sets: w.build(), prog: w.prog }],
    });
  });
});

const WENDLER = {
  id: 'wendler_531',
  label: 'Wendler 5/3/1',
  desc: '4주 사이클(5/5/5+ → 3/3/3+ → 5/3/1+ → 디로드). 3주차 마지막 세트 성공 시 TM이 오릅니다.',
  anchorLabel: 'TM (1RM x 90%)',
  progression: 'wendler',
  sessions: WENDLER_SESSIONS,
};

// ============================== Texas Method ==============================
// 월(볼륨 5x5)·수(회복 라이트)·금(강도 1x5 PR) 3분할 · 주간 증량.
// anchor = 금요일 인텐시티 5RM. 볼륨일 90%, 회복일 80%, 강도일 100%.
const TEXAS = {
  id: 'texas_method',
  label: 'Texas Method',
  desc: '월(볼륨)·수(회복)·금(강도) 3분할. 금요일 PR 세트 성공 시 다음 주 무게가 오릅니다.',
  anchorLabel: '인텐시티 5RM',
  progression: 'texas',
  sessions: [
    {
      id: 'mon',
      label: '볼륨',
      exercises: [
        { liftId: 'squat', sets: flat(5, 0.9, 5), prog: 'none' },
        { liftId: 'bench', sets: flat(5, 0.9, 5), prog: 'none' },
        { liftId: 'deadlift', sets: flat(1, 0.9, 5), prog: 'none' },
      ],
    },
    {
      id: 'wed',
      label: '회복',
      exercises: [
        { liftId: 'squat', sets: flat(2, 0.8, 5), prog: 'none' },
        { liftId: 'ohp', sets: flat(3, 1.0, 5), prog: 'standard' },
        { liftId: 'row', sets: flat(3, 1.0, 5), prog: 'standard' },
      ],
    },
    {
      id: 'fri',
      label: '강도',
      exercises: [
        { liftId: 'squat', sets: [set(1.0, 5, 'top')], prog: 'standard' },
        { liftId: 'bench', sets: [set(1.0, 5, 'top')], prog: 'standard' },
        { liftId: 'deadlift', sets: [set(1.0, 5, 'top')], prog: 'standard' },
      ],
    },
  ],
};

// =========================== Push / Pull / Legs ===========================
// 3분할 하이퍼트로피. 마지막 세트(AMRAP)에서 목표+4회 이상이면 증량(이중 점진).
const pplEx = (liftId, count, reps) => ({
  liftId,
  prog: 'ppl',
  sets: [...flat(count - 1, 1, reps), set(1, reps, 'amrap')],
});

const PPL = {
  id: 'ppl',
  label: 'Push / Pull / Legs',
  desc: '푸시·풀·레그 3분할. 마지막 세트에서 목표+4회 이상이면 다음 세션부터 증량합니다.',
  anchorLabel: '작업 무게',
  progression: 'ppl',
  sessions: [
    {
      id: 'push',
      label: 'Push · 미는 날',
      exercises: [pplEx('bench', 4, 8), pplEx('ohp', 3, 10)],
    },
    {
      id: 'pull',
      label: 'Pull · 당기는 날',
      exercises: [pplEx('deadlift', 3, 8), pplEx('row', 4, 10)],
    },
    {
      id: 'legs',
      label: 'Legs · 다리 날',
      exercises: [pplEx('squat', 5, 8)],
    },
  ],
};

// ================================== PHUL ==================================
// 상/하체 × 파워/하이퍼트로피 4분할. 파워·하이퍼는 무게가 달라 mode 별로 키잉.
// 모든 세트를 목표 횟수만큼 완수하면 다음 세션부터 증량.
const phulEx = (liftId, mode, count, reps) => ({
  liftId,
  mode,
  prog: 'standard',
  sets: flat(count, 1, reps),
});

const PHUL = {
  id: 'phul',
  label: 'PHUL',
  desc: '상·하체 × 파워/하이퍼트로피 4분할. 모든 세트를 완료하면 다음 세션부터 증량합니다.',
  anchorLabel: '작업 무게',
  progression: 'phul',
  sessions: [
    {
      id: 'up',
      label: '상체 · 파워',
      exercises: [
        phulEx('bench', 'P', 4, 5),
        phulEx('row', 'P', 4, 5),
        phulEx('ohp', 'P', 3, 6),
      ],
    },
    {
      id: 'lp',
      label: '하체 · 파워',
      exercises: [phulEx('squat', 'P', 4, 5), phulEx('deadlift', 'P', 3, 5)],
    },
    {
      id: 'uh',
      label: '상체 · 하이퍼트로피',
      exercises: [
        phulEx('bench', 'H', 4, 10),
        phulEx('row', 'H', 4, 10),
        phulEx('ohp', 'H', 3, 12),
      ],
    },
    {
      id: 'lh',
      label: '하체 · 하이퍼트로피',
      exercises: [phulEx('squat', 'H', 4, 10), phulEx('deadlift', 'H', 3, 10)],
    },
  ],
};

export const PROGRAMS = {
  stronglifts: STRONGLIFTS,
  madcow: MADCOW,
  nsuns: NSUNS,
  starting_strength: STARTING_STRENGTH,
  greyskull_lp: GREYSKULL,
  gzclp: GZCLP,
  wendler_531: WENDLER,
  texas_method: TEXAS,
  ppl: PPL,
  phul: PHUL,
};

// programState 로부터 (변형이 반영된) 프로그램 정의를 얻는다.
export function getProgram(programState) {
  if (!programState) return null;
  const def = PROGRAMS[programState.selectedId];
  if (!def) return null;
  if (def.variants) {
    const v =
      programState.programVariant && def.variants[programState.programVariant]
        ? programState.programVariant
        : def.defaultVariant;
    const { variants, ...rest } = def;
    return { ...rest, sessions: variants[v], variant: v, variantLabel: VARIANT_LABELS[v] || v };
  }
  return def;
}

// 마지막으로 완료한 세션 id 다음 세션을 반환 (없으면 첫 세션).
export function resolveSession(program, lastCompletedId) {
  const { sessions } = program;
  if (!lastCompletedId) return sessions[0];
  const idx = sessions.findIndex((x) => x.id === lastCompletedId);
  return sessions[idx < 0 ? 0 : (idx + 1) % sessions.length];
}

// 세션의 운동들을 (GZCLP 단계, PHUL 모드 등을 반영한) 구체 세트로 변환한다.
// 반환 운동: { liftId, prog, role, anchorKey, sets, tier?, stage? }
export function resolveExercises(session, programState) {
  const stages = (programState && programState.stages) || {};
  return session.exercises.map((ex) => {
    if (ex.prog === 'gzclp') {
      const anchorKey = `${ex.liftId}-${ex.tier}`;
      const stage = stages[anchorKey] || 0;
      return {
        liftId: ex.liftId,
        prog: 'gzclp',
        tier: ex.tier,
        role: ex.tier,
        stage,
        anchorKey,
        sets: gzclpSets(ex.tier, stage),
      };
    }
    if (ex.mode) {
      // PHUL — 파워/하이퍼트로피 별로 무게가 다르므로 복합 anchorKey
      return {
        liftId: ex.liftId,
        prog: ex.prog,
        role: ex.mode,
        anchorKey: `${ex.liftId}-${ex.mode}`,
        sets: ex.sets,
      };
    }
    return {
      liftId: ex.liftId,
      prog: ex.prog,
      role: ex.role || null,
      anchorKey: ex.liftId,
      sets: ex.sets,
    };
  });
}

// nSuns: T1 의 95% AMRAP 세트 횟수 → TM 증감(kg)
function nsunsDelta(liftId, reps) {
  const lower = liftId === 'squat' || liftId === 'deadlift';
  if (reps <= 0) return -5;
  if (reps === 1) return 0;
  if (reps <= 3) return lower ? 5 : 2.5;
  if (reps <= 5) return lower ? 7.5 : 5;
  return lower ? 10 : 7.5;
}

// 한 운동의 세션 결과로 다음 기준 무게/단계를 계산.
// exercise: resolveExercises 가 반환한 구체 운동
// setStates: exercise.sets 와 같은 길이의 [{ reps, completed }]
// 반환: { nextAnchor, nextFails, nextStage, outcome }
//        outcome: 'success' | 'hold' | 'deload'
export function computeProgression(program, exercise, anchor, fails, setStates) {
  const a = anchor || BARBELL_WEIGHT_KG;

  // 증량에 관여하지 않는 운동 (Madcow·Texas 볼륨/회복, nSuns T2, Wendler 1·2·4주)
  if (exercise.prog === 'none') {
    return { nextAnchor: a, nextFails: fails || 0, nextStage: 0, outcome: 'hold' };
  }

  // nSuns T1 — AMRAP 세트 횟수 기반 TM 조정
  if (exercise.prog === 'amrap') {
    const idx = exercise.sets.findIndex((x) => x.kind === 'amrap');
    const st = setStates[idx];
    if (!st || !st.completed) {
      return { nextAnchor: a, nextFails: 0, nextStage: 0, outcome: 'hold' };
    }
    const delta = nsunsDelta(exercise.liftId, st.reps || 0);
    return {
      nextAnchor: Math.max(BARBELL_WEIGHT_KG, roundToPlate(a + delta)),
      nextFails: 0,
      nextStage: 0,
      outcome: delta > 0 ? 'success' : delta < 0 ? 'deload' : 'hold',
    };
  }

  // Greyskull LP — 마지막 AMRAP 세트 횟수로 증량/디로드
  if (exercise.prog === 'greyskull') {
    const idx = exercise.sets.findIndex((x) => x.kind === 'amrap');
    const st = setStates[idx];
    if (!st || !st.completed) {
      return { nextAnchor: a, nextFails: 0, nextStage: 0, outcome: 'hold' };
    }
    const reps = st.reps || 0;
    const inc = exercise.liftId === 'squat' || exercise.liftId === 'deadlift' ? 5 : 2.5;
    if (reps < 5) {
      return {
        nextAnchor: Math.max(BARBELL_WEIGHT_KG, floorToPlate(a * 0.9)),
        nextFails: 0,
        nextStage: 0,
        outcome: 'deload',
      };
    }
    const gain = reps >= 10 ? inc * 2 : inc;
    return { nextAnchor: roundToPlate(a + gain), nextFails: 0, nextStage: 0, outcome: 'success' };
  }

  // Wendler 5/3/1 — 3주차 마지막 AMRAP 세트로 TM 증감
  if (exercise.prog === 'wendler') {
    const idx = exercise.sets.findIndex((x) => x.kind === 'amrap');
    const st = setStates[idx];
    const inc = exercise.liftId === 'bench' || exercise.liftId === 'ohp' ? 2.5 : 5;
    if (st && st.completed && (st.reps || 0) >= 1) {
      return { nextAnchor: roundToPlate(a + inc), nextFails: 0, nextStage: 0, outcome: 'success' };
    }
    // 최소 횟수도 못 채우면 TM 리셋
    return {
      nextAnchor: Math.max(BARBELL_WEIGHT_KG, floorToPlate(a * 0.9)),
      nextFails: 0,
      nextStage: 0,
      outcome: 'deload',
    };
  }

  // PPL — 이중 점진: 마지막 세트가 목표+4회 이상이면 증량
  if (exercise.prog === 'ppl') {
    const idx = exercise.sets.findIndex((x) => x.kind === 'amrap');
    const st = setStates[idx];
    if (!st || !st.completed) {
      return { nextAnchor: a, nextFails: 0, nextStage: 0, outcome: 'hold' };
    }
    const target = exercise.sets[idx].reps;
    const inc = INCREMENT[exercise.liftId] || PLATE_STEP_KG;
    if ((st.reps || 0) >= target + 4) {
      return { nextAnchor: roundToPlate(a + inc), nextFails: 0, nextStage: 0, outcome: 'success' };
    }
    return { nextAnchor: a, nextFails: 0, nextStage: 0, outcome: 'hold' };
  }

  // GZCLP — 단계 시스템
  if (exercise.prog === 'gzclp') {
    const inc = INCREMENT[exercise.liftId] || PLATE_STEP_KG;
    const stage = exercise.stage || 0;

    // T3: 단계 없음 — 마지막 세트 25회 이상이면 증량
    if (exercise.tier === 'T3') {
      const idx = exercise.sets.findIndex((x) => x.kind === 'amrap');
      const st = setStates[idx];
      const reps = st && st.completed ? st.reps || 0 : 0;
      if (reps >= 25) {
        return { nextAnchor: roundToPlate(a + inc), nextFails: 0, nextStage: 0, outcome: 'success' };
      }
      return { nextAnchor: a, nextFails: 0, nextStage: 0, outcome: 'hold' };
    }

    // T1 / T2: 현재 단계의 모든 세트를 목표 횟수만큼 완수했는지
    const success = exercise.sets.every((spec, i) => {
      const st = setStates[i];
      return st && st.completed && (st.reps || 0) >= spec.reps;
    });
    if (success) {
      return { nextAnchor: roundToPlate(a + inc), nextFails: 0, nextStage: 0, outcome: 'success' };
    }
    const lastStage = (GZCLP_STAGES[exercise.tier]?.length || 1) - 1;
    if (stage < lastStage) {
      // 다음 단계로 하락 (무게 유지)
      return { nextAnchor: a, nextFails: 0, nextStage: stage + 1, outcome: 'hold' };
    }
    // 마지막 단계까지 실패
    if (exercise.tier === 'T1') {
      // 무게 리셋 후 5x3 부터 재시작
      return {
        nextAnchor: Math.max(BARBELL_WEIGHT_KG, roundToPlate(a * 0.9)),
        nextFails: 0,
        nextStage: 0,
        outcome: 'deload',
      };
    }
    // T2 — 무게 올리고 3x10 으로 리셋
    return { nextAnchor: roundToPlate(a + inc), nextFails: 0, nextStage: 0, outcome: 'success' };
  }

  // prog === 'standard' — 모든 세트가 목표 횟수 이상이면 성공
  const success = exercise.sets.every((spec, i) => {
    const st = setStates[i];
    return st && st.completed && (st.reps || 0) >= spec.reps;
  });
  const inc = INCREMENT[exercise.liftId] || PLATE_STEP_KG;

  if (success) {
    return { nextAnchor: roundToPlate(a + inc), nextFails: 0, nextStage: 0, outcome: 'success' };
  }

  // 실패 — StrongLifts/SS 는 3연속 실패 시 10% 디로드, 그 외(Madcow·Texas·PHUL)는 유지
  if (program.progression === 'stronglifts') {
    const f = (fails || 0) + 1;
    if (f >= 3) {
      return {
        nextAnchor: Math.max(BARBELL_WEIGHT_KG, floorToPlate(a * 0.9)),
        nextFails: 0,
        nextStage: 0,
        outcome: 'deload',
      };
    }
    return { nextAnchor: a, nextFails: f, nextStage: 0, outcome: 'hold' };
  }
  return { nextAnchor: a, nextFails: 0, nextStage: 0, outcome: 'hold' };
}
