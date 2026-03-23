import React, { useState, useEffect, useCallback } from 'react';
import { Shield, ShieldOff, Ban, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { SquigglyLine } from '../../components/DoodleDecorations';

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : '';

interface User {
  uid: string;
  email: string;
  display_name: string;
  role: 'admin' | 'user';
  disabled: boolean;
  created_at: string;
}

export function AdminUsersPage() {
  const { user } = useAuth();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  };

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleRole = async (uid: string, currentRole: string) => {
    if (!confirm("Are you sure you want to change this user's role?")) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await fetch(`${API_BASE}/api/admin/users/${uid}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRole }),
      });
      await loadUsers();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const toggleDisabled = async (uid: string, currentlyDisabled: boolean) => {
    if (!confirm("Are you sure you want to change this user's access status?")) return;
    try {
      await fetch(`${API_BASE}/api/admin/users/${uid}/disable`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ disabled: !currentlyDisabled }),
      });
      await loadUsers();
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            User Management
          </h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#DC2626]" />
        </div>
      </div>

      <HandDrawnCard rotate="none" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAF8] border-b-2 border-[#1A1A1A]">
                <th className="p-4 font-heading font-bold text-lg">User</th>
                <th className="p-4 font-heading font-bold text-lg">Role</th>
                <th className="p-4 font-heading font-bold text-lg">Status</th>
                <th className="p-4 font-heading font-bold text-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.uid}
                  className={`border-b-2 border-[#1A1A1A] last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center font-bold hand-drawn-border shrink-0">
                        {(u.display_name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{u.display_name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-[#1A1A1A] hand-drawn-border-pill ${u.role === 'admin' ? 'bg-[#DC2626]/20 text-[#DC2626]' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {u.role === 'admin' && <Shield size={12} />}
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-bold border-2 border-[#1A1A1A] hand-drawn-border-pill ${!u.disabled ? 'bg-[#10B981]/20 text-[#047857]' : 'bg-gray-800 text-white'}`}
                    >
                      {u.disabled ? 'DISABLED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleRole(u.uid, u.role)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border"
                        title={u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      >
                        {u.role === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                      </button>
                      <button
                        onClick={() => toggleDisabled(u.uid, u.disabled)}
                        className={`p-2 rounded-full transition-colors border-2 border-transparent hand-drawn-border ${!u.disabled ? 'hover:bg-red-100 text-[#DC2626] hover:border-[#DC2626]' : 'hover:bg-green-100 text-[#10B981] hover:border-[#10B981]'}`}
                        title={!u.disabled ? 'Disable User' : 'Enable User'}
                      >
                        <Ban size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </HandDrawnCard>
    </div>
  );
}
export default AdminUsersPage;
