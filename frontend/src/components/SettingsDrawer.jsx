import React, { useEffect } from "react";
import { X } from "lucide-react";
import Settings from "../pages/Settings";

/**
 * 우측에서 슬라이드되어 나오는 Settings drawer.
 * - 데스크탑: 폭 400px (w-[400px])
 * - 모바일: 전체 폭
 * - 백드롭 클릭 또는 X 또는 ESC 로 닫힘
 * - 닫혀있을 때도 DOM 에 남겨두고 translate-x 로 슬라이드시켜 애니메이션 자연스러움
 */
const SettingsDrawer = ({ isOpen, onClose, theme, setTheme }) => {
  // ESC 로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // drawer 열려있는 동안 body 스크롤 잠금 (선택)
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  return (
    <>
      {/* 백드롭 — 닫혀있을 땐 pointer-events 무효 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer 본체 */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-[201] w-full md:w-[400px] bg-[#0c0c0e] text-white border-l border-white/5 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Settings"
      >
        {/* drawer 헤더 — Settings 페이지 헤더 대체 */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0c0c0e]/90 backdrop-blur-md">
          <h2 className="text-2xl font-black tracking-tighter italic uppercase">SETTINGS</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </header>

        {/* drawer 본문 — 스크롤 */}
        <div className="h-[calc(100%-65px)] overflow-y-auto px-6 py-6">
          <Settings theme={theme} setTheme={setTheme} />
        </div>
      </aside>
    </>
  );
};

export default SettingsDrawer;
