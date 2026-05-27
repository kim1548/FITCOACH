import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Trash2, TrendingUp, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { API_BASE_URL } from "../api/config";
import BodyEntryModal from "../components/BodyEntryModal";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 가장 최근 측정과 그 직전 측정의 차이 — UI 상단 카드에 +0.5kg / -1.2% 같은 변화량 표기.
const computeDelta = (latest, prev, key) => {
  if (!latest || !prev) return null;
  const a = latest[key], b = prev[key];
  if (a == null || b == null) return null;
  return +(a - b).toFixed(1);
};

const formatDelta = (d, unit) => {
  if (d == null) return null;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d}${unit}`;
};

const deltaColor = (d, betterWhenLower = false) => {
  if (d == null || d === 0) return "text-slate-500";
  const improving = betterWhenLower ? d < 0 : d > 0;
  return improving ? "text-green-500" : "text-orange-500";
};

const BodyPage = ({ theme }) => {
  const isDark = theme === "dark" || theme === "design";
  const bgClass = isDark ? "bg-[#0c0c0e]" : "bg-slate-50";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const cardClass = isDark ? "bg-[#16161a] border-white/5" : "bg-white border-slate-200 shadow-sm";
  const subText = isDark ? "text-slate-400" : "text-slate-600";
  const gridStroke = isDark ? "#1f1f23" : "#e2e8f0";
  const tickColor = isDark ? "#64748b" : "#94a3b8";

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/body`, { headers: authHeaders() })
      .then((res) => setLogs(res.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // 최신순으로 받지만 차트는 시간순(오래된→최신)이 자연스러워서 뒤집어 사용.
  const chartData = useMemo(
    () => [...logs].reverse().map((l) => ({
      date: (l.measured_at || "").slice(5),  // MM-DD
      체중: l.weight,
      골격근: l.skeletal_muscle,
      체지방: l.body_fat_mass,
      체지방률: l.body_fat_percent,
    })),
    [logs],
  );

  const latest = logs[0];
  const prev = logs[1];

  const handleDelete = async (id) => {
    if (!window.confirm("이 측정 기록을 삭제할까요?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/body/${id}`, { headers: authHeaders() });
      fetchLogs();
    } catch (err) {
      alert("삭제 실패");
    }
  };

  return (
    <div
      className={`fixed inset-0 ${bgClass} ${textClass} overflow-y-auto [&::-webkit-scrollbar]:hidden animate-in slide-in-from-right duration-300`}
      style={{ scrollbarWidth: "none" }}
    >
      <div className="w-full max-w-3xl mx-auto pt-[80px] pb-[120px] px-6">
        <header className="mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Body Composition</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">InBody 추이</h1>
            <p className={`text-sm ${subText} mt-1`}>측정값을 기록해 변화 흐름을 확인하세요.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={14} /> 측정 추가
          </button>
        </header>

        {loading && (
          <div className={`${cardClass} rounded-[2rem] p-10 border text-center ${subText}`}>
            <Loader2 className="animate-spin mx-auto mb-3" size={20} />
            <p className="text-xs">불러오는 중...</p>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className={`${cardClass} rounded-[2rem] p-10 border text-center`}>
            <TrendingUp className={`mx-auto mb-3 ${subText}`} size={24} />
            <p className="text-sm font-bold mb-1">아직 측정 기록이 없어요.</p>
            <p className={`text-xs ${subText}`}>첫 측정을 추가하면 추이 그래프가 시작됩니다.</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="space-y-6">
            {/* 최신 측정 + 직전 대비 변화량 */}
            <section className={`${cardClass} rounded-[2rem] p-6 border`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">최근 측정</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${subText}`}>
                  {latest.measured_at}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "체중", key: "weight", unit: "kg", betterLower: false },
                  { label: "골격근", key: "skeletal_muscle", unit: "kg", betterLower: false },
                  { label: "체지방", key: "body_fat_mass", unit: "kg", betterLower: true },
                  { label: "체지방률", key: "body_fat_percent", unit: "%", betterLower: true },
                ].map((m) => {
                  const v = latest[m.key];
                  const d = computeDelta(latest, prev, m.key);
                  return (
                    <div key={m.key}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${subText} mb-1`}>{m.label}</p>
                      <p className="text-2xl font-black tabular-nums">
                        {v != null ? v : <span className={subText}>—</span>}
                        {v != null && <span className={`text-xs font-normal ${subText} ml-1`}>{m.unit}</span>}
                      </p>
                      {d != null && (
                        <p className={`text-[10px] font-black mt-1 ${deltaColor(d, m.betterLower)}`}>
                          {formatDelta(d, m.unit)} 직전 대비
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 차트 1: 체중·골격근·체지방 (kg) */}
            <section className={`${cardClass} rounded-[2rem] p-6 border`}>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
                체중 · 근육 · 지방 (kg)
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} />
                    <YAxis tick={{ fontSize: 10, fill: tickColor }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#16161a" : "#fff",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                        borderRadius: "0.75rem",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="체중" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="골격근" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="체지방" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 차트 2: 체지방률 (%) */}
            <section className={`${cardClass} rounded-[2rem] p-6 border`}>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
                체지방률 (%)
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} />
                    <YAxis tick={{ fontSize: 10, fill: tickColor }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#16161a" : "#fff",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                        borderRadius: "0.75rem",
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="체지방률" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 측정 이력 */}
            <section className={`${cardClass} rounded-[2rem] p-6 border`}>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">측정 이력</p>
              <div className="divide-y divide-white/5">
                {logs.map((l) => (
                  <div key={l.id} className="py-3 flex items-center gap-3 text-sm">
                    <span className="w-20 font-black tabular-nums">{l.measured_at}</span>
                    <span className="flex-1 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums">
                      <span>{l.weight}kg</span>
                      {l.skeletal_muscle != null && <span className="text-green-500">근 {l.skeletal_muscle}</span>}
                      {l.body_fat_mass != null && <span className="text-orange-500">지 {l.body_fat_mass}</span>}
                      {l.body_fat_percent != null && <span className="text-purple-500">{l.body_fat_percent}%</span>}
                    </span>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className={`p-1.5 rounded-full ${isDark ? "hover:bg-red-500/20 text-slate-500 hover:text-red-500" : "hover:bg-red-100 text-slate-400 hover:text-red-500"}`}
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <BodyEntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchLogs}
        theme={theme}
      />
    </div>
  );
};

export default BodyPage;
