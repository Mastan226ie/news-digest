import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, UserPlus, Trash2, ShieldAlert, Check, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function AdminPage() {
  const { user, status } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 6000);
  };
  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  };

  const fetchUsers = useCallback(async () => {
    if (!user?.email || user?.role !== "admin") return;
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/users?admin_email=${encodeURIComponent(user.email)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (status === "authenticated") fetchUsers();
    else if (status === "unauthenticated") setIsLoading(false);
  }, [status, fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!newEmail.trim() || !user?.email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: user.email, email: newEmail.trim().toLowerCase(), role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add user");
      showSuccess(data.message || `Successfully granted access to ${newEmail.trim().toLowerCase()}`);
      setNewEmail("");
      fetchUsers();
    } catch (err) {
      showError(err.message || "Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (email, role) => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/users/${encodeURIComponent(email)}/role`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: user.email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update role");
      showSuccess(data.message);
      fetchUsers();
    } catch (err) {
      showError(err.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async (email) => {
    if (!user?.email) return;
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/users/${encodeURIComponent(email)}?admin_email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to delete user");
      showSuccess(data.message);
      fetchUsers();
    } catch (err) {
      showError(err.message || "Failed to delete user");
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-theme-accent border-theme-border rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-3xl font-black text-theme-fg mb-4 uppercase tracking-tighter">Access Denied</h2>
        <p className="text-theme-muted mb-8 font-medium">You do not have permission to view the Admin Dashboard.</p>
        <Link to="/" className="px-6 py-3 bg-theme-accent text-theme-bg font-bold text-sm uppercase tracking-widest rounded-full transition-all hover:scale-105">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-fg font-sans selection:bg-theme-selection-bg pb-20">
      <header className="sticky top-0 z-30 bg-theme-bg/95 backdrop-blur-md border-b border-theme-border/80">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-8 h-8 text-theme-accent" />
                <h1 className="text-3xl font-black tracking-tighter text-theme-fg uppercase">Admin Panel</h1>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-bold text-theme-muted uppercase tracking-widest">User Management</span>
                <span className="w-1.5 h-1.5 rounded-full bg-theme-border" />
                <Link to="/" className="flex items-center gap-1.5 text-[10px] font-bold text-theme-muted hover:text-theme-fg uppercase tracking-widest transition-colors group">
                  <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                  Back to App
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-theme-card-bg rounded-xl border border-theme-border">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase text-theme-muted">Admin Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-500">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500/60 hover:text-red-500 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-green-500">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-500/60 hover:text-green-500 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add User Form */}
          <div className="lg:col-span-1">
            <div className="bg-theme-card-bg border border-theme-border rounded-3xl p-6 md:p-8 sticky top-32">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-theme-border/50">
                <UserPlus className="w-5 h-5 text-theme-accent" />
                <h2 className="text-lg font-black uppercase tracking-widest text-theme-fg">Add User</h2>
              </div>
              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com" required
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all text-theme-fg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-widest mb-2">Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all text-theme-fg cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-theme-accent text-theme-bg font-bold text-sm uppercase tracking-widest rounded-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-theme-bg/40 border-t-theme-bg rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : "Grant Access"}
                </button>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-theme-card-bg border border-theme-border rounded-3xl overflow-hidden">
              <div className="p-6 md:p-8 border-b border-theme-border/50 flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-widest text-theme-fg">Authorized Users</h2>
                <span className="px-3 py-1 bg-theme-bg rounded-full text-xs font-bold text-theme-muted">{users.length} Total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-theme-bg/50 text-xs font-bold text-theme-muted uppercase tracking-widest">
                      <th className="p-4 pl-6 md:pl-8 border-b border-theme-border/50 font-semibold">User</th>
                      <th className="p-4 border-b border-theme-border/50 font-semibold text-center">Role</th>
                      <th className="p-4 border-b border-theme-border/50 font-semibold text-center">Joined</th>
                      <th className="p-4 pr-6 md:pr-8 border-b border-theme-border/50 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map((u) => (
                      <tr key={u.email} className="border-b border-theme-border/30 hover:bg-theme-bg/30 transition-colors">
                        <td className="p-4 pl-6 md:pl-8">
                          <div className="font-bold text-theme-fg break-all">{u.email}</div>
                          {u.email === user?.email && (
                            <span className="text-[10px] font-bold text-theme-accent uppercase tracking-widest mt-1 block">You</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${u.role === "admin" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-theme-bg border border-theme-border text-theme-muted"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-center text-theme-muted text-xs font-medium">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 pr-6 md:pr-8 text-right space-x-2 whitespace-nowrap">
                          {u.email !== user?.email && (
                            <>
                              <button
                                onClick={() => handleUpdateRole(u.email, u.role === "admin" ? "user" : "admin")}
                                className="text-xs font-bold text-theme-muted hover:text-theme-fg uppercase tracking-widest transition-colors px-2 py-1 cursor-pointer"
                              >
                                Make {u.role === "admin" ? "User" : "Admin"}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.email)}
                                className="p-1.5 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors inline-block align-middle cursor-pointer"
                                title="Revoke Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-theme-muted font-medium">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
