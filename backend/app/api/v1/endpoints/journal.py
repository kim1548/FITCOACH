"""
Journal(저널) 페이지용 API.

캘린더 화면에 가벼운 인디케이터 한 묶음, 날짜 클릭 시 그날의 운동+식단+AI+한줄 상세,
한 줄 저장, AI 수동 재생성까지 네 가지 엔드포인트를 제공한다.

AI 코멘트는 보통 데이터 저장 시점에 백그라운드로 미리 만들어져 있다(routine.py / diet.py).
여기 `/regenerate` 는 그게 실패했을 때 사용자가 직접 다시 돌릴 수 있게 한 폴백.
"""

from datetime import date as date_t, datetime
from calendar import monthrange
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.routine_log import RoutineLog
from app.models.diet_log import DietLog
from app.models.journal_entry import JournalEntry
from app.api.v1.endpoints.auth import get_current_user
from app.services.journal_ai import generate_and_save_ai_comment

router = APIRouter()


# ---------- 1) GET /calendar — 그 달의 인디케이터 ----------

@router.get("/calendar")
def get_calendar(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="month는 1~12 사이여야 합니다.")

    first_day = date_t(year, month, 1)
    last_day = date_t(year, month, monthrange(year, month)[1])
    period_start_dt = datetime.combine(first_day, datetime.min.time())
    period_end_dt = datetime.combine(last_day, datetime.max.time())

    workout_dates = {
        row.workout_date.date()
        for row in db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == current_user.id,
            RoutineLog.workout_date >= period_start_dt,
            RoutineLog.workout_date <= period_end_dt,
        )
        .all()
    }
    diet_dates = {
        row.date
        for row in db.query(DietLog)
        .filter(
            DietLog.user_id == current_user.id,
            DietLog.date >= first_day,
            DietLog.date <= last_day,
        )
        .all()
    }
    entries = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.user_id == current_user.id,
            JournalEntry.entry_date >= first_day,
            JournalEntry.entry_date <= last_day,
        )
        .all()
    )
    ai_dates = {e.entry_date for e in entries if e.ai_comment}
    note_dates = {e.entry_date for e in entries if e.user_note}

    days = []
    for day_num in range(1, last_day.day + 1):
        d = date_t(year, month, day_num)
        days.append({
            "date": d.isoformat(),
            "has_workout": d in workout_dates,
            "has_meal": d in diet_dates,
            "has_ai": d in ai_dates,
            "has_note": d in note_dates,
        })

    return {"year": year, "month": month, "days": days}


# ---------- 2) GET /{date} — 그날의 상세 ----------

def _parse_iso_date(value: str) -> date_t:
    try:
        return date_t.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="date는 YYYY-MM-DD 형식이어야 합니다.")


@router.get("/{date}")
def get_journal_day(
    date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = _parse_iso_date(date)

    workouts = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == current_user.id,
            RoutineLog.workout_date >= datetime.combine(target_date, datetime.min.time()),
            RoutineLog.workout_date <= datetime.combine(target_date, datetime.max.time()),
        )
        .order_by(RoutineLog.workout_date.asc())
        .all()
    )
    diets = (
        db.query(DietLog)
        .filter(DietLog.user_id == current_user.id, DietLog.date == target_date)
        .all()
    )
    entry = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.user_id == current_user.id,
            JournalEntry.entry_date == target_date,
        )
        .first()
    )

    # 운동 응답 정리
    workout_payload = None
    if workouts:
        sessions = []
        for w in workouts:
            sessions.append({
                "id": w.id,
                "routine_name": w.routine_name,
                "workout_at": w.workout_date.isoformat() if w.workout_date else None,
                "lifts": w.session_data or [],
            })
        workout_payload = {"sessions": sessions}

    # 식단 응답 정리: 끼니별 + 총합
    diet_payload = None
    if diets:
        by_meal: dict[str, list[dict]] = {}
        total_kcal = total_c = total_p = total_f = 0.0
        for d in diets:
            actual_factor = (d.weight or 100) / 100.0
            kcal = (d.calories or 0) * actual_factor
            c = (d.carbs or 0) * actual_factor
            p = (d.protein or 0) * actual_factor
            f = (d.fat or 0) * actual_factor
            total_kcal += kcal
            total_c += c
            total_p += p
            total_f += f
            by_meal.setdefault(d.meal_type or "기타", []).append({
                "food_name": d.food_name,
                "weight": d.weight,
                "calories": round(kcal, 1),
                "carbs": round(c, 1),
                "protein": round(p, 1),
                "fat": round(f, 1),
            })
        diet_payload = {
            "total": {
                "kcal": round(total_kcal, 1),
                "carbs": round(total_c, 1),
                "protein": round(total_p, 1),
                "fat": round(total_f, 1),
            },
            "by_meal": by_meal,
        }

    return {
        "date": target_date.isoformat(),
        "workout": workout_payload,
        "diet": diet_payload,
        "ai_comment": entry.ai_comment if entry else None,
        "ai_generated_at": entry.ai_generated_at.isoformat() if entry and entry.ai_generated_at else None,
        "user_note": entry.user_note if entry else None,
    }


# ---------- 3) PUT /{date}/note — 사용자 한 줄 저장 ----------

class NoteUpdate(BaseModel):
    note: str


@router.put("/{date}/note")
def update_note(
    date: str,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = _parse_iso_date(date)

    entry = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.user_id == current_user.id,
            JournalEntry.entry_date == target_date,
        )
        .first()
    )
    if entry is None:
        entry = JournalEntry(user_id=current_user.id, entry_date=target_date)
        db.add(entry)
    entry.user_note = payload.note.strip() or None
    db.commit()
    db.refresh(entry)
    return {"status": "success", "user_note": entry.user_note}


# ---------- 4) POST /{date}/regenerate — AI 수동 재생성 ----------

@router.post("/{date}/regenerate")
def regenerate_ai_comment(
    date: str,
    current_user: User = Depends(get_current_user),
):
    """
    백그라운드 생성이 실패했을 때 사용자가 직접 누르는 폴백.
    동기 호출 — Gemma 응답을 기다린 뒤 결과를 그대로 돌려준다 (수 초 소요).
    """
    target_date = _parse_iso_date(date)
    comment = generate_and_save_ai_comment(current_user.id, target_date)
    if comment is None:
        raise HTTPException(
            status_code=503,
            detail="AI 코멘트 생성에 실패했습니다. (운동·식단 데이터가 없거나 Ollama 서버가 응답하지 않습니다.)",
        )
    return {"ai_comment": comment, "ai_generated_at": datetime.now().isoformat()}
