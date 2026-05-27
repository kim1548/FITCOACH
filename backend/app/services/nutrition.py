"""
영양 목표 계산 — Mifflin-St Jeor BMR → TDEE → 목표 칼로리 → 매크로.

입력: User(gender, age, height, weight, workout_frequency, goal)
출력: dict — 모든 값 정수로 라운드된 일일 권장치

User.age 가 비어있거나 신체 정보가 부족하면 None 반환 (호출 측이 안내 처리).
"""

from typing import Optional

from app.models.user import User


# workout_frequency 문자열을 활동계수로 매핑.
# Signup UI 의 enum 과 일대일.
ACTIVITY_FACTOR = {
    "주1회": 1.375,
    "주2회": 1.46,
    "주3회": 1.55,
    "주4회 이상": 1.725,
}

# 목표별 칼로리 가감 (kcal/일).
# 체중감소: 주 0.5kg 감량 페이스 (-500 / 일).
# 벌크업: 천천히 늘리는 보수적 +400.
GOAL_KCAL_DELTA = {
    "체중감소": -500,
    "유지": 0,
    "벌크업": 400,
}

# 목표별 단백질 권장량 (g/kg 체중).
GOAL_PROTEIN_PER_KG = {
    "체중감소": 2.2,
    "유지": 1.6,
    "벌크업": 2.0,
}

# 지방 비율 (총 칼로리의 25%). 호르몬·흡수에 필요한 최소선 확보.
FAT_RATIO = 0.25


def calc_nutrition_targets(user: User) -> Optional[dict]:
    """
    계산이 가능한 모든 사용자 정보가 채워져 있어야 dict 반환.
    하나라도 비어있으면 None — 프론트는 "프로필을 채워주세요" 안내로 분기.
    """
    if not (user.age and user.height and user.weight and user.gender):
        return None

    # 1) BMR — Mifflin-St Jeor
    if user.gender == "남":
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
    else:  # 여 또는 기타
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161

    # 2) TDEE
    factor = ACTIVITY_FACTOR.get(user.workout_frequency, 1.55)
    tdee = bmr * factor

    # 3) 목표 칼로리
    delta = GOAL_KCAL_DELTA.get(user.goal, 0)
    target_kcal = tdee + delta
    # 안전선: 1200kcal 미만으로 떨어지면 1200으로 고정 (의학적 권장 최저선)
    target_kcal = max(target_kcal, 1200)

    # 4) 매크로
    protein_per_kg = GOAL_PROTEIN_PER_KG.get(user.goal, 1.8)
    target_protein = user.weight * protein_per_kg
    target_fat = (target_kcal * FAT_RATIO) / 9
    target_carbs = max(
        (target_kcal - target_protein * 4 - target_fat * 9) / 4,
        0,
    )

    return {
        "bmr": round(bmr),
        "tdee": round(tdee),
        "target_kcal": round(target_kcal),
        "target_protein": round(target_protein),
        "target_carbs": round(target_carbs),
        "target_fat": round(target_fat),
    }
