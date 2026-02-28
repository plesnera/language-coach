import React, { useState } from 'react';
import { Users as UsersIcon, Shield, ShieldOff, Ban } from 'lucide-react';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { SquigglyLine } from '../../components/DoodleDecorations';
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  joinedAt: string;
}
const initialUsers: User[] = [
{
  id: '1',
  name: 'Admin User',
  email: 'admin@languagecoach.app',
  role: 'admin',
  status: 'active',
  joinedAt: '2026-01-15'
},
{
  id: '2',
  name: 'Sarah Jenkins',
  email: 'sarah.j@example.com',
  role: 'user',
  status: 'active',
  joinedAt: '2026-02-10'
},
{
  id: '3',
  name: 'Mike Chen',
  email: 'mike.c@example.com',
  role: 'user',
  status: 'active',
  joinedAt: '2026-02-12'
},
{
  id: '4',
  name: 'Spam Bot',
  email: 'spam@badactor.com',
  role: 'user',
  status: 'disabled',
  joinedAt: '2026-02-20'
}];

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const toggleRole = (id: string) => {
    if (confirm("Are you sure you want to change this user's role?")) {
      setUsers(
        users.map((u) => {
          if (u.id === id) {
            return {
              ...u,
              role: u.role === 'admin' ? 'user' : 'admin'
            };
          }
          return u;
        })
      );
    }
  };
  const toggleStatus = (id: string) => {
    if (confirm("Are you sure you want to change this user's access status?")) {
      setUsers(
        users.map((u) => {
          if (u.id === id) {
            return {
              ...u,
              status: u.status === 'active' ? 'disabled' : 'active'
            };
          }
          return u;
        })
      );
    }
  };
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
                <th className="p-4 font-heading font-bold text-lg">Joined</th>
                <th className="p-4 font-heading font-bold text-lg text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) =>
              <tr
                key={user.id}
                className={`border-b-2 border-[#1A1A1A] last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>

                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center font-bold hand-drawn-border shrink-0">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                    className={`
                      inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-[#1A1A1A] hand-drawn-border-pill
                      ${user.role === 'admin' ? 'bg-[#DC2626]/20 text-[#DC2626]' : 'bg-gray-200 text-gray-700'}
                    `}>

                      {user.role === 'admin' && <Shield size={12} />}
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                    className={`
                      inline-block px-2 py-1 text-xs font-bold border-2 border-[#1A1A1A] hand-drawn-border-pill
                      ${user.status === 'active' ? 'bg-[#10B981]/20 text-[#047857]' : 'bg-gray-800 text-white'}
                    `}>

                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{user.joinedAt}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                      onClick={() => toggleRole(user.id)}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border"
                      title={
                      user.role === 'admin' ? 'Remove Admin' : 'Make Admin'
                      }>

                        {user.role === 'admin' ?
                      <ShieldOff size={18} /> :

                      <Shield size={18} />
                      }
                      </button>
                      <button
                      onClick={() => toggleStatus(user.id)}
                      className={`p-2 rounded-full transition-colors border-2 border-transparent hand-drawn-border ${user.status === 'active' ? 'hover:bg-red-100 text-[#DC2626] hover:border-[#DC2626]' : 'hover:bg-green-100 text-[#10B981] hover:border-[#10B981]'}`}
                      title={
                      user.status === 'active' ?
                      'Disable User' :
                      'Enable User'
                      }>

                        <Ban size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </HandDrawnCard>
    </div>);

}
export default AdminUsersPage;
