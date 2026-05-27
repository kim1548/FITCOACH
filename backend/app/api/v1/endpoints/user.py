"""
사용자 프로필 + 영양 목표 조회 / 회원 탈퇴 엔드포인트.

프론트가 매번 두 번 호출하는 대신, /me 한 번이면 프로필과 계산된 목표를 같이
얻을 수 있게 합쳤다. 영양 목표 계산이 불가능하면 nutrition: null.

DELETE /me 는 회원 탈퇴 — 자신과 관련된 모든 로그를 함께 삭제한다.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.routine_log import RoutineLog, UserRoutineStats
from app.models.diet_log import DietLog
from app.models.journal_entry import JournalEntry
from app.api.v1.endpoints.auth import get_current_user
from app.services.nutrition import calc_nutrition_targets

router = APIRouter()


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    nutrition = calc_nutrition_targets(current_user)
    return {
        "username": current_user.username,
        "gender": current_user.gender,
        "age": current_user.age,
        "height": current_user.height,
        "weight": current_user.weight,
        "lifestyle": current_user.lifestyle,
        "workout_experience": current_user.workout_experience,
        "workout_frequency": current_user.workout_frequency,
        "fitness_level": current_user.fitness_level,
        "goal": current_user.goal,
        "nutrition": nutrition,
    }


@router.delete("/me")
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """현재 로그인한 유저와 그에 연결된 모든 기록을 영구 삭제한다.
    한 트랜잭션으로 묶어 일부만 삭제되는 일이 없도록 한다."""
    uid = current_user.id
    try:
        db.query(JournalEntry).filter(JournalEntry.user_id == uid).delete()
        db.query(DietLog).filter(DietLog.user_id == uid).delete()
        db.query(RoutineLog).filter(RoutineLog.user_id == uid).delete()
        db.query(UserRoutineStats).filter(UserRoutineStats.user_id == uid).delete()
        db.query(User).filter(User.id == uid).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"탈퇴 처리 실패: {e}")
    return {"status": "success", "message": "회원 탈퇴가 완료되었습니다."}
