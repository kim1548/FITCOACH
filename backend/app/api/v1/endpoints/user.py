"""
사용자 프로필 + 영양 목표 조회 엔드포인트.

프론트가 매번 두 번 호출하는 대신, /me 한 번이면 프로필과 계산된 목표를 같이
얻을 수 있게 합쳤다. 영양 목표 계산이 불가능하면 nutrition: null.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
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
