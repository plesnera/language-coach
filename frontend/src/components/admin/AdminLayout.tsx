import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../../styles/AdminLayout.scss";

const navItems = [
  { to: "/admin/courses", icon: "school", label: "Courses" },
  { to: "/admin/topics", icon: "forum", label: "Topics" },
  { to: "/admin/prompts", icon: "tune", label: "Prompts" },
  { to: "/admin/users", icon: "group", label: "Users" },
] as const;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <button className="admin-back" onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>
          Dashboard
        </button>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
