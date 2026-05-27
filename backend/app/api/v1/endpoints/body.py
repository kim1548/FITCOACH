"""
InBody(체성분) 측정 기록 CRUD 엔드포인트.

리스트는 측정일 최신순, 같은 날짜에 여러 측정이 있어도 둘 다 보관 (수정 의도가
있으면 사용자가 직접 삭제 후 재입력하도록 단순화).
"""

from datetime import date as date_t
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.inbody_log import InBodyLog
from app.api.v1.endpoints.auth import get_current_user
from app.services.inbody_ai import generate_and_save_body_comment

router = APIRouter()


class InBodyCreate(BaseModel):
    measured_at: str  # YYYY-MM-DD
    weight: float
    skeletal_muscle: Optional[float] = None
    body_fat_mass: Optional[float] = None
    body_fat_percent: Optional[float] = None
    bmr: Optional[float] = None


def _serialize(log: InBodyLog) -> dict:
    return {
        "id": log.id,
        "measured_at": log.measured_at.isoformat() if log.measured_at else None,
        "weight": log.weight,
        "skeletal_muscle": log.skeletal_muscle,
        "body_fat_mass": log.body_fat_mass,
        "body_fat_percent": log.body_fat_percent,
        "bmr": log.bmr,
        "ai_comment": log.ai_comment,
        "ai_generated_at": log.ai_generated_at.isoformat() if log.ai_generated_at else None,
    }


def _parse_date(value: str) -> date_t:
    try:
        return date_t.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="measured_at은 YYYY-MM-DD 형식이어야 합니다.")


@router.get("")
def list_inbody(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """로그인 유저의 모든 측정 기록을 최신순으로."""
    logs = (
        db.query(InBodyLog)
        .filter(InBodyLog.user_id == current_user.id)
        .order_by(InBodyLog.measured_at.desc(), InBodyLog.created_at.desc())
        .all()
    )
    return [_serialize(l) for l in logs]


@router.post("")
def create_inbody(
    data: InBodyCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = _parse_date(data.measured_at)
    new_log = InBodyLog(
        user_id=current_user.id,
        measured_at=target_date,
        weight=data.weight,
        skeletal_muscle=data.skeletal_muscle,
        body_fat_mass=data.body_fat_mass,
        body_fat_percent=data.body_fat_percent,
        bmr=data.bmr,
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    # 직전 측정 대비 변화(또는 첫 측정 베이스라인) 코멘트를 Gemma 에 비동기로 요청.
    # Ollama 미설치/장애여도 본 응답은 정상 반환된다.
    background_tasks.add_task(generate_and_save_body_comment, new_log.id)
    return _serialize(new_log)


@router.post("/{log_id}/regenerate")
def regenerate_body_comment(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """백그라운드 생성이 실패했을 때 사용자가 직접 누르는 폴백 — 동기 호출."""
    log = db.query(InBodyLog).filter(
        InBodyLog.id == log_id,
        InBodyLog.user_id == current_user.id,
    ).first()
    if log is None:
        raise HTTPException(status_code=404, detail="해당 측정 기록을 찾을 수 없습니다.")
    comment = generate_and_save_body_comment(log.id)
    if comment is None:
        raise HTTPException(
            status_code=503,
            detail="AI 코멘트 생성에 실패했습니다. (Ollama 서버가 응답하지 않습니다.)",
        )
    db.refresh(log)
    return _serialize(log)


@router.delete("/{log_id}")
def delete_inbody(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(InBodyLog).filter(
        InBodyLog.id == log_id,
        InBodyLog.user_id == current_user.id,
    ).first()
    if log is None:
        raise HTTPException(status_code=404, detail="해당 측정 기록을 찾을 수 없습니다.")
    db.delete(log)
    db.commit()
    return {"status": "success"}
