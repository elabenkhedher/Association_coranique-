import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import {
  getUsers,
  createUser,
  deactivateUser,
  activateUser,
  resetPassword,
} from "@/services/api";
import { User } from "@/types";
import Layout, { Spinner } from "@/components/Layout";

type TabFilter = "all" | "enseignant" | "apprenant";
type ModalMode = "add" | "reset" | null;

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function UtilisateursPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add form
  const [formEmail, setFormEmail] = useState("");
  const [formNom, setFormNom] = useState("");
  const [formPrenom, setFormPrenom] = useState("");
  const [formRole, setFormRole] = useState<"enseignant" | "apprenant">("enseignant");
  const [formPassword, setFormPassword] = useState("");

  // Reset password form
  const [newPassword, setNewPassword] = useState("");

  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    fetchUsers();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch { /* intercepteur gère le 401 */ }
    finally { setLoading(false); }
  }

  // ---- Filtered users ----
  const filteredUsers = users.filter((u) => {
    if (activeTab === "all") return true;
    return u.role === activeTab;
  });

  // ---- Modal helpers ----
  function openAdd() {
    setFormEmail(""); setFormNom(""); setFormPrenom("");
    setFormRole("enseignant"); setFormPassword("");
    setModalMode("add");
  }

  function openReset(user: User) {
    setSelectedUser(user);
    setNewPassword("");
    setModalMode("reset");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
  }

  // ---- Handlers ----
  async function handleAddUser(e: FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createUser({
        email: formEmail,
        nom: formNom,
        prenom: formPrenom,
        role: formRole,
        password: formPassword,
      });
      closeModal();
      setActionLoading(false);
      setTimeout(async () => {
        await fetchUsers();
        setTimeout(() => setToast({ message: "Utilisateur ajouté avec succès.", type: "success" }), 100);
      }, 100);
    } catch (err: unknown) {
      setActionLoading(false);
      const error = err as { response?: { data?: { email?: string[] } } };
      if (error.response?.data?.email) {
        setToast({ message: "Cet email est déjà utilisé.", type: "error" });
      } else {
        setToast({ message: "Erreur lors de la création.", type: "error" });
      }
    }
  }

  async function handleToggleActive(user: User) {
    setActionLoading(true);
    try {
      if (user.is_active) {
        await deactivateUser(user.id);
      } else {
        await activateUser(user.id);
      }
      await fetchUsers();
      setToast({
        message: user.is_active ? "Utilisateur désactivé." : "Utilisateur activé.",
        type: "success",
      });
    } catch {
      setToast({ message: "Erreur lors de la mise à jour.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await resetPassword(selectedUser.id, newPassword);
      closeModal();
      setActionLoading(false);
      setTimeout(() => setToast({ message: "Mot de passe réinitialisé.", type: "success" }), 100);
    } catch {
      setActionLoading(false);
      setToast({ message: "Erreur lors de la réinitialisation.", type: "error" });
    }
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "enseignant", label: "Enseignants" },
    { key: "apprenant", label: "Apprenants" },
  ];

  const roleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100/50 text-purple-700 shadow-sm border border-purple-200/50";
      case "enseignant": return "bg-blue-100/50 text-blue-700 shadow-sm border border-blue-200/50";
      case "apprenant": return "bg-[#FFF8E1]/50 text-[#F9A825] shadow-sm border border-[#FFE082]/50";
      default: return "bg-gray-100/50 text-gray-600 shadow-sm border border-gray-200/50";
    }
  };

  return (
    <Layout title="Gestion des Utilisateurs" subtitle="Administration et annuaire des membres">
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
                    {tab.key === "all" ? users.length : users.filter((u) => u.role === tab.key).length}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#008C45] hover:bg-[#006b35] text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-[#008C45]/20 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Nouvel Utilisateur
            </button>
          </div>

          {/* Table */}
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Utilisateur</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs hidden sm:table-cell">Prénom</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs hidden md:table-cell">Contact</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Rôle</th>
                    <th className="text-left px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Statut</th>
                    <th className="text-right px-8 py-5 font-bold text-gray-900 tracking-wide uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          <p className="font-medium text-base text-gray-500">Aucun utilisateur trouvé.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white transition-colors duration-200 group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#171717] to-gray-800 flex items-center justify-center text-white text-base font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                              {user.nom.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-[#008C45] transition-colors">{user.nom}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-medium text-gray-600 hidden sm:table-cell">{user.prenom}</td>
                        <td className="px-8 py-5 text-gray-500 hidden md:table-cell">{user.email}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${roleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {user.is_active !== false ? (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-[#008C45] bg-[#008C45]/10 px-3 py-1.5 rounded-xl border border-[#008C45]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#008C45] animate-pulse" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Inactif
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={actionLoading}
                              title={user.is_active !== false ? "Désactiver" : "Activer"}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-sm transition-all duration-200 ${
                                user.is_active !== false
                                  ? "bg-gray-50 text-red-500 hover:bg-red-500 hover:text-white"
                                  : "bg-gray-50 text-[#008C45] hover:bg-[#008C45] hover:text-white"
                              }`}
                            >
                              {user.is_active !== false ? (
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            {/* Reset password */}
                            <button
                              onClick={() => openReset(user)}
                              title="Réinitialiser mot de passe"
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-[#F9A825] hover:bg-[#F9A825] hover:text-white transition-all duration-200 shadow-sm"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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

      {/* Modal Add User */}
      {modalMode === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-lg p-8 z-10 border border-white/40 transform transition-all">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Nouvel Utilisateur</h3>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nom <span className="text-red-500">*</span></label>
                  <input required value={formNom} onChange={(e) => setFormNom(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: Ben Ahmed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Prénom <span className="text-red-500">*</span></label>
                  <input required value={formPrenom} onChange={(e) => setFormPrenom(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: Mohamed" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email <span className="text-red-500">*</span></label>
                <input required type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Ex: mohamed@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Rôle <span className="text-red-500">*</span></label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value as "enseignant" | "apprenant")} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium appearance-none">
                  <option value="enseignant">Enseignant</option>
                  <option value="apprenant">Apprenant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Mot de passe <span className="text-red-500">*</span></label>
                <input required type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all font-medium" placeholder="Minimum 8 caractères" minLength={8} />
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

      {/* Modal Reset Password */}
      {modalMode === "reset" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-sm p-8 z-10 border border-white/40">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F9A825]/10 flex items-center justify-center shadow-inner">
                <svg className="w-8 h-8 text-[#F9A825]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Réinitialiser</h3>
              <p className="text-sm font-medium text-gray-500 mt-2">{selectedUser.prenom} {selectedUser.nom}</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nouveau mot de passe <span className="text-red-500">*</span></label>
                <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#F9A825]/20 focus:border-[#F9A825] transition-all font-medium text-center" placeholder="Minimum 8 caractères" minLength={8} />
              </div>
              <div className="flex gap-4 pt-4 mt-6">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">Annuler</button>
                <button type="submit" disabled={actionLoading} className="flex-1 px-4 py-3.5 bg-[#F9A825] hover:bg-[#F57F17] text-white font-bold rounded-2xl shadow-lg shadow-[#F9A825]/30 flex justify-center gap-2 transform hover:-translate-y-1 transition-all">
                  {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Valider"}
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
