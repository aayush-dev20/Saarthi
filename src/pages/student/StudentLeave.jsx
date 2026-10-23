import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  Shield,
  MapPin,
  Phone,
  Info,
  Loader2,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentLeave() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-leaves'); // 'my-leaves' or 'apply'
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form state
  const [leaveType, setLeaveType] = useState('HOSTEL_LEAVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(user?.phone || '');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.getMyLeaves();
      if (res.data) {
        setLeaves(res.data);
      }
    } catch (err) {
      console.warn('Error fetching student leaves:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setNotification({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leaveType,
        startDate,
        endDate,
        reason,
        destinationAddress,
        emergencyContact,
      };

      const res = await api.applyLeave(payload);
      if (res.success) {
        setNotification({
          type: 'success',
          text: `Leave application ${res.data?.applicationNumber || ''} submitted successfully! Routed to ${res.data?.approvalRoute || 'Advisor'}.`,
        });
        setReason('');
        setStartDate('');
        setEndDate('');
        setDestinationAddress('');
        setActiveTab('my-leaves');
        await fetchLeaves();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to submit leave application',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      setCancellingId(id);
      await api.cancelLeave(id);
      setNotification({ type: 'success', text: 'Leave application cancelled successfully.' });
      await fetchLeaves();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to cancel application' });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official Leave Application Workflow</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Leave Applications & Gate Pass
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Submit formal leave applications for hostel night-outs, academic conferences, or medical reasons. Requests are routed automatically to authorized wardens and faculty with immutable audit trails.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('my-leaves')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'my-leaves'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            My Applications ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'apply'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            + Apply for Leave
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'apply' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-3xl">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            New Leave Application
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Ensure your destination and emergency contacts are valid. Falsification of records violates campus disciplinary code.
          </p>

          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Leave Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="HOSTEL_LEAVE">Hostel Overnight / Weekend Outing</option>
                  <option value="ACADEMIC_LEAVE">Academic Event / Paper Presentation</option>
                  <option value="MEDICAL_LEAVE">Medical Leave (Doctor Certificate)</option>
                  <option value="EMERGENCY_LEAVE">Family Emergency / Urgent Leave</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {leaveType === 'HOSTEL_LEAVE'
                    ? 'Routed directly to Hostel Warden.'
                    : 'Routed to Faculty Advisor & Department Head.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Departure Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Return Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Address During Leave
              </label>
              <input
                type="text"
                placeholder="e.g. Home address, City, or Hotel location"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Leave <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Provide specific details for institutional records..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('my-leaves')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* My Leaves List */
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading leave records...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No Leave Applications Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You have not submitted any leave applications yet. Click "Apply for Leave" above to generate a new gate pass request.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {leaves.map((l) => (
                <div
                  key={l._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {l.leaveType === 'HOSTEL_LEAVE' ? 'HST' : l.leaveType === 'MEDICAL_LEAVE' ? 'MED' : 'ACD'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{l.applicationNumber}</span>
                          <span className="text-[11px] font-semibold text-slate-500 font-mono">
                            • {l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Route: <span className="font-semibold text-slate-700">{l.approvalRoute}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(l.status)}
                      {l.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(l._id)}
                          disabled={cancellingId === l._id}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Duration</span>
                      <strong className="text-slate-700">
                        {new Date(l.startDate).toLocaleDateString()} &rarr; {new Date(l.endDate).toLocaleDateString()}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Destination</span>
                      <span className="text-slate-700 font-medium">
                        {l.destinationAddress || 'Local / In-Station'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Reason</span>
                      <span className="text-slate-700 font-medium line-clamp-1">{l.reason}</span>
                    </div>
                  </div>

                  {/* Review Notes if processed */}
                  {l.reviewNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-100/70 text-xs border border-slate-200/60 flex items-start gap-2">
                      <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Reviewer Notes: </span>
                        <span className="text-slate-600">{l.reviewNotes}</span>
                        {l.reviewedAt && (
                          <span className="text-slate-400 text-[10px] ml-2">
                            ({new Date(l.reviewedAt).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
