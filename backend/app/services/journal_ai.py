"""
Journal용 AI 코멘트 생성 서비스.

운동·식단 데이터를 모아 사람이 읽기 좋은 형태로 다듬은 뒤 Gemma 3:4b에게 던지고,
받은 코멘트를 JournalEntry 테이블에 upsert 한다.

`generate_and_save_ai_comment` 가 외부에서 호출되는 단일 진입점이다.
   - 운동 완료 시 FastAPI BackgroundTasks로 큐잉
   - 식단 저장 시 동일
   - Journal 페이지에서 "재생성" 버튼을 누를 때
"""

from datetime import date as date_t, datetime
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.routine_log import RoutineLog
from app.models.diet_log import DietLog
from app.models.journal_entry import JournalEntry


OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3:4b"


# ---------- 데이터 → 사람 읽기 좋은 텍스트 ----------

def _format_workout_block(workout_logs: list[RoutineLog]) -> str:
    """
    그날의 운동 기록(여러 세션 가능)을 한 덩어리 텍스트로 정리.
    세션이 0개면 '휴식일' 표시.
    """
    if not workout_logs:
        return "운동 기록 없음 (휴식일)"

    lines = []
    for log in workout_logs:
        lines.append(f"프로그램: {log.routine_name}")
        for lift in (log.session_data or []):
            # session_data 항목은 ProgramPlayPage 의 LiftEntry 스키마.
            # 신규: sets = [{reps, completed}, ...] 가 포함될 수 있음 (구 로그엔 없음).
            name = lift.get("lift_id", "unknown")
            w = lift.get("weight", 0)
            prev = lift.get("prev_weight", 0)
            outcome = lift.get("outcome", "")
            sets = lift.get("sets") or []

            outcome_mark = (
                "✅ 성공" if outcome == "success"
                else "❌ 실패" if outcome == "fail"
                else ""
            )
            increase_note = ""
            if w and prev and w > prev:
                increase_note = f" (이전 {prev}kg 에서 증량)"

            # 세트 정보 포맷팅 — 균일하면 NxR, 아니면 콤마 나열, 없으면 추정.
            if sets:
                reps_vals = [s.get("reps", 0) for s in sets]
                all_completed = all(s.get("completed", False) for s in sets)
                all_same = all(r == reps_vals[0] for r in reps_vals) if reps_vals else False
                if all_same and all_completed:
                    set_label = f"{len(sets)}×{reps_vals[0]}"
                else:
                    set_label = f"세트 {','.join(str(r) for r in reps_vals)}"
            else:
                set_label = "5세트"

            lines.append(f"- {name}: {w}kg · {set_label} {outcome_mark}{increase_note}")
    return "\n".join(lines)


def _format_diet_block(diet_logs: list[DietLog]) -> str:
    """
    그날의 식단 로그를 총합 영양소 + 끼니 구성으로 정리.
    DietLog의 영양소는 100g당 값이므로 weight/100을 곱해야 실섭취량이다.
    """
    if not diet_logs:
        return "식단 기록 없음"

    total_kcal = sum(d.calories * (d.weight / 100.0) for d in diet_logs)
    total_c = sum(d.carbs * (d.weight / 100.0) for d in diet_logs)
    total_p = sum(d.protein * (d.weight / 100.0) for d in diet_logs)
    total_f = sum(d.fat * (d.weight / 100.0) for d in diet_logs)

    by_meal: dict[str, list[str]] = {}
    for d in diet_logs:
        by_meal.setdefault(d.meal_type or "기타", []).append(d.food_name or "?")
    meal_lines = [
        f"  · {meal}: {', '.join(items)}"
        for meal, items in by_meal.items()
    ]

    return (
        f"총 {total_kcal:.0f} kcal\n"
        f"- 탄수화물: {total_c:.0f} g\n"
        f"- 단백질: {total_p:.0f} g\n"
        f"- 지방: {total_f:.0f} g\n"
        f"끼니 구성:\n" + "\n".join(meal_lines)
    )


