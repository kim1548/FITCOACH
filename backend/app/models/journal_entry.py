from sqlalchemy import Column, Integer, Text, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class JournalEntry(Base):
    """
    하루치 회고 카드의 캐시.
    운동·식단 원본 데이터는 routine_logs / diet_logs 에 그대로 두고,
    이 테이블에는 (a) Gemma가 생성한 코멘트와 (b) 사용자의 한 줄 메모만 저장한다.
    """
    __tablename__ = "journal_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="uq_journal_user_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    entry_date = Column(Date, index=True)

    ai_comment = Column(Text, nullable=True)
    ai_generated_at = Column(DateTime, nullable=True)

    user_note = Column(Text, nullable=True)

    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", backref="journal_entries")
