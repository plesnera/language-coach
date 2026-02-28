import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface User {
  uid: string;
  email: string;
  display_name: string;
  role: string;
  disabled: boolean;
  created_at: string;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${user?.token}`,
      "Content-Type": "application/json",
    }),
    [user?.token],
  );

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      headers: headers(),
    });
    if (res.ok) setUsers(await res.json());
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (uid: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await fetch(`${API_BASE}/api/admin/users/${uid}/role`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ role: newRole }),
    });
    load();
  };

  const toggleDisable = async (uid: string, currentlyDisabled: boolean) => {
    await fetch(`${API_BASE}/api/admin/users/${uid}/disable`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ disabled: !currentlyDisabled }),
    });
    load();
  };

  return (
    <div className="admin-page">
      <h1>Users</h1>
      <p style={{ color: "#5f6368", fontSize: "0.85rem", marginBottom: "1rem" }}>
        {users.length} user(s)
      </p>

      {users.length === 0 ? (
        <p className="admin-empty">No users yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>{u.email}</td>
                <td>{u.display_name}</td>
                <td>
                  <span
                    style={{
                      background: u.role === "admin" ? "#e8f5e9" : "#f1f3f4",
                      color: u.role === "admin" ? "#1b5e20" : "#5f6368",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  {u.disabled ? (
                    <span style={{ color: "#d93025" }}>Disabled</span>
                  ) : (
                    <span style={{ color: "#1e8e3e" }}>Active</span>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button
                    className="admin-btn small"
                    onClick={() => toggleRole(u.uid, u.role)}
                  >
                    {u.role === "admin" ? "Demote" : "Promote"}
                  </button>{" "}
                  <button
                    className={`admin-btn small ${u.disabled ? "" : "danger"}`}
                    onClick={() => toggleDisable(u.uid, u.disabled)}
                  >
                    {u.disabled ? "Enable" : "Disable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsersPage;
