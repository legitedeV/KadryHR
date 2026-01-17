"use client";

import { useEffect, useState } from "react";
import {
  apiGetOrganisationMembers,
  apiUpdateMemberRole,
  apiCreateUser,
  apiDeleteUser,
  OrganisationMember,
  UserRole,
  ManagedUserRole,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";

export default function ZespolPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganisationMember | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "EMPLOYEE" as ManagedUserRole,
  });

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      const data = await apiGetOrganisationMembers();
      setMembers(data);
    } catch (error) {
      pushToast({
        type: "error",
        message: "Nie udało się pobrać listy członków zespołu",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteUser() {
    try {
      await apiCreateUser(inviteForm);
      pushToast({
        type: "success",
        message: "Użytkownik został zaproszony",
      });
      setShowInviteModal(false);
      setInviteForm({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        role: "EMPLOYEE",
      });
      loadMembers();
    } catch (error) {
      pushToast({
        type: "error",
        message: "Nie udało się zaprosić użytkownika",
      });
    }
  }

  async function handleChangeRole(memberId: string, newRole: ManagedUserRole) {
    try {
      await apiUpdateMemberRole(memberId, { role: newRole });
      pushToast({
        type: "success",
        message: "Rola została zmieniona",
      });
      setShowRoleModal(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error) {
      pushToast({
        type: "error",
        message: "Nie udało się zmienić roli",
      });
    }
  }

  async function handleDeleteUser(memberId: string) {
    try {
      await apiDeleteUser(memberId);
      pushToast({
        type: "success",
        message: "Użytkownik został usunięty",
      });
      setShowDeleteModal(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error) {
      pushToast({
        type: "error",
        message: "Nie udało się usunąć użytkownika",
      });
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const isOwner = user?.role === "OWNER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">Zarządzanie zespołem</h1>
            <p className="text-sm text-surface-400 mt-1">
              Zarządzaj członkami organizacji i ich rolami
            </p>
          </div>
          {(isOwner || user?.role === "ADMIN") && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary px-4 py-2"
            >
              + Zaproś użytkownika
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Szukaj po e-mail lub nazwisku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="panel-input w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
            className="panel-input"
          >
            <option value="ALL">Wszystkie role</option>
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      <div className="panel-card p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-sm text-surface-400">Ładowanie członków...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-surface-400">Brak członków zespołu spełniających kryteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl border border-surface-800/60 bg-surface-950/40 hover:bg-surface-900/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-900/50 to-brand-800/50 flex items-center justify-center text-brand-200 font-semibold">
                    {member.firstName?.[0] || member.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-surface-50">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-sm text-surface-400">{member.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        member.role === "OWNER" ? "bg-brand-900/30 text-brand-300" :
                        member.role === "ADMIN" ? "bg-accent-900/30 text-accent-300" :
                        member.role === "MANAGER" ? "bg-blue-900/30 text-blue-300" :
                        "bg-surface-800/30 text-surface-300"
                      }`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-surface-500">
                        Dołączył: {new Date(member.createdAt).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                  </div>
                </div>
                {isOwner && member.role !== "OWNER" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setShowRoleModal(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-surface-700/70 text-surface-300 hover:bg-surface-800/70 hover:text-surface-100 transition-colors"
                    >
                      Zmień rolę
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setShowDeleteModal(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-800/70 text-red-300 hover:bg-red-900/70 hover:text-red-100 transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-50 mb-4">Zaproś nowego użytkownika</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="panel-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Imię
                </label>
                <input
                  type="text"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  className="panel-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Nazwisko
                </label>
                <input
                  type="text"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  className="panel-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Hasło tymczasowe *
                </label>
                <input
                  type="password"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  className="panel-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Rola *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as ManagedUserRole })}
                  className="panel-input w-full"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleInviteUser}
                className="btn-primary px-4 py-2 flex-1"
                disabled={!inviteForm.email || !inviteForm.password}
              >
                Zaproś
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-50 mb-4">Zmień rolę użytkownika</h2>
            <p className="text-sm text-surface-400 mb-4">
              Użytkownik: {selectedMember.firstName} {selectedMember.lastName} ({selectedMember.email})
            </p>
            <div className="space-y-2">
              {(["EMPLOYEE", "MANAGER", "ADMIN"] as ManagedUserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleChangeRole(selectedMember.id, role)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                    selectedMember.role === role
                      ? "border-brand-700 bg-brand-900/30 text-brand-200"
                      : "border-surface-800/60 bg-surface-950/40 text-surface-300 hover:bg-surface-900/40"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="btn-secondary px-4 py-2 w-full"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-50 mb-4">Usuń użytkownika</h2>
            <p className="text-sm text-surface-400 mb-4">
              Czy na pewno chcesz usunąć użytkownika {selectedMember.firstName} {selectedMember.lastName} ({selectedMember.email})?
            </p>
            <p className="text-sm text-red-400 mb-4">
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handleDeleteUser(selectedMember.id)}
                className="px-4 py-2 flex-1 rounded-xl bg-red-900/30 text-red-200 border border-red-800/60 hover:bg-red-900/50 transition-colors"
              >
                Usuń
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
