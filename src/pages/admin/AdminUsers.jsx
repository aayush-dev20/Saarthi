import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Check,
  Edit2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers(`search=${encodeURIComponent(search)}&role=${roleFilter}`);
      const list = res.data?.users || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setUsers(list);
    } catch (err) {
      console.warn('Failed to fetch admin users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await api.getAdminPendingUsers();
      setPendingUsers(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch pending users:', err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, [search, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      setMessage({ type: 'success', text: `User role successfully updated to ${newRole}` });
      await fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update role' });
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.approveAdminUser(userId, 'Verified by Academic Administration');
      setMessage({ type: 'success', text: 'Registration approved! Account is now active.' });
      await fetchPendingUsers();
      await fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve account' });
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.rejectAdminUser(userId, 'Record does not match official college enrollment');
      setMessage({ type: 'success', text: 'Registration rejected.' });
      await fetchPendingUsers();
      await fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to reject account' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {message && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Institutional RBAC & Enrolment Approval</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional User & Role Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Govern authorizations across students, faculty, system administrators, transport managers, and hostel wardens. Authorize pending registrations in compliance with institutional policy.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Users Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals ({pendingUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: Active Directory */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-72 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-800 w-full"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Role Filter:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
                <option value="transport_manager">Transport Manager</option>
                <option value="hostel_warden">Hostel Warden</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">User ID</th>
                  <th className="py-3.5 px-4">Name & Email</th>
                  <th className="py-3.5 px-4">Department / Program</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Assigned Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-900">
                      {u.idNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{u.department}</div>
                      {u.designation && <div className="text-[10px] text-slate-400">{u.designation}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        u.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Administrator</option>
                        <option value="transport_manager">Transport Manager</option>
                        <option value="hostel_warden">Hostel Warden</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Pending Registrations Approval Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <h3 className="font-semibold text-slate-700">No Pending Registration Requests</h3>
              <p className="text-xs text-slate-400 mt-1">All teacher registrations and external student accounts have been reviewed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((pu) => (
                <div
                  key={pu._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{pu.name}</h3>
                      <div className="text-[11px] font-mono text-slate-400">{pu.idNumber} • {pu.email}</div>
                    </div>
                    <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {pu.role} Registration
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div><span className="text-slate-500">Department:</span> <strong>{pu.department}</strong></div>
                    {pu.designation && <div><span className="text-slate-500">Designation:</span> <strong>{pu.designation}</strong></div>}
                    {pu.subjectsTaught?.length > 0 && (
                      <div><span className="text-slate-500">Requested Subjects:</span> <strong className="font-mono text-indigo-700">{pu.subjectsTaught.join(', ')}</strong></div>
                    )}
                    <div><span className="text-slate-500">Phone:</span> {pu.phone || 'N/A'}</div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(pu._id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Account</span>
                    </button>
                    <button
                      onClick={() => handleReject(pu._id)}
                      className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
