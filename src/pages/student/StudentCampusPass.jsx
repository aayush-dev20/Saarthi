import React, { useState, useEffect } from 'react';
import {
  Bus,
  Home,
  QrCode,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

export default function StudentCampusPass() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Pass Form
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchCampusData = async () => {
    try {
      setLoading(true);
      const [routesRes, passesRes] = await Promise.all([
        api.getTransportRoutes(),
        api.getStudentOutingPasses(),
      ]);
      if (routesRes.data) setRoutes(routesRes.data);
      if (passesRes.data) setPasses(passesRes.data);
    } catch (err) {
      console.warn('Campus pass fetch fallback:', err.message);
      // Seed fallback
      setRoutes([
        {
          routeNumber: 'R-04',
          routeName: 'South Campus Shuttle (Hostel ↔ Tech Park ↔ City Center)',
          stops: [
            { stopName: 'Main Hostel Quad', scheduledTime: '07:45 AM' },
            { stopName: 'Academic Block B', scheduledTime: '08:05 AM' },
            { stopName: 'Central Library', scheduledTime: '08:15 AM' },
            { stopName: 'Tech Park Metro', scheduledTime: '08:35 AM' },
          ],
          isActive: true,
        },
      ]);
      setPasses([
        {
          _id: 'pass-101',
          destination: 'City Center Mall & Railway Station',
          purpose: 'Weekend Family Visit',
          departureDate: '2026-10-24T09:00:00.000Z',
          expectedReturnDate: '2026-10-25T18:00:00.000Z',
          wardenApproval: { status: 'APPROVED', approvedAt: '2026-10-20' },
          transportApproval: { status: 'APPROVED', busRoute: 'R-04' },
          status: 'ACTIVE_OUTSIDE',
          qrToken: 'OUT-S1001-TOKEN-998',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampusData();
  }, []);

  const handleCreatePass = async (e) => {
    e.preventDefault();
    if (!destination || !purpose || !departureDate || !expectedReturnDate) {
      alert('Please fill out all outing pass fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createOutingPass({
        destination,
        purpose,
        departureDate,
        expectedReturnDate,
        requestedBusRoute: selectedRoute || 'R-04',
      });
      setMessage({ type: 'success', text: 'Outing pass application submitted to Hostel Warden & Transport Desk.' });
      setRequestModalOpen(false);
      fetchCampusData();
      setDestination('');
      setPurpose('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit application.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Bus className="w-3.5 h-3.5 text-blue-600" />
            <span>Campus Mobility & Safety</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Transport & Hostel Gate Pass
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage your daily bus route schedules, request weekend gate-passes with warden approval, and access digital transit clearance QR tokens.
          </p>
        </div>

        <button
          onClick={() => setRequestModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply For Outing Pass</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid: Hostel Profile + Active Passes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Affiliation Profile */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Home className="w-4 h-4 text-indigo-600" />
              <span>Hostel Residence Status</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Block Assigned:</span>
                <span className="font-semibold text-slate-800">{user?.hostelBlock || 'Block B (Aryabhatta Hall)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room Number:</span>
                <span className="font-semibold text-slate-800">{user?.hostelRoomNumber || 'B-304 (Bed 2)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Curfew Roll-Call:</span>
                <span className="font-semibold text-slate-800">10:00 PM Daily</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Parent Emergency:</span>
                <span className="font-semibold text-slate-800">{user?.emergencyContact?.phone || '+91 98765 43210'}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Campus Security enforces synchronized gate check-in via digital QR verification before 10:00 PM.</span>
            </div>
          </div>

          {/* Assigned Bus Route */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Bus className="w-4 h-4 text-blue-600" />
              <span>Assigned Commuter Bus Route</span>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Route ID:</span>
                <span className="font-bold text-blue-900">R-04</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Designated Stop:</span>
                <span className="font-semibold text-slate-800">{user?.busStopName || 'Main Hostel Quad'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Morning Pickup:</span>
                <span className="font-semibold text-slate-800">07:45 AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Outing Pass History & Shuttle Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Outing Passes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">Recent Outing Pass Requests</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">{passes.length} Total Passes</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading outing records...</div>
            ) : passes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active or historical outing passes found. Click "Apply For Outing Pass" to generate one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {passes.map((pass) => (
                  <div key={pass._id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{pass.destination}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pass.status === 'APPROVED' || pass.status === 'ACTIVE_OUTSIDE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : pass.status === 'PENDING_WARDEN'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {pass.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Purpose: {pass.purpose}</div>
                      </div>

                      <div className="text-left sm:text-right text-[11px] text-slate-500 space-y-0.5">
                        <div className="flex items-center sm:justify-end gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Depart: {new Date(pass.departureDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center sm:justify-end gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Return: {new Date(pass.expectedReturnDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-[11px] text-slate-600">
                        <span>Warden: <strong className="text-slate-900">{pass.wardenApproval?.status || 'PENDING'}</strong></span>
                        <span>Transport Shuttle: <strong className="text-slate-900">{pass.transportApproval?.status || 'PENDING'}</strong></span>
                      </div>

                      {pass.qrToken && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-mono font-semibold">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{pass.qrToken}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campus Transit Stops Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm">Campus Transit Route Stops & Timings</h2>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {routes.map((rt) => (
                <div key={rt.routeNumber} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {rt.routeNumber}: {rt.routeName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {rt.stops?.map((stp, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        <div className="text-[10px] font-bold text-slate-400">Stop #{i + 1}</div>
                        <div className="font-semibold text-slate-800 truncate">{stp.stopName}</div>
                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">{stp.scheduledTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Outing Pass Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Apply for Campus Outing / Leave Pass"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreatePass} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Destination Address / City</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. City Central Station / Home Address"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Purpose of Visit</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Family Function / Medical Appointment"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Departure Date & Time</label>
              <input
                type="datetime-local"
                required
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Expected Return</label>
              <input
                type="datetime-local"
                required
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRequestModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
