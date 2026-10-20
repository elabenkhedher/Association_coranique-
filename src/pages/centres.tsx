import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import {
  getCentres,
  createCentre,
  updateCentre,
  deleteCentre,
  getCentreStatistiques,
} from "@/services/api";
import { Centre, CentreStatistiques } from "@/types";
import Layout, { Spinner } from "@/components/Layout";

type ModalMode = "add" | "edit" | "stats" | "delete" | null;

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function CentresPage() {
  const router = useRouter();

  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [centreStats, setCentreStats] = useState<CentreStatistiques | null>(null);

  const [formNom, setFormNom] = useState("");
  const [formAdresse, setFormAdresse] = useState("");
  const [formVille, setFormVille] = useState("");
  const [formTelephone, setFormTelephone] = useState("");

  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    fetchCentres();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchCentres() {
    try {
      const data = await getCentres();
      setCentres(data);
    } catch { /* intercepteur gère le 401 */ }
    finally { setLoading(false); }
  }

  function openAdd() {
    setFormNom(""); setFormAdresse(""); setFormVille(""); setFormTelephone("");
    setSelectedCentre(null);
    setModalMode("add");
  }

  function openEdit(centre: Centre) {
    setFormNom(centre.nom); setFormAdresse(centre.adresse);
    setFormVille(centre.ville); setFormTelephone(centre.telephone ?? "");
    setSelectedCentre(centre);
    setModalMode("edit");
  }

  function openDelete(centre: Centre) {
    setSelectedCentre(centre);
    setModalMode("delete");
  }

  async function openStats(centre: Centre) {
    setSelectedCentre(centre);
    setCentreStats(null);
    setModalMode("stats");
    try {
      const data = await getCentreStatistiques(centre.id);
      setCentreStats(data);
    } catch {
      setToast({ message: "Impossible de charger les statistiques.", type: "error" });
      setModalMode(null);
    }
  }

  function closeModal() {
    setModalMode(null);
    setSelectedCentre(null);
    setCentreStats(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    const payload = {
      nom: formNom, adresse: formAdresse,
      ville: formVille, telephone: formTelephone || undefined,
    };
    const isAdd = modalMode === "add";

    try {
      if (isAdd) {
        await createCentre(payload);
      } else if (selectedCentre) {
        await updateCentre(selectedCentre.id, payload);
      }
      const msg = isAdd ? "Centre ajouté avec succès." : "Centre modifié avec succès.";
      closeModal();
      setActionLoading(false);
      setTimeout(async () => {
        await fetchCentres();
        setTimeout(() => setToast({ message: msg, type: "success" }), 100);
      }, 100);
    } catch {
      setActionLoading(false);
      setToast({
        message: isAdd ? "Erreur lors de l'ajout." : "Erreur lors de la modification.",
        type: "error",
      });
    }
  }

  async function handleDelete() {
    if (!selectedCentre) return;
    setActionLoading(true);
    try {
      await deleteCentre(selectedCentre.id);
      closeModal();
      setActionLoading(false);
      setTimeout(async () => {
        await fetchCentres();
        setTimeout(() => setToast({ message: "Centre supprimé avec succès.", type: "success" }), 100);
      }, 100);
    } catch {
      setActionLoading(false);
      setToast({ message: "Erreur lors de la suppression.", type: "error" });
    }
  }

  return (
    <Layout title="Gestion des Centres" subtitle="Vue d'ensemble et administration des établissements">
      {loading ? (
        <Spinner />
      ) : (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="bg-[#008C45]/10 text-[#008C45] px-4 py-1.5 rounded-full text-sm font-bold shadow-inner">
                {centres.length} centre{centres.length !== 1 && "s"}
              </span>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Centre
            </button>
          </div>

          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Nom</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Ville</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs hidden md:table-cell">Adresse</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs hidden lg:table-cell">Téléphone</th>
                    <th className="text-right px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {centres.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          <p className="font-medium text-base text-gray-500">Aucun centre enregistré.</p>
                          <p className="text-sm mt-1">Cliquez sur &quot;Nouveau Centre&quot; pour commencer.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    centres.map((centre) => (
                      <tr key={centre.id} className="hover:bg-white transition-colors duration-200 group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008C45] to-[#006b35] flex items-center justify-center text-white text-base font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                              {centre.nom.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-[#008C45] transition-colors">{centre.nom}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-medium text-gray-600">{centre.ville}</td>
                        <td className="px-8 py-5 text-gray-500 hidden md:table-cell">{centre.adresse}</td>
                        <td className="px-8 py-5 font-medium text-gray-600 hidden lg:table-cell">{centre.telephone || "—"}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openStats(centre)} title="Statistiques" className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-[#171717] hover:text-white transition-all duration-200 shadow-sm">
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </button>
                            <button onClick={() => openEdit(centre)} title="Modifier" className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-[#1565C0] hover:bg-[#1565C0] hover:text-white transition-all duration-200 shadow-sm">
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => openDelete(centre)} title="Supprimer" className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 shadow-sm">
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* Modal Add / Edit */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-lg p-8 z-10 border border-white/40 transform transition-all">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{modalMode === "add" ? "Nouveau Centre" : "Modifier Centre"}</h3>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nom du centre <span className="text-red-500">*</span></label>
                <input required value={formNom} onChange={(e) => setFormNom(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: Centre Al-Firdaws" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Adresse <span className="text-red-500">*</span></label>
                  <input required value={formAdresse} onChange={(e) => setFormAdresse(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: 12 Rue de la Paix" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Ville <span className="text-red-500">*</span></label>
                  <input required value={formVille} onChange={(e) => setFormVille(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: Paris" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Téléphone</label>
                  <input value={formTelephone} onChange={(e) => setFormTelephone(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: 01 23 45 67 89" />
                </div>
              </div>
              <div className="flex gap-4 pt-4 mt-8">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 bg-gray-100/80 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">Annuler</button>
                <button type="submit" disabled={actionLoading} className="flex-1 px-6 py-4 bg-[#008C45] hover:bg-[#006b35] text-white font-bold rounded-2xl shadow-[0_8px_30px_rgba(0,140,69,0.3)] hover:shadow-[0_12px_40px_rgba(0,140,69,0.4)] disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (modalMode === "add" ? "Créer" : "Enregistrer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {modalMode === "delete" && selectedCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-sm p-8 z-10 text-center border border-white/40">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Supprimer !</h3>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">Confirmez-vous la suppression de <strong className="text-gray-900">{selectedCentre.nom}</strong> ? Cette action est définitive.</p>
            <div className="flex gap-4 cursor-pointer">
              <button onClick={closeModal} className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">Non</button>
              <button onClick={handleDelete} disabled={actionLoading} className="flex-1 px-4 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 transition-all flex justify-center gap-2 transform hover:-translate-y-1">
                {actionLoading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Oui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Stats */}
      {modalMode === "stats" && selectedCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md p-8 z-10 border border-white/40">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Statistiques</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{selectedCentre.nom}</p>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {centreStats ? (
              <div className="grid grid-cols-2 gap-4">
                <StatItem label="Enseignants" value={centreStats.nombre_enseignants} color="#1565C0" bgColor="#E3F2FD" />
                <StatItem label="Apprenants" value={centreStats.nombre_apprenants} color="#F9A825" bgColor="#FFF8E1" />
                <StatItem label="Créneaux" value={centreStats.nombre_creneaux} color="#E65100" bgColor="#FFF3E0" />
                <StatItem label="Séances" value={centreStats.nombre_seances} color="#6A1B9A" bgColor="#F3E5F5" />
                <div className="col-span-2 bg-gradient-to-r from-[#008C45] to-[#006b35] rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-[#008C45]/20 mt-2">
                  <span className="text-white/90 font-bold text-lg">Présidialité</span>
                  <span className="text-4xl font-black text-white">{centreStats.taux_presence}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-4 border-[#008C45]/20 border-t-[#008C45] rounded-full animate-spin" />
              </div>
            )}
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

function StatItem({ label, value, color, bgColor }: { label: string; value: number; color: string; bgColor: string }) {
  return (
    <div className="rounded-2xl p-5 border border-gray-50 flex flex-col justify-between" style={{ backgroundColor: bgColor }}>
      <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-tight">{label}</p>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

