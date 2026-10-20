import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getStatistiquesGlobal,
  getCentres,
  getStatistiquesCentre,
  getUsers,
  getStatistiquesEnseignant,
  exportExcel,
  exportPdf,
} from "@/services/api";
import { StatistiquesGlobal, Centre, User, CentreStatistiques } from "@/types";
import Layout, { Spinner } from "@/components/Layout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TeacherStatsRow extends User {
  stats?: any;
}

interface CenterChartData {
  name: string;
  enseignants: number;
  apprenants: number;
  taux_presence: number;
}

export default function StatistiquesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<StatistiquesGlobal | null>(null);
  const [chartData, setChartData] = useState<CenterChartData[]>([]);
  const [teachers, setTeachers] = useState<TeacherStatsRow[]>([]);
  const [exportLoading, setExportLoading] = useState<"excel" | "pdf" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      // 1. Fetch global stats
      const gStats = await getStatistiquesGlobal();
      setGlobalStats(gStats);

      // 2. Fetch Centres & their stats for the chart
      const centers = await getCentres();
      const centerStatsPromises = centers.map(async (c) => {
        try {
          const s = await getStatistiquesCentre(c.id);
          return {
            name: c.nom,
            enseignants: s.nombre_enseignants,
            apprenants: s.nombre_apprenants,
            taux_presence: s.taux_presence,
          };
        } catch {
          return null;
        }
      });
      const cData = (await Promise.all(centerStatsPromises)).filter(Boolean) as CenterChartData[];
      setChartData(cData);

      // 3. Fetch Teachers & their stats
      const teacherList = await getUsers({ role: "enseignant" });
      const teacherStatsPromises = teacherList.map(async (t) => {
        try {
          const s = await getStatistiquesEnseignant(t.id);
          return { ...t, stats: s };
        } catch {
          return { ...t, stats: null };
        }
      });
      const tData = await Promise.all(teacherStatsPromises);
      setTeachers(tData);

    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportExcel() {
    setExportLoading("excel");
    try {
      const blob = await exportExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statistiques_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert("Erreur lors de l'export Excel.");
    } finally {
      setExportLoading(null);
    }
  }

  async function handleExportPdf() {
    setExportLoading("pdf");
    setErrorMsg(null);
    try {
      const blob = await exportPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statistiques_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      if (err.response?.status === 503) {
        setErrorMsg("Export PDF non disponible");
      } else {
        alert("Erreur lors de l'export PDF.");
      }
    } finally {
      setExportLoading(null);
    }
  }

  if (loading) return <Layout title="Statistiques"><Spinner /></Layout>;

  return (
    <Layout title="Statistiques et Rapports" subtitle="Analyse globale de l'association">
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
        
        {/* Error notification for PDF */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between animate-pulse shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold text-red-700">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Global Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Apprenants" value={globalStats?.nombre_apprenants || 0} icon="users" color="blue" />
          <StatCard label="Enseignants" value={globalStats?.nombre_enseignants || 0} icon="academic" color="green" />
          <StatCard label="Centres" value={globalStats?.nombre_centres || 0} icon="home" color="purple" />
          <StatCard label="Séances" value={globalStats?.nombre_seances_lecture || 0} icon="chart" color="gold" />
        </div>


        {/* Actions Bar */}
        <div className="flex justify-end gap-3 px-2">
          <button
            onClick={handleExportExcel}
            disabled={!!exportLoading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            {exportLoading === "excel" ? (
              <div className="w-4 h-4 border-2 border-gray-200 border-t-[#008C45] rounded-full animate-spin" />
            ) : (
              <svg className="w-4.5 h-4.5 text-[#008C45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Exporter Excel
          </button>
          <button
            onClick={handleExportPdf}
            disabled={!!exportLoading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#008C45] hover:bg-[#006b35] text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-[#008C45]/20 hover:shadow-xl hover:shadow-[#008C45]/30 transform hover:-translate-y-0.5"
          >
            {exportLoading === "pdf" ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            Exporter PDF
          </button>
        </div>
        {/*statistique cart*/}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Chart Section */}
          <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
            <h3 className="text-xl font-black text-[#171717] mb-8">Comparaison des centres</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="apprenants" name="Apprenants" fill="#F9A825" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="enseignants" name="Enseignants" fill="#008C45" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Teacher Performance */}
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col overflow-hidden relative">
            <div className="p-8 border-b border-gray-100/50 flex items-center justify-between bg-white/40">
              <h3 className="text-xl font-black text-[#171717]">Performance des enseignants</h3>
              <span className="px-3 py-1.5 bg-[#008C45]/10 text-[#008C45] rounded-xl text-xs font-bold uppercase tracking-wider border border-[#008C45]/20">Top Enseignants</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100/50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="text-left px-8 py-5 font-bold">Enseignant</th>
                    <th className="text-center px-8 py-5 font-bold">Séances</th>
                    <th className="text-center px-8 py-5 font-bold">Apprenants</th>
                    <th className="text-right px-8 py-5 font-bold">Progression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {teachers.slice(0, 10).map((t) => (
                    <tr key={t.id} className="hover:bg-white transition-colors duration-200 group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#171717] to-gray-800 text-white flex items-center justify-center font-bold text-base shadow-md group-hover:scale-110 transition-transform duration-300">
                            {t.nom.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900 group-hover:text-[#008C45] transition-colors">{t.prenom} {t.nom}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-gray-600">{t.stats?.nombre_seances || 0}</td>
                      <td className="px-8 py-5 text-center">
                        <span className="px-3 py-1.5 rounded-xl bg-[#FFF8E1]/50 border border-[#FFE082]/50 text-[#F9A825] font-bold text-xs shadow-sm">
                          {t.stats?.apprenants_suivis || 0}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-[#F9A825] rounded-full"
                              style={{ width: `${(t.stats?.evaluation_moyenne || 0) * 20}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8">{t.stats?.evaluation_moyenne || 0}/5</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-gray-100/50 mt-auto text-center bg-gray-50/30">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Données basées sur les derniers 30 jours</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100/50 text-blue-600 border border-blue-200/50 shadow-sm",
    green: "bg-[#008C45]/10 text-[#008C45] border border-[#008C45]/20 shadow-sm",
    purple: "bg-purple-100/50 text-purple-600 border border-purple-200/50 shadow-sm",
    gold: "bg-[#F9A825]/10 text-[#F9A825] border border-[#F9A825]/20 shadow-sm",
  };

  const icons: Record<string, any> = {
    users: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>,
    academic: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
    home: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    chart: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  };

  return (
    <div className="bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex items-center gap-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${colors[color]}`}>
        {icons[icon]}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-[#171717]">{value}</p>
      </div>
    </div>
  );
}
