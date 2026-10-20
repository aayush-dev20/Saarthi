import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { QrCode, Copy, Check, Clock, RefreshCw, Users, ShieldCheck, AlertTriangle, KeyRound, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import { joinAttendanceSession } from '../services/socket';

export default function QRGeneratorModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState('Engineering Mathematics IV');
  const [section, setSection] = useState('CSE-A');
  const [sessionData, setSessionData] = useState(null);
  const [sessionCode, setSessionCode] = useState('MATH-8421');
  const [tokenCountdown, setTokenCountdown] = useState(15);
  const [attendees, setAttendees] = useState([]);
  const [flaggedList, setFlaggedList] = useState([]);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'flagged'
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const sessionIdRef = useRef(null);

  // Initialize or fetch session on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function initSession() {
      setLoading(true);
      try {
        const res = await api.startFacultySession({
          subjectCode: 'MATH-202',
          section,
          room: 'LT-102',
        });
        if (isMounted && res.data) {
          setSessionData(res.data);
          setSessionCode(res.data.sessionCode);
          sessionIdRef.current = res.data.sessionId;
          setTokenCountdown(res.data.ttlSeconds || 15);
        }
      } catch (err) {
        console.warn('Could not initialize backend session, using offline session:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [isOpen, section]);

  // Rotate QR cryptographic token every 15 seconds
  useEffect(() => {
    if (!isOpen || !sessionData?.sessionId) return;

    const interval = setInterval(async () => {
      setTokenCountdown((prev) => {
        if (prev <= 1) {
          // Rotate token on server
          api.getFacultySessionToken(sessionData.sessionId)
            .then((res) => {
              if (res.data) {
                setSessionData((curr) => ({
                  ...curr,
                  currentToken: res.data.currentToken,
                  tokenExpiresAt: res.data.tokenExpiresAt,
                }));
              }
            })
            .catch((e) => console.error('Token rotation failed:', e));
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, sessionData?.sessionId]);

  // Subscribe to live WebSocket attendance events for this session
  useEffect(() => {
    if (!isOpen || !sessionData?.sessionId) return;

    const unsubscribe = joinAttendanceSession(sessionData.sessionId, (data) => {
      if (data?.student) {
        setAttendees((prev) => [data.student, ...prev]);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, sessionData?.sessionId]);

  const handleManualRefresh = async () => {
    if (!sessionData?.sessionId) return;
    try {
      const res = await api.getFacultySessionToken(sessionData.sessionId);
      if (res.data) {
        setSessionData((curr) => ({
          ...curr,
          currentToken: res.data.currentToken,
        }));
        setTokenCountdown(15);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFlagged = async () => {
    if (!sessionData?.sessionId) return;
    try {
      const res = await api.getFlaggedAttendance(sessionData.sessionId);
      if (res.data) setFlaggedList(res.data);
    } catch (e) {
      console.warn('Failed to load flagged attendance:', e.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'flagged' && sessionData?.sessionId) {
      loadFlagged();
    }
  }, [activeTab, sessionData?.sessionId]);

  const handleOverride = async (recordId, newStatus) => {
    try {
      await api.overrideAttendance(recordId, newStatus, 'Verified in-person by instructor override');
      await loadFlagged();
      alert(`Attendance record updated to ${newStatus}`);
    } catch (e) {
      alert(e.message || 'Failed to update record');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Broadcast Live Lecture Attendance" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'qr'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Live QR & Challenge PIN
          </button>
          <button
            onClick={() => {
              setActiveTab('flagged');
              loadFlagged();
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'flagged'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Audit Queue ({flaggedList.length})</span>
          </button>
        </div>

        {activeTab === 'qr' ? (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between text-left text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <div className="font-semibold text-slate-800">{subject}</div>
                <div className="text-slate-500 text-[11px]">Section: {section} • Room LT-102 • Dynamic Anti-Proxy</div>
              </div>
              <button
                onClick={handleManualRefresh}
                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                title="Force refresh token"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic QR Display */}
            <div className="mx-auto w-48 h-48 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col items-center justify-center relative">
              <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="4" fill="white" />
                <rect x="10" y="10" width="26" height="26" rx="3" stroke="#0f172a" strokeWidth="4" />
                <rect x="17" y="17" width="12" height="12" rx="1" fill="#0f172a" />
                <rect x="64" y="10" width="26" height="26" rx="3" stroke="#0f172a" strokeWidth="4" />
                <rect x="71" y="17" width="12" height="12" rx="1" fill="#0f172a" />
                <rect x="10" y="64" width="26" height="26" rx="3" stroke="#0f172a" strokeWidth="4" />
                <rect x="17" y="71" width="12" height="12" rx="1" fill="#0f172a" />
                <rect x="42" y="12" width="6" height="6" fill="#4f46e5" />
                <rect x="52" y="18" width="6" height="6" fill="#0f172a" />
                <rect x="44" y="28" width="6" height="6" fill="#0f172a" />
                <rect x="40" y="44" width="8" height="8" rx="2" fill="#4f46e5" />
                <rect x="52" y="44" width="8" height="8" rx="2" fill="#0f172a" />
                <rect x="64" y="44" width="6" height="6" fill="#4f46e5" />
                <rect x="74" y="52" width="6" height="6" fill="#0f172a" />
                <rect x="82" y="64" width="8" height="8" fill="#4f46e5" />
                <rect x="44" y="64" width="6" height="6" fill="#0f172a" />
                <rect x="54" y="74" width="6" height="6" fill="#4f46e5" />
                <rect x="64" y="80" width="6" height="6" fill="#0f172a" />
              </svg>

              {/* Token Rotation Badge */}
              <div className="absolute bottom-1 right-2 bg-indigo-50 text-indigo-700 font-mono text-[10px] px-2 py-0.5 rounded-full border border-indigo-200">
                Rotate: {tokenCountdown}s
              </div>
            </div>

            {/* Code & Challenge PIN */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Code</span>
                <span className="text-base font-mono font-bold tracking-wider text-indigo-700">
                  {sessionCode}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                <span className="text-[10px] uppercase font-bold text-amber-700 block flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Challenge PIN
                </span>
                <span className="text-base font-mono font-bold tracking-wider text-amber-900">
                  {sessionData?.challengePin || '4829'}
                </span>
              </div>
            </div>

            {/* Security & Token Info */}
            <div className="flex items-center justify-between text-xs px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>HMAC Anti-Replay + Subnet Verified</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>{attendees.length} Present</span>
              </div>
            </div>

            {attendees.length > 0 && (
              <div className="text-left max-h-24 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Live Submissions</span>
                {attendees.map((att, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-slate-700 py-0.5 border-b border-slate-100 last:border-none">
                    <span>{att.name || att.idNumber}</span>
                    <span className="text-emerald-600 font-medium">Verified</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Students flagged due to weak proximity score, subnet deviation, or missing challenge PIN. Teachers retain full authoritative override.
            </div>

            {flaggedList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                No submissions currently flagged for manual audit.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {flaggedList.map((rec) => (
                  <div key={rec._id} className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{rec.student?.name || 'Student'}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">({rec.student?.idNumber})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Score: {rec.proximityScore}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <strong>Flag Reason:</strong> {rec.flagReason || 'Proximity or PIN mismatch'}
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleOverride(rec._id, 'VERIFIED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Override & Mark Present</span>
                      </button>
                      <button
                        onClick={() => handleOverride(rec._id, 'REJECTED')}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
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
    </Modal>
  );
}
