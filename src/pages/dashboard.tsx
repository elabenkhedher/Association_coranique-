import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getStatistiquesGlobal, getCentres } from "@/services/api";
import { StatistiquesGlobal, Centre } from "@/types";
import Layout, { Spinner } from "@/components/Layout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Premium Stat Card (Glassmorphism)                                 */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
}

function StatCard({ title, value, icon, gradientFrom, gradientTo }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-1">
      {/* Glow effect */}
      <div 
        className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${gradientFrom} 0%, transparent 70%)` }}
      />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-bold tracking-wider text-gray-500 uppercase">{title}</p>
          <p className="text-4xl font-black text-gray-900 tracking-tight mt-1">{value}</p>
        </div>
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = ["#008C45", "#00A651", "#00C05D", "#00b25e", "#00a155", "#00914d", "#008144"];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatistiquesGlobal | null>(null);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    async function fetchData() {
      try {
        const [statsData, centresData] = await Promise.all([
          getStatistiquesGlobal(),
          getCentres(),
        ]);
        setStats(statsData);
        setCentres(centresData);
      } catch {
        // Handled by interceptor
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const chartData = centres.map((c) => ({
    centre: c.nom,
    count: c.nombre_apprenants ?? 0,
  }));

  return (
    <Layout title="Tableau de bord" subtitle="Vue d'ensemble et statistiques de l'association">
      {loading ? (
        <Spinner />
      ) : (
        <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
          
          {/* ---- KPIs Grid ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard
              title="Centres"
              value={stats?.nombre_centres ?? centres.length}
              gradientFrom="#008C45"
              gradientTo="#006b35"
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <StatCard
              title="Enseignants"
              value={stats?.nombre_enseignants ?? 0}
              gradientFrom="#171717"
              gradientTo="#383838"
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <StatCard
              title="Apprenants"
              value={stats?.nombre_apprenants ?? 0}
              gradientFrom="#008C45"
              gradientTo="#00A651"
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <StatCard
              title="Séances"
              value={stats?.nombre_seances_lecture ?? 0}
              gradientFrom="#171717"
              gradientTo="#2a2a2a"
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <StatCard
              title="Créneaux"
              value={stats?.nombre_creneaux ?? 0}
              gradientFrom="#008C45"
              gradientTo="#006b35"
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* ---- Chart & Info Grid ---- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="xl:col-span-2 bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
               {/* Ambient Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-[#008C45]/5 rounded-full blur-[100px] pointer-events-none" />
               <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Répartition des Apprenants</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1">Nombre d'apprenants inscrits par centre</p>
                </div>

                {chartData.length > 0 ? (
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#008C45" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#00A651" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="centre" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }} 
                          dy={15}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,140,69,0.05)' }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid rgba(255,255,255,0.5)', 
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(255,255,255,0.9)'
                          }}
                          itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                        />
                        <Bar 
                          dataKey="count" 
                          name="Apprenants" 
                          radius={[8, 8, 8, 8]}
                          fill="url(#colorCount)"
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-gray-400 font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    Aucune donnée disponible pour les graphiques
                  </div>
                )}
               </div>
            </div>

            {/* List Area */}
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Activité des Centres</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1">Vue détaillée par établissement</p>
                </div>
                <div className="bg-[#008C45]/10 text-[#008C45] px-4 py-1.5 rounded-full text-sm font-bold shadow-inner">
                  {centres.length}
                </div>
              </div>

              {centres.length > 0 ? (
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {centres.map((centre) => (
                    <div 
                      key={centre.id} 
                      className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#008C45]/30 transition-all duration-300 cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#171717] to-[#2a2a2a] text-white flex items-center justify-center text-lg font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                          {centre.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 group-hover:text-[#008C45] transition-colors">{centre.nom}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="text-xs font-medium text-gray-500">{centre.ville}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-[#008C45]">{centre.nombre_apprenants ?? 0}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Élèves</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
                  <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <p className="text-sm font-medium">Aucun centre enregistré pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