def build_journal_prompt(
    user: User,
    workout_logs: list[RoutineLog],
    diet_logs: list[DietLog],
) -> str:
    """5단 프롬프트(역할/사용자/운동/식단/규칙)를 한 문자열로 조립."""
    bmi = None
    if user.height and user.weight:
        try:
            bmi = user.weight / ((user.height / 100) ** 2)
        except ZeroDivisionError:
            bmi = None

    body = f"{user.height}cm / {user.weight}kg"
    if bmi is not None:
        body += f" (BMI {bmi:.1f})"

    return (
        "당신은 헬스 코치입니다. 사용자가 오늘 한 운동·식단 기록을 보고 "
        "짧고 따뜻한 회고 코멘트를 한국어로 작성하세요.\n"
        "\n"
        "[사용자 정보]\n"
        f"- 목표: {user.goal or '미설정'}\n"
        f"- 신체: {body}\n"
        f"- 경력: {user.workout_experience or '미설정'}\n"
        "\n"
        "[오늘의 운동]\n"
        f"{_format_workout_block(workout_logs)}\n"
        "\n"
        "[오늘의 식단]\n"
        f"{_format_diet_block(diet_logs)}\n"
        "\n"
        "[작성 규칙]\n"
        "- 2~3문장, 100자 이내\n"
        "- 가장 눈에 띄는 한 가지를 콕 짚어 칭찬\n"
        "- 다음 운동에 적용할 짧은 팁 하나\n"
        "- 마크다운, 리스트, 이모지, 따옴표 사용 금지\n"
        "- 의학 진단이나 약 추천 금지\n"
        "- 자연스러운 한국어 어미(~해요, ~예요) 사용\n"
        "\n"
        "코멘트:"
    )


# ---------- Gemma 호출 ----------

def _call_gemma(prompt: str) -> Optional[str]:
    """Ollama 로컬 서버에 동기 호출. 실패 시 None 반환 (백그라운드에선 조용히 실패)."""
    try:
        response = httpx.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 200,
                    "stop": ["\n\n"],
                },
            },
            timeout=60.0,
        )
        response.raise_for_status()
        raw = (response.json().get("response") or "").strip()
        # Gemma가 가끔 끼워 넣는 잔재 제거
        return raw.replace("**", "").replace("*", "").strip(' "\'') or None
    except Exception as exc:
        print(f"[journal_ai] Gemma 호출 실패: {exc}")
        return None


# ---------- 그날 데이터 조회 + upsert ----------

def _fetch_day_data(
    db: Session, user_id: int, target_date: date_t,
) -> tuple[Optional[User], list[RoutineLog], list[DietLog]]:
    user = db.query(User).filter(User.id == user_id).first()

    workouts = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == user_id,
            RoutineLog.workout_date >= datetime.combine(target_date, datetime.min.time()),
            RoutineLog.workout_date < datetime.combine(target_date, datetime.max.time()),
        )
        .all()
    )
    diets = (
        db.query(DietLog)
        .filter(DietLog.user_id == user_id, DietLog.date == target_date)
        .all()
    )
    return user, workouts, diets


def _upsert_journal_entry(
    db: Session, user_id: int, target_date: date_t, ai_comment: Optional[str],
) -> JournalEntry:
    entry = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.user_id == user_id,
            JournalEntry.entry_date == target_date,
        )
        .first()
    )
    if entry is None:
        entry = JournalEntry(user_id=user_id, entry_date=target_date)
        db.add(entry)
    if ai_comment:
        entry.ai_comment = ai_comment
        entry.ai_generated_at = datetime.now()
    db.commit()
    db.refresh(entry)
    return entry


# ---------- 외부 진입점 ----------

def generate_and_save_ai_comment(user_id: int, target_date: date_t) -> Optional[str]:
    """
    백그라운드/수동 양쪽에서 부르는 단일 진입점.

    1. 그날의 운동·식단을 조회
    2. 데이터가 둘 다 비어있으면 아무 것도 안 함 (휴식 + 무기록 = 코멘트 의미 없음)
    3. 프롬프트 만들어 Gemma 호출
    4. 받은 결과를 JournalEntry 에 upsert
    5. 실패해도 예외 던지지 않음 — 다음 트리거에서 재시도
    """
    db = SessionLocal()
    try:
        user, workouts, diets = _fetch_day_data(db, user_id, target_date)
        if user is None:
            return None
        if not workouts and not diets:
            return None

        prompt = build_journal_prompt(user, workouts, diets)
        comment = _call_gemma(prompt)
        if comment is None:
            return None

        _upsert_journal_entry(db, user_id, target_date, comment)
        return comment
    finally:
        db.close()
