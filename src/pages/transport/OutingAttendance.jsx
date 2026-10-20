import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Bus, CheckCircle2, XCircle, Search, QrCode } from 'lucide-react';
import { api } from '../../services/api';

export default function OutingAttendance() {
  const [manifest, setManifest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);

  const fetchManifest = async () => {
    try {
      setLoading(true);
      const res = await api.getOutingPassManifest();
      if (res.data) setManifest(res.data);
    } catch (err) {
      console.warn('Manifest fallback:', err.message);
      setManifest([
        {
          _id: 'p1',
          student: { name: 'Aayush Sharma', idNumber: 'S1001' },
          destination: 'City Center Mall & Railway Station',
          purpose: 'Weekend Family Visit',
          requestedBusRoute: 'R-04',
          wardenApproval: { status: 'APPROVED' },
          transportApproval: { status: 'PENDING' },
          departureDate: '2026-10-24T09:00:00.000Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, []);

  const handleUpdate = async (passId, status) => {
    try {
      await api.updateOutingPassTransport(passId, { status, busRoute: 'R-04' });
      setMessage({ type: 'success', text: `Passenger pass successfully set to ${status}` });
      fetchManifest();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update pass' });
    }
  };

  const filtered = manifest.filter((m) =>
    (m.student?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.student?.idNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold mb-2">
            <ClipboardCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Passenger Manifest & Clearances</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Weekend Outing Shuttle Manifest
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Verify student boarding clearances, seat reservations, and cross-check warden pass approvals before departure.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-medium">
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by student name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 w-full"
        />
      </div>

      {/* Manifest Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Loading passenger manifest...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">No pending shuttle passenger manifests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Warden Clearance</th>
                  <th className="py-3 px-4">Transport Seat Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.student?.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.student?.idNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{item.destination}</div>
                      <div className="text-[11px] text-slate-400">{item.purpose}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.wardenApproval?.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.wardenApproval?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.transportApproval?.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.transportApproval?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdate(item._id, 'APPROVED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Approve Seat
                      </button>
                      <button
                        onClick={() => handleUpdate(item._id, 'REJECTED')}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
