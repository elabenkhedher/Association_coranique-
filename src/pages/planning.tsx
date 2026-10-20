import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import {
  getPlanning,
  createPlanning,
  updatePlanning,
  deletePlanning,
  getUsers,
  getCentres,
} from "@/services/api";
import { Planning, User, Centre } from "@/types";
import Layout, { Spinner } from "@/components/Layout";

type TabFilter = "all" | "active" | "cancelled";
type ModalMode = "add" | null;

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function PlanningPage() {
  const router = useRouter();

  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [enseignants, setEnseignants] = useState<User[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // Add form
  const [formTitre, setFormTitre] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formHeureDebut, setFormHeureDebut] = useState("09:00");
  const [formHeureFin, setFormHeureFin] = useState("10:00");
  const [formEnseignant, setFormEnseignant] = useState<number | "">("");
  const [formCentre, setFormCentre] = useState<number | "">("");

  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    fetchData();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchData() {
    setLoading(true);
    try {
      const [plansData, usersData, centresData] = await Promise.all([
        getPlanning(),
        getUsers({ role: "enseignant" }),
        getCentres()
      ]);
      setPlannings(plansData);
      setEnseignants(usersData);
      setCentres(centresData);
      
      // Default selections for form
      if (usersData.length > 0) setFormEnseignant(usersData[0].id);
      if (centresData.length > 0) setFormCentre(centresData[0].id);
      
    } catch { /* Interceptor handles 401 */ }
    finally { setLoading(false); }
  }

  // ---- Filtered plannings ----
  const filteredPlannings = plannings.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return !p.est_annule;
    if (activeTab === "cancelled") return p.est_annule;
    return true;
  });

  // ---- Modal helpers ----
  function openAdd() {
    setFormTitre(""); 
    setFormDate(new Date().toISOString().split('T')[0]); 
    setFormHeureDebut("09:00"); 
    setFormHeureFin("10:00");
    if (enseignants.length > 0) setFormEnseignant(enseignants[0].id);
    if (centres.length > 0) setFormCentre(centres[0].id);
    setModalMode("add");
  }

  function closeModal() {
    setModalMode(null);
  }

  // ---- Handlers ----
  async function handleAddPlanning(e: FormEvent) {
    e.preventDefault();
    if (!formEnseignant || !formCentre || !formDate || !formHeureDebut || !formHeureFin) {
      setToast({ message: "Veuillez remplir tous les champs obligatoires.", type: "error" });
      return;
    }

    setActionLoading(true);
    try {
      await createPlanning({
        titre: formTitre || `Séance ${formDate}`,
        date: formDate,
        heure_debut: `${formHeureDebut}:00`,
        heure_fin: `${formHeureFin}:00`,
        enseignant: Number(formEnseignant),
        centre: Number(formCentre),
        est_annule: false,
      });
      closeModal();
      setActionLoading(false);
      setTimeout(async () => {
        const data = await getPlanning();
        setPlannings(data);
        setTimeout(() => setToast({ message: "Créneau ajouté avec succès.", type: "success" }), 100);
      }, 100);
    } catch (err: any) {
      setActionLoading(false);
      const errData = err.response?.data;
      if (errData && errData.conflit) {
         setToast({ message: "Conflit d'horaire pour cet enseignant.", type: "error" });
      } else {
         setToast({ message: "Erreur lors de la création du créneau.", type: "error" });
      }
    }
  }

  async function handleToggleStatus(planning: Planning) {
    setActionLoading(true);
    try {
      await updatePlanning(planning.id, { est_annule: !planning.est_annule });
      const data = await getPlanning();
      setPlannings(data);
      setToast({
        message: planning.est_annule ? "Créneau réactivé." : "Créneau annulé.",
        type: "success",
      });
    } catch {
      setToast({ message: "Erreur lors de la mise à jour.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) return;
    setActionLoading(true);
    try {
      await deletePlanning(id);
      const data = await getPlanning();
      setPlannings(data);
      setToast({ message: "Créneau supprimé.", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "active", label: "Maintenus" },
    { key: "cancelled", label: "Annulés" },
  ];

  return (
    <Layout title="Gestion du Planning" subtitle="Ajouter, modifier ou annuler des créneaux horaires">
      {loading ? (
        <Spinner />
      ) : (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            {/* Tabs */}
            <div className="flex gap-1.5 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeTab === tab.key
                      ? "bg-[#171717] text-white shadow-md transform scale-[1.02]"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.key === "all" ? plannings.length : 
                      tab.key === "active" ? plannings.filter(p => !p.est_annule).length :
                      plannings.filter(p => p.est_annule).length}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#008C45] hover:bg-[#006b35] text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-[#008C45]/20 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouveau créneau
            </button>
          </div>

          {/* Table */}
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Titre</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs hidden sm:table-cell">Date & Heure</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs hidden md:table-cell">Enseignant</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Centre</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Statut</th>
                    <th className="text-right px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {filteredPlannings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          <p className="font-medium text-base text-gray-500">Aucun créneau trouvé.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPlannings.map((planning) => (
                      <tr key={planning.id} className="hover:bg-white transition-colors duration-200 group">
                        <td className="px-8 py-5">
                          <span className={`font-bold transition-colors ${planning.est_annule ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-[#008C45]'}`}>
                            {planning.titre || "Sans titre"}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-medium text-gray-600 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             <span>{planning.date}</span>
                             <span className="text-gray-300 mx-1">|</span>
                             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             <span>{planning.heure_debut.substring(0,5)} - {planning.heure_fin.substring(0,5)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-gray-500 hidden md:table-cell">
                          {planning.enseignant_nom || `Enseignant #${planning.enseignant}`}
                        </td>
                        <td className="px-8 py-5 text-gray-800 font-medium">
                          {planning.centre_nom || `Centre #${planning.centre}`}
                        </td>
                        <td className="px-8 py-5">
                          {!planning.est_annule ? (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-[#008C45] bg-[#008C45]/10 px-3 py-1.5 rounded-xl border border-[#008C45]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#008C45] animate-pulse" />
                              Maintenu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Annulé
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Toggle Cancel */}
                            <button
                              onClick={() => handleToggleStatus(planning)}
                              disabled={actionLoading}
                              title={!planning.est_annule ? "Annuler le créneau" : "Réactiver le créneau"}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-sm transition-all duration-200 ${
                                !planning.est_annule
                                  ? "bg-gray-50 text-[#F9A825] hover:bg-[#F9A825] hover:text-white"
                                  : "bg-gray-50 text-[#008C45] hover:bg-[#008C45] hover:text-white"
                              }`}
                            >
                              {!planning.est_annule ? (
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(planning.id)}
                              disabled={actionLoading}
                              title="Supprimer définitivement"
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 shadow-sm"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Planning */}
      {modalMode === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-lg p-8 z-10 border border-white/40 transform transition-all">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Nouveau Créneau</h3>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddPlanning} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Titre</label>
                <input value={formTitre} onChange={(e) => setFormTitre(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: Séance mémorisation" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Enseignant <span className="text-red-500">*</span></label>
                   <select required value={formEnseignant} onChange={(e) => setFormEnseignant(e.target.value ? Number(e.target.value) : "")} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium appearance-none">
                     <option value="" disabled>Sélectionner...</option>
                     {enseignants.map(u => (
                        <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Centre <span className="text-red-500">*</span></label>
                   <select required value={formCentre} onChange={(e) => setFormCentre(e.target.value ? Number(e.target.value) : "")} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium appearance-none">
                     <option value="" disabled>Sélectionner...</option>
                     {centres.map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                     ))}
                   </select>
                 </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Date <span className="text-red-500">*</span></label>
                <input required type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Heure de début <span className="text-red-500">*</span></label>
                   <input required type="time" value={formHeureDebut} onChange={(e) => setFormHeureDebut(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Heure de fin <span className="text-red-500">*</span></label>
                   <input required type="time" value={formHeureFin} onChange={(e) => setFormHeureFin(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" />
                 </div>
              </div>
              <div className="flex gap-4 pt-4 mt-8">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 bg-gray-100/80 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">Annuler</button>
                <button type="submit" disabled={actionLoading} className="flex-1 px-6 py-4 bg-[#008C45] hover:bg-[#006b35] text-white font-bold rounded-2xl shadow-[0_8px_30px_rgba(0,140,69,0.3)] hover:shadow-[0_12px_40px_rgba(0,140,69,0.4)] disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md transform transition-all ${toast.type === "success" ? "bg-white border-l-4 border-[#008C45] text-gray-900" : "bg-white border-l-4 border-red-500 text-gray-900"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === "success" ? "bg-[#008C45]/10 text-[#008C45]" : "bg-red-50 text-red-500"}`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </Layout>
  );
}
