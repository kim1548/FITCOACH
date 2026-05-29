import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api/config";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/ConfirmProvider";

/**
 * Settings 패널 — Editorial Magazine 톤.
 * SettingsDrawer 안에 들어가므로 외곽 헤더는 drawer 가 담당.
 */
const Settings = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: "정말 탈퇴하시겠습니까?",
      description: "계정과 함께 모든 운동·식단·저널 기록이 영구 삭제되며 복구할 수 없습니다.",
      confirmLabel: "Delete account",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("회원 탈퇴가 완료되었습니다.");
      logout();
      navigate("/signup", { replace: true });
    } catch (err) {
      toast.error("탈퇴 실패: " + (err?.response?.data?.detail || "알 수 없는 오류"));
      setDeleting(false);
    }
  };

  const SectionLabel = ({ children, accent = "red" }) => (
    <div
      className={`font-mono text-[11px] tracking-label uppercase mb-3 ${
        accent === "gold" ? "text-accent-gold" : "text-accent-red"
      }`}
    >
      — {children}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 인트로 한 줄 */}
      <p className="font-display italic text-sm text-taupe leading-relaxed">
        서비스 환경 및 개인 설정을 관리합니다.
      </p>

      {/* 1. Display Mode */}
      <section>
        <SectionLabel>Display Mode</SectionLabel>
        <div className="grid grid-cols-2 gap-px bg-ink/10 border border-ink/10">
          <button
            onClick={() => setTheme('dark')}
            className={`py-4 font-mono text-[11px] tracking-meta uppercase transition-colors ${
              theme === 'dark'
                ? 'bg-accent-red text-ink'
                : 'bg-paper text-taupe hover:text-ink'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setTheme('white')}
            className={`py-4 font-mono text-[11px] tracking-meta uppercase transition-colors ${
              theme === 'white'
                ? 'bg-accent-red text-ink'
                : 'bg-paper text-taupe hover:text-ink'
            }`}
          >
            Daylight
          </button>
        </div>
        <p className="font-display italic text-[11px] text-hint mt-2 leading-relaxed">
          Daylight 모드는 추후 적용됩니다 — 현재 다크 우선.
        </p>
      </section>

      {/* 2. Notifications */}
      <section>
        <SectionLabel>Notifications</SectionLabel>
        <div className="border border-ink/10">
          {[
            { label: "운동 루틴 알림", desc: "정해진 시간에 운동 시작 알람을 받습니다." },
            { label: "식사 기록 리마인드", desc: "매 끼니 식단 기록을 잊지 않도록 알려줍니다." },
            { label: "주간 분석 리포트", desc: "한 주간의 변화를 요약해서 보내드립니다." },
          ].map((item, i, arr) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i < arr.length - 1 ? 'border-b border-ink/8' : ''
              }`}
            >
              <div className="flex-1">
                <p className="font-display text-[15px] text-ink leading-tight">{item.label}</p>
                <p className="font-display italic text-[11px] text-taupe mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              {/* 더미 토글 — 백엔드 알림 기능 없음 */}
              <div className="flex-shrink-0 w-10 h-5 bg-ink/15 relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-accent-gold" />
              </div>
            </div>
          ))}
        </div>
        <p className="font-display italic text-[11px] text-hint mt-2 leading-relaxed">
          알림은 아직 화면 표시만 — 실제 발송은 추후 적용.
        </p>
      </section>

      {/* 3. Account */}
      <section>
        <SectionLabel accent="gold">Account</SectionLabel>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full text-left px-5 py-5 border border-accent-red/30 hover:bg-accent-red/5 transition-colors group disabled:opacity-50"
        >
          <p className="font-mono text-[11px] tracking-label uppercase text-accent-red group-hover:text-ink">
            {deleting ? "→ Processing…" : "→ Delete account"}
          </p>
          <p className="font-display italic text-[12px] text-hint mt-2 leading-relaxed">
            계정과 모든 운동·식단·저널 기록이 영구 삭제됩니다. 복구할 수 없습니다.
          </p>
        </button>
      </section>

      {/* 푸터 — 페이지 끝 마크 */}
      <div className="pt-6 mt-4 border-t border-ink/15 flex justify-between items-center font-mono text-[10px] text-hint tracking-meta uppercase">
        <span>— FITCOACH —</span>
        <span className="text-taupe">Settings</span>
      </div>
    </div>
  );
};

export default Settings;
