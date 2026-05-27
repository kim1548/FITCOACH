import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus, Heart, MessageCircle, Lock, Send, Pencil, Trash2, X,
  Loader2, Users, MoreVertical, Save,
} from "lucide-react";
import { API_BASE_URL } from "../api/config";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return iso.slice(0, 10);
};

// 글 작성/수정 폼 — 작성 모드와 수정 모드 둘 다.
const PostForm = ({ initial, onSubmit, onCancel, isDark, submitting }) => {
  const [body, setBody] = useState(initial?.body || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [bench, setBench] = useState(initial?.bench ?? "");
  const [deadlift, setDeadlift] = useState(initial?.deadlift ?? "");
  const [squat, setSquat] = useState(initial?.squat ?? "");

  const subText = isDark ? "text-slate-400" : "text-slate-600";
  const inputCls = `w-full px-3 py-2 rounded-xl outline-none text-sm font-bold ${
    isDark
      ? "bg-white/5 border border-white/10 focus:border-blue-500/40 text-white"
      : "bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-900"
  }`;

  const handle = () => {
    if (!body.trim()) return;
    const payload = {
      body: body.trim(),
      address: address.trim() || null,
      bench: bench === "" ? null : Number(bench),
      deadlift: deadlift === "" ? null : Number(deadlift),
      squat: squat === "" ? null : Number(squat),
    };
    onSubmit(payload);
  };

  return (
    <div className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="운동 메이트를 찾거나, 오늘 운동을 공유해보세요."
        rows={3}
        className={inputCls + " resize-none"}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="col-span-2 md:col-span-1">
          <span className={`block text-[10px] font-black uppercase tracking-widest ${subText} mb-1`}>
            주소
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="선택 (예: 강남)"
            className={inputCls}
          />
        </div>
        {[
          { label: "벤치", value: bench, setter: setBench },
          { label: "데드", value: deadlift, setter: setDeadlift },
          { label: "스쿼트", value: squat, setter: setSquat },
        ].map((f) => (
          <div key={f.label}>
            <span className={`block text-[10px] font-black uppercase tracking-widest ${subText} mb-1`}>
              {f.label}
            </span>
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              placeholder="kg"
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            onClick={onCancel}
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full ${
              isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            취소
          </button>
        )}
        <button
          onClick={handle}
          disabled={submitting || !body.trim()}
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {initial ? "수정" : "등록"}
        </button>
      </div>
    </div>
  );
};

// 댓글 1개 — 본인이면 수정/삭제, 비밀댓글이고 권한 없으면 자물쇠.
const CommentRow = ({ comment, isDark, onUpdate, onDelete }) => {
  const subText = isDark ? "text-slate-400" : "text-slate-600";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [secret, setSecret] = useState(comment.is_secret);
  const [saving, setSaving] = useState(false);

  const inputCls = `w-full px-3 py-2 rounded-xl outline-none text-sm ${
    isDark
      ? "bg-white/5 border border-white/10 focus:border-blue-500/40 text-white"
      : "bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-900"
  }`;

  const saveEdit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await onUpdate(comment.id, { body: draft.trim(), is_secret: secret });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`py-2 ${isDark ? "border-white/5" : "border-slate-100"} border-b last:border-b-0`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-black">{comment.author.nickname}</span>
        {comment.author.age != null && (
          <span className={`text-[10px] ${subText}`}>· {comment.author.age}세</span>
        )}
        {comment.is_secret && <Lock size={10} className="text-amber-500" />}
        <span className={`text-[10px] ${subText} ml-auto`}>{timeAgo(comment.created_at)}</span>
        {comment.is_mine && !editing && (
          <>
            <button
              onClick={() => { setDraft(comment.body); setSecret(comment.is_secret); setEditing(true); }}
              className={`p-1 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-slate-200"}`}
              aria-label="댓글 수정"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className={`p-1 rounded-full ${isDark ? "hover:bg-red-500/20 text-slate-400 hover:text-red-500" : "hover:bg-red-100 text-slate-500 hover:text-red-500"}`}
              aria-label="댓글 삭제"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={inputCls + " resize-none"}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest cursor-pointer">
              <input
                type="checkbox"
                checked={secret}
                onChange={(e) => setSecret(e.target.checked)}
                className="accent-blue-600"
              />
              비밀
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !draft.trim()}
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-1"
              >
                {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                저장
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className={`text-sm leading-relaxed ${comment.can_read ? "" : `italic ${subText}`}`}>
          {comment.body}
        </p>
      )}
    </div>
  );
};

// 글 1개 카드 — 본문 + 메타 + 좋아요/댓글
const PostCard = ({
  post, isDark,
  onLike, onDelete, onUpdate,
  onLoadComments, comments, commentsLoading,
  onAddComment, onUpdateComment, onDeleteComment,
}) => {
  const subText = isDark ? "text-slate-400" : "text-slate-600";
  const cardClass = isDark ? "bg-[#16161a] border-white/5" : "bg-white border-slate-200 shadow-sm";
  const chipClass = isDark ? "bg-white/5" : "bg-slate-100";

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [commentDraft, setCommentDraft] = useState("");
  const [commentSecret, setCommentSecret] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const inputCls = `w-full px-3 py-2 rounded-xl outline-none text-sm ${
    isDark
      ? "bg-white/5 border border-white/10 focus:border-blue-500/40 text-white"
      : "bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-900"
  }`;

  const liftRow = useMemo(() => {
    const parts = [];
    if (post.bench != null) parts.push(`B ${post.bench}`);
    if (post.deadlift != null) parts.push(`D ${post.deadlift}`);
    if (post.squat != null) parts.push(`S ${post.squat}`);
    return parts;
  }, [post.bench, post.deadlift, post.squat]);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) onLoadComments(post.id);
  };

  const submitEdit = async (payload) => {
    setEditSubmitting(true);
    try {
      await onUpdate(post.id, payload);
      setEditing(false);
    } finally {
      setEditSubmitting(false);
    }
  };

  const submitComment = async () => {
    if (!commentDraft.trim()) return;
    setCommentSubmitting(true);
    try {
      await onAddComment(post.id, { body: commentDraft.trim(), is_secret: commentSecret });
      setCommentDraft("");
      setCommentSecret(false);
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <article className={`${cardClass} rounded-[2rem] p-6 border space-y-4`}>
      {/* 작성자 헤더 */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black">{post.author.nickname}</span>
          {post.author.age != null && (
            <span className={`text-xs ${subText}`}>{post.author.age}세</span>
          )}
          {post.address && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${chipClass}`}>{post.address}</span>
          )}
          {liftRow.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tabular-nums ${chipClass}`}>
              {liftRow.join(" / ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] ${subText}`}>{timeAgo(post.created_at)}</span>
          {post.is_mine && (
            <>
              <button
                onClick={() => setEditing((v) => !v)}
                className={`p-1.5 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
                aria-label="수정"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className={`p-1.5 rounded-full ${isDark ? "hover:bg-red-500/20 text-slate-400 hover:text-red-500" : "hover:bg-red-100 text-slate-500 hover:text-red-500"}`}
                aria-label="삭제"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* 본문 또는 수정 폼 */}
      {editing ? (
        <PostForm
          initial={post}
          onSubmit={submitEdit}
          onCancel={() => setEditing(false)}
          isDark={isDark}
          submitting={editSubmitting}
        />
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
      )}

      {/* 액션 바 */}
      <div className={`flex items-center gap-4 pt-3 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}>
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs font-black ${
            post.liked_by_me ? "text-pink-500" : subText
          } hover:text-pink-500 transition-colors`}
        >
          <Heart size={14} fill={post.liked_by_me ? "currentColor" : "none"} />
          <span className="tabular-nums">{post.like_count}</span>
        </button>
        <button
          onClick={toggleExpand}
          className={`flex items-center gap-1.5 text-xs font-black ${subText} hover:text-blue-500 transition-colors`}
        >
          <MessageCircle size={14} />
          <span className="tabular-nums">{post.comment_count}</span>
        </button>
      </div>

      {/* 댓글 영역 */}
      {expanded && (
        <div className={`pt-3 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}>
          {commentsLoading ? (
            <div className={`flex items-center gap-2 ${subText} py-2 text-xs`}>
              <Loader2 className="animate-spin" size={14} /> 댓글 불러오는 중...
            </div>
          ) : (
            <div className="space-y-1">
              {(comments || []).length === 0 && (
                <p className={`text-xs ${subText} py-2`}>첫 댓글을 남겨보세요.</p>
              )}
              {(comments || []).map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  isDark={isDark}
                  onUpdate={(id, payload) => onUpdateComment(post.id, id, payload)}
                  onDelete={(id) => onDeleteComment(post.id, id)}
                />
              ))}
            </div>
          )}

          {/* 댓글 입력 */}
          <div className="pt-3 space-y-2">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="댓글을 입력하세요"
              rows={2}
              className={inputCls + " resize-none"}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest cursor-pointer">
                <input
                  type="checkbox"
                  checked={commentSecret}
                  onChange={(e) => setCommentSecret(e.target.checked)}
                  className="accent-blue-600"
                />
                <Lock size={11} /> 비밀댓글
              </label>
              <button
                onClick={submitComment}
                disabled={commentSubmitting || !commentDraft.trim()}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {commentSubmitting ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const CommunityPage = ({ theme }) => {
  const isDark = theme === "dark" || theme === "design";
  const bgClass = isDark ? "bg-[#0c0c0e]" : "bg-slate-50";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const cardClass = isDark ? "bg-[#16161a] border-white/5" : "bg-white border-slate-200 shadow-sm";
  const subText = isDark ? "text-slate-400" : "text-slate-600";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // post_id → comment array (lazy 로딩)
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});

  const fetchPosts = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/community/posts`, { headers: authHeaders() })
      .then((res) => setPosts(res.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // ---------- Post handlers ----------
  const createPost = async (payload) => {
    setCreating(true);
    try {
      await axios.post(`${API_BASE_URL}/community/posts`, payload, { headers: authHeaders() });
      setWriteOpen(false);
      fetchPosts();
    } catch (err) {
      alert(err?.response?.data?.detail || "등록에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const updatePost = async (id, payload) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/community/posts/${id}`, payload, { headers: authHeaders() });
      setPosts((prev) => prev.map((p) => p.id === id ? res.data : p));
    } catch (err) {
      alert(err?.response?.data?.detail || "수정에 실패했습니다.");
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("이 글을 삭제할까요?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/community/posts/${id}`, { headers: authHeaders() });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err?.response?.data?.detail || "삭제에 실패했습니다.");
    }
  };

  const togglePostLike = async (id) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/community/posts/${id}/like`, null, { headers: authHeaders() });
      setPosts((prev) => prev.map((p) =>
        p.id === id ? { ...p, liked_by_me: res.data.liked, like_count: res.data.like_count } : p
      ));
    } catch {
      // 조용히 실패
    }
  };

  // ---------- Comment handlers ----------
  const loadComments = async (postId) => {
    if (commentsByPost[postId]) return;  // 이미 캐시됨
    setCommentsLoading((m) => ({ ...m, [postId]: true }));
    try {
      const res = await axios.get(`${API_BASE_URL}/community/posts/${postId}/comments`, { headers: authHeaders() });
      setCommentsByPost((m) => ({ ...m, [postId]: res.data || [] }));
    } catch {
      setCommentsByPost((m) => ({ ...m, [postId]: [] }));
    } finally {
      setCommentsLoading((m) => ({ ...m, [postId]: false }));
    }
  };

  const addComment = async (postId, payload) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/community/posts/${postId}/comments`,
        payload,
        { headers: authHeaders() },
      );
      setCommentsByPost((m) => ({ ...m, [postId]: [...(m[postId] || []), res.data] }));
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
      ));
    } catch (err) {
      alert(err?.response?.data?.detail || "댓글 등록 실패");
    }
  };

  const updateComment = async (postId, commentId, payload) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/community/comments/${commentId}`, payload, { headers: authHeaders() });
      setCommentsByPost((m) => ({
        ...m,
        [postId]: (m[postId] || []).map((c) => c.id === commentId ? res.data : c),
      }));
    } catch (err) {
      alert(err?.response?.data?.detail || "댓글 수정 실패");
    }
  };

  const deleteComment = async (postId, commentId) => {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/community/comments/${commentId}`, { headers: authHeaders() });
      setCommentsByPost((m) => ({
        ...m,
        [postId]: (m[postId] || []).filter((c) => c.id !== commentId),
      }));
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) - 1) } : p
      ));
    } catch (err) {
      alert(err?.response?.data?.detail || "댓글 삭제 실패");
    }
  };

  return (
    <div
      className={`fixed inset-0 ${bgClass} ${textClass} overflow-y-auto [&::-webkit-scrollbar]:hidden animate-in slide-in-from-left duration-300`}
      style={{ scrollbarWidth: "none" }}
    >
      <div className="w-full max-w-3xl mx-auto pt-[80px] pb-[120px] px-6">
        <header className="mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Community</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">운동 메이트</h1>
            <p className={`text-sm ${subText} mt-1`}>같이 운동할 사람을 찾고 일상을 공유하세요.</p>
          </div>
          <button
            onClick={() => setWriteOpen((v) => !v)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {writeOpen ? <X size={14} /> : <Plus size={14} />} {writeOpen ? "닫기" : "글쓰기"}
          </button>
        </header>

        {writeOpen && (
          <section className={`${cardClass} rounded-[2rem] p-6 border mb-6`}>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-3">새 글</p>
            <PostForm
              onSubmit={createPost}
              onCancel={() => setWriteOpen(false)}
              isDark={isDark}
              submitting={creating}
            />
          </section>
        )}

        {loading && (
          <div className={`${cardClass} rounded-[2rem] p-10 border text-center ${subText}`}>
            <Loader2 className="animate-spin mx-auto mb-3" size={20} />
            <p className="text-xs">불러오는 중...</p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className={`${cardClass} rounded-[2rem] p-10 border text-center`}>
            <Users className={`mx-auto mb-3 ${subText}`} size={24} />
            <p className="text-sm font-bold mb-1">아직 글이 없어요.</p>
            <p className={`text-xs ${subText}`}>첫 글을 남겨 운동 메이트를 찾아보세요.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                isDark={isDark}
                onLike={togglePostLike}
                onDelete={deletePost}
                onUpdate={updatePost}
                onLoadComments={loadComments}
                comments={commentsByPost[p.id]}
                commentsLoading={!!commentsLoading[p.id]}
                onAddComment={addComment}
                onUpdateComment={updateComment}
                onDeleteComment={deleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
