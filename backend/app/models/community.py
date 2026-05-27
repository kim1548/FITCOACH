"""
커뮤니티(글/좋아요/댓글) 모델.

스레딩(대댓글) 없는 평면 구조 — KISS. 비밀댓글은 is_secret 플래그로 처리하고,
조회 시 작성자/글쓴이 외엔 본문 마스킹은 라우터에서 처리한다.

좋아요는 (post_id, user_id) 유니크 인덱스로 중복 방지하며, POST 토글 방식.
"""

from sqlalchemy import (
    Column, Integer, Float, String, Text, Boolean, DateTime, ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    body = Column(Text, nullable=False)
    address = Column(String(120), nullable=True)        # 자유 텍스트 (예: '서울 강남', '강남 헬스장')
    bench = Column(Float, nullable=True)                # 벤치프레스 1RM (kg)
    deadlift = Column(Float, nullable=True)             # 데드리프트 1RM (kg)
    squat = Column(Float, nullable=True)                # 스쿼트 1RM (kg)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", backref="community_posts")
    likes = relationship("CommunityLike", backref="post", cascade="all, delete-orphan")
    comments = relationship("CommunityComment", backref="post", cascade="all, delete-orphan")


class CommunityLike(Base):
    __tablename__ = "community_likes"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_community_like_post_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.now)


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    body = Column(Text, nullable=False)
    is_secret = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", backref="community_comments")
