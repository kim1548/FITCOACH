import React, { useState } from "react";
import axios from "axios";
import { X, Loader2, Save } from "lucide-react";
import { API_BASE_URL } from "../api/config";

const FIELDS = [
  { key: "weight",          label: "체중",       unit: "kg",   required: true  },
  { key: "skeletal_muscle", label: "골격근량",   unit: "kg",   required: false },
  { key: "body_fat_mass",   label: "체지방량",   unit: "kg",   required: false },
  { key: "body_fat_percent", label: "체지방률",  unit: "%",    required: false },
  { key: "bmr",             label: "기초대사량", unit: "kcal", required: false },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * InBody 측정 입력 모달.
 * - 측정일은 기본 오늘, date input 으로 변경 가능
 * - 체중만 필수, 나머지 4개는 옵션 (InBody 결과지에 따라 일부만 알 수 있음)
 * - 저장 성공 시 onSaved 호출 — 부모가 리스트 갱신
 */
const BodyEntryModal = ({ isOpen, onClose, onSaved, theme }) => {
  const isDark = theme === "dark" || theme === "design";
  const cardClass = isDark ? "bg-[#16161a] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900";
  const inputCls = `w-full px-4 py-3 rounded-xl outline-none text-sm font-bold ${
    isDark
      ? "bg-white/5 border border-white/10 focus:border-blue-500/40 text-white"
      : "bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-900"
  }`;
  const subText = isDark ? "text-slate-400" : "text-slate-600";

  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!values.weight) {
      setError("체중은 필수입니다.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { measured_at: date, weight: Number(values.weight) };
      for (const f of FIELDS) {
        if (f.key !== "weight" && values[f.key] !== undefined && values[f.key] !== "") {
          payload[f.key] = Number(values[f.key]);
        }
      }
      await axios.post(`${API_BASE_URL}/body`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSaved?.();
      setValues({});
      setDate(todayISO());
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className={`w-full md:max-w-md max-h-[90vh] overflow-y-auto rounded-t-[2rem] md:rounded-[2rem] border ${cardClass} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md bg-inherit">
          <h2 className="text-xl font-black tracking-tight">측정 추가</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"}`} aria-label="닫기">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-5">
          <div>
            <span className={`block text-[10px] font-black uppercase tracking-widest ${subText} mb-2`}>측정 날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {FIELDS.map((f) => (
            <div key={f.key}>
              <span className={`block text-[10px] font-black uppercase tracking-widest ${subText} mb-2`}>
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </span>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.required ? "필수" : "선택 입력"}
                  className={inputCls + " pr-12"}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black ${subText}`}>{f.unit}</span>
              </div>
            </div>
          ))}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BodyEntryModal;
