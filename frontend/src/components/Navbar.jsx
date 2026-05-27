import React from "react";
import { Link, useLocation } from "react-router-dom";
// 아이콘 추가: ClipboardList(계획), PlayCircle(실행)
import { ClipboardList, PlayCircle, BookText, Utensils, Scale, Users } from "lucide-react";

const Navbar = ({ s }) => {
  const location = useLocation();

  const NavButton = ({ to, icon, label }) => {
    const active = location.pathname === to;
    return (
      <Link to={to} className="flex flex-col items-center justify-center flex-1 transition-all">
        <div className={`${active ? s.navActive : s.navInactive}`}>{icon}</div>
        <span className={`text-[9px] font-black uppercase mt-1 ${active ? s.navActive : s.navInactive}`}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className={`h-20 ${s.nav} border-t ${s.border} flex items-center justify-around px-4 z-[100] shadow-lg`}>
      {/* 0. 커뮤니티 (운동 메이트) */}
      <NavButton to="/community" icon={<Users size={22} />} label="Community" />

      {/* 1. 루틴 계획 (새로 추가될 중량/세트 관리 페이지) */}
      <NavButton to="/program" icon={<ClipboardList size={22} />} label="PROGRAM" />

      {/* 2. Form Check (AI 카메라 분석 페이지) */}
      <NavButton to="/formcheck" icon={<PlayCircle size={22} />} label="Form Check" />

      <NavButton to="/meals" icon={<Utensils size={22} />} label="MEALS" />

      {/* 3. InBody 추이 */}
      <NavButton to="/body" icon={<Scale size={22} />} label="BODY" />

      <NavButton to="/journal" icon={<BookText size={22} />} label="Journal" />
    </nav>
  );
};

export default Navbar;