from sqlalchemy import Column, Integer, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class InBodyLog(Base):
    """
    사용자의 인바디(체성분 분석) 측정 기록. 주~월 단위로 측정해 추이를 본다.

    체중(weight) 외엔 모두 nullable — InBody 모델·측정 환경에 따라 빠지는 값이 있을 수 있고,
    수동 입력 시에도 사용자가 다 알지 못할 수 있어 유연하게 받는다.

    ai_comment 는 측정 저장 직후 BackgroundTasks 로 Gemma 가 직전 측정 대비 변화(또는 첫 측정
    베이스라인)를 분석한 결과를 캐시한 것. Journal 모달의 '체성분' 섹션에서 같이 보여진다.
    """
    __tablename__ = "inbody_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    measured_at = Column(Date, index=True)

    weight = Column(Float)                              # 체중 (kg)
    skeletal_muscle = Column(Float, nullable=True)     # 골격근량 (kg)
    body_fat_mass = Column(Float, nullable=True)       # 체지방량 (kg)
    body_fat_percent = Column(Float, nullable=True)    # 체지방률 (%)
    bmr = Column(Float, nullable=True)                 # 기초대사량 (kcal)

    ai_comment = Column(Text, nullable=True)
    ai_generated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", backref="inbody_logs")
