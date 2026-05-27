import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api/config";
import { useAuth } from "../context/AuthContext";

const Settings = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!window.confirm(
      "정말 탈퇴하시겠습니까?\n\n계정과 함께 모든 운동·식단·저널 기록이 영구 삭제되며 복구할 수 없습니다."
    )) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("회원 탈퇴가 완료되었습니다.");
      logout();
      navigate("/signup", { replace: true });
    } catch (err) {
      alert("탈퇴 실패: " + (err?.response?.data?.detail || "알 수 없는 오류"));
      setDeleting(false);
    }
  };

  // 섹션 타이틀 컴포넌트
  const SectionTitle = ({ children }) => (
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-2">
      {children}
    </p>
  );

  return (

    /* Drawer 안에 들어가는 컨텐츠라 외곽 폭/패딩 제약 없음. 헤더는 Drawer 가 제공. */
    <div className="space-y-8">

      <p className="text-slate-500 text-xs font-medium">서비스 환경 및 개인 설정을 관리합니다.</p>

      {/* 1. 테마 모드 설정 */}
      <div className="space-y-4">
        <SectionTitle>Display Mode</SectionTitle>
        <div className="grid grid-cols-2 gap-3 p-2 bg-white/5 rounded-[2.5rem] border border-white/5">
          <button
            onClick={() => setTheme('dark')}
            className={`py-4 rounded-[1.8rem] text-xs font-black transition-all ${theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            DARK
          </button>

          <button
            onClick={() => setTheme('white')}
            className={`py-4 rounded-[1.8rem] text-xs font-black transition-all ${theme === 'white' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            LIGHT
          </button>
        </div>
      </div>

      {/* 2. 알림 설정 (원본 내용 복구) */}
      <div className="space-y-4">
        <SectionTitle>Notifications</SectionTitle>
        <div className="p-2 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-1">
          {[
            { label: "운동 루틴 알림", desc: "정해진 시간에 운동 시작 알람을 받습니다." },
            { label: "식사 기록 리마인드", desc: "매 끼니 식단 기록을 잊지 않도록 알려줍니다." },
            { label: "주간 분석 리포트", desc: "한 주간의 변화를 요약해서 보내드립니다." }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-5 hover:bg-white/5 rounded-[1.8rem] transition-colors group">
              <div>
                <p className="text-sm font-bold text-slate-200">{item.label}</p>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
              </div>
              <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 계정 관리 */}
      <div className="space-y-4">
        <SectionTitle>Account</SectionTitle>
        <div className="p-2 bg-white/5 rounded-[2.5rem] border border-white/5">
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full text-left p-5 hover:bg-red-500/10 rounded-[1.8rem] transition-colors group disabled:opacity-50"
          >
            <p className="text-sm font-bold text-red-500/80 group-hover:text-red-500 uppercase tracking-tighter">
              {deleting ? "탈퇴 처리 중..." : "회원 탈퇴"}
            </p>
            <p className="text-[11px] text-slate-600 italic">
              계정과 모든 운동·식단·저널 기록이 영구 삭제됩니다. 복구할 수 없습니다.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;