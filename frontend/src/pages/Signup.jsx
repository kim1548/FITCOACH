import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../api/config";

const GENDER_OPTIONS = ["남", "여"];
const LIFESTYLE_OPTIONS = ["학생", "사무직", "활동직", "기타"];
const EXPERIENCE_OPTIONS = ["입문자", "초보", "중급", "고급"];
const FREQUENCY_OPTIONS = ["주1회", "주2회", "주3회", "주4회 이상"];
const FITNESS_OPTIONS = ["낮음", "보통", "높음"];
const GOAL_OPTIONS = ["체중감소", "유지", "벌크업"];

const inputCls =
  "w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all";
const selectCls = inputCls + " bg-white appearance-none";
const labelCls = "block text-xs font-black uppercase tracking-widest text-slate-500 mb-2";

const Signup = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    gender: GENDER_OPTIONS[0],
    height: 170,
    weight: 70,
    lifestyle: LIFESTYLE_OPTIONS[0],
    workout_experience: EXPERIENCE_OPTIONS[0],
    workout_frequency: FREQUENCY_OPTIONS[2],
    fitness_level: FITNESS_OPTIONS[1],
    goal: GOAL_OPTIONS[0],
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, {
        ...form,
        height: Number(form.height),
        weight: Number(form.weight),
      });
      alert("회원가입 성공! 로그인해주세요.");
      navigate("/login");
    } catch (err) {
      alert("가입 실패: " + (err?.response?.data?.detail || "알 수 없는 오류"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100">
      <h2 className="text-3xl font-black mb-2 text-center italic text-slate-800">SIGN UP</h2>
      <p className="text-center text-xs text-slate-500 mb-8 tracking-widest font-bold uppercase">
        FITCOACH 시작하기
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1) 계정 정보 */}
        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="아이디"
            value={form.username}
            onChange={set("username")}
            autoComplete="username"
          />
          <input
            className={inputCls}
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
          />
        </div>

        {/* 2) 신체 정보 */}
        <div>
          <span className={labelCls}>신체 정보</span>
          <div className="grid grid-cols-3 gap-3">
            <select className={selectCls} value={form.gender} onChange={set("gender")}>
              {GENDER_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input
              className={inputCls}
              type="number"
              min="100"
              max="250"
              placeholder="키(cm)"
              value={form.height}
              onChange={set("height")}
            />
            <input
              className={inputCls}
              type="number"
              min="30"
              max="250"
              placeholder="kg"
              value={form.weight}
              onChange={set("weight")}
            />
          </div>
        </div>

        {/* 3) 생활 패턴 */}
        <div>
          <span className={labelCls}>라이프스타일</span>
          <select className={selectCls} value={form.lifestyle} onChange={set("lifestyle")}>
            {LIFESTYLE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* 4) 운동 정보 */}
        <div className="space-y-3">
          <div>
            <span className={labelCls}>운동 경력</span>
            <select className={selectCls} value={form.workout_experience} onChange={set("workout_experience")}>
              {EXPERIENCE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>운동 빈도</span>
              <select className={selectCls} value={form.workout_frequency} onChange={set("workout_frequency")}>
                {FREQUENCY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <span className={labelCls}>체력 수준</span>
              <select className={selectCls} value={form.fitness_level} onChange={set("fitness_level")}>
                {FITNESS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 5) 목표 */}
        <div>
          <span className={labelCls}>목표</span>
          <select className={selectCls} value={form.goal} onChange={set("goal")}>
            {GOAL_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-500 text-white p-4 rounded-2xl font-bold text-lg hover:bg-green-600 hover:shadow-lg hover:shadow-green-200 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-slate-500 text-sm mb-4">이미 계정이 있으신가요?</p>
        <Link
          to="/login"
          className="inline-block w-full p-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all"
        >
          로그인 하러가기
        </Link>
      </div>
    </div>
  );
};

export default Signup;
