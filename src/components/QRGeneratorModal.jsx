import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import {
  QrCode,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Users,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  CheckCheck,
  MapPin,
  Navigation,
  XCircle,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { joinAttendanceSession } from '../services/socket';

export default function QRGeneratorModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [section, setSection] = useState('CSE-A');
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [customRadius, setCustomRadius] = useState(50);
  const [sessionData, setSessionData] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [tokenCountdown, setTokenCountdown] = useState(15);
  const [attendees, setAttendees] = useState([]);
  const [latestScanNotification, setLatestScanNotification] = useState(null);
  const [flaggedList, setFlaggedList] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'qr', 'audit', 'geofence'
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationDismissTimeout, setNotificationDismissTimeout] = useState(null);

  const sessionIdRef = useRef(null);

  // 1. Fetch Classrooms list on mount
  useEffect(() => {
    async function loadClassrooms() {
      try {
        const res = await api.getClassrooms();
        if (res.data && res.data.length > 0) {
          setClassrooms(res.data);
          const cr12 = res.data.find((c) => c.name.includes('Classroom 12')) || res.data[0];
          setSelectedClassroomId(cr12._id);
          setSelectedClassroom(cr12);
          setCustomRadius(cr12.radiusMeters || 50);
        }
      } catch (err) {
        console.warn('Classroom fetch fallback:', err.message);
      }
    }
    loadClassrooms();
  }, []);

  // 2. Initialize or restart attendance session
  const initSession = async (classroomIdToUse) => {
    setLoading(true);
    try {
      const cr = classrooms.find((c) => c._id === classroomIdToUse) || selectedClassroom;
      const res = await api.startFacultySession({
        subjectCode: 'BTCS 301-18', // Data Structures
        section,
        room: cr?.name || 'Classroom 12',
        classroomId: cr?._id,
        classroomName: cr?.name || 'Classroom 12',
        radiusMeters: Number(customRadius) || 50,
      });

      if (res.data) {
        setSessionData(res.data);
        setSessionCode(res.data.sessionCode);
        sessionIdRef.current = res.data.sessionId;
        setTokenCountdown(res.data.ttlSeconds || 15);

        // Fetch persisted records for this session (Reconnection & Refresh support)
        loadLiveSessionRecords(res.data.sessionId);
      }
    } catch (err) {
      console.warn('Could not initialize backend session:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    initSession(selectedClassroomId);
  }, [isOpen, section]);

  // Load persisted session records from DB
  const loadLiveSessionRecords = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await api.getFacultyLiveSession(sessionId);
      if (res.data && res.data.records) {
        setAttendees(res.data.records);
      }
    } catch (e) {
      console.warn('Failed to load live session records:', e.message);
    }
  };

  // 3. Rotate QR cryptographic token every 15 seconds
  useEffect(() => {
    if (!isOpen || !sessionData?.sessionId) return;

    const interval = setInterval(async () => {
      setTokenCountdown((prev) => {
        if (prev <= 1) {
          api
            .getFacultySessionToken(sessionData.sessionId)
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

  // 4. Subscribe to live WebSocket attendance & scan events
  useEffect(() => {
    if (!isOpen || !sessionData?.sessionId) return;

    const sessionId = sessionData.sessionId;

    const unsubscribe = joinAttendanceSession(
      sessionId,
      // onAttendanceRecorded
      (data) => {
        const studentInfo = data?.student || data;
        if (studentInfo) {
          setAttendees((prev) => {
            const exists = prev.some(
              (a) => (a.student?.id || a.student?._id || a.id) === (studentInfo.id || studentInfo._id)
            );
            if (exists) return prev;
            return [studentInfo, ...prev];
          });
        }
      },
      // onScanReceived (Dedicated rich notification payload)
      (notificationData) => {
        if (notificationData) {
          setLatestScanNotification(notificationData);

          // Also prepend/update in attendees table
          setAttendees((prev) => {
            const studentId = notificationData.student?.id;
            const filtered = prev.filter(
              (a) => (a.student?.id || a.student?._id || a.id) !== studentId
            );
            return [notificationData, ...filtered];
          });

          // Play subtle sound or auto-dismiss preview notification after 8 seconds
          if (notificationDismissTimeout) clearTimeout(notificationDismissTimeout);
          const t = setTimeout(() => {
            setLatestScanNotification(null);
          }, 8000);
          setNotificationDismissTimeout(t);
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
      if (notificationDismissTimeout) clearTimeout(notificationDismissTimeout);
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
    if (activeTab === 'audit' && sessionData?.sessionId) {
      loadFlagged();
    }
  }, [activeTab, sessionData?.sessionId]);

  const handleOverride = async (recordId, newStatus) => {
    try {
      await api.overrideAttendance(recordId, newStatus, 'Verified in-person by faculty instructor override');
      await loadLiveSessionRecords(sessionData?.sessionId);
      await loadFlagged();
      alert(`Attendance record updated to ${newStatus}`);
    } catch (e) {
      alert(e.message || 'Failed to update record');
    }
  };

  const handleClassroomChange = async (e) => {
    const cid = e.target.value;
    setSelectedClassroomId(cid);
    const cr = classrooms.find((c) => c._id === cid);
    setSelectedClassroom(cr);
    if (cr) {
      setCustomRadius(cr.radiusMeters || 50);
    }
    // Re-initialize session with new classroom geofence
    initSession(cid);
  };

  const handleUpdateRadius = async () => {
    if (!selectedClassroom) return;
    try {
      const res = await api.updateClassroomRadius(selectedClassroom._id, {
        radiusMeters: Number(customRadius),
      });
      alert(res.message || 'Geofence radius updated successfully!');
      initSession(selectedClassroom._id);
    } catch (err) {
      alert(err.message || 'Failed to update geofence');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presentCount = attendees.filter((a) => a.status === 'PRESENT' || a.verificationStatus === 'VERIFIED').length;
  const flaggedCount = attendees.filter((a) => a.verificationStatus === 'FLAGGED_FOR_REVIEW').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Classroom Attendance Command Center" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'live'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Live Attendance Feed ({attendees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Dynamic QR &amp; Challenge PIN</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              loadFlagged();
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Audit Queue ({flaggedCount || flaggedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('geofence')}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'geofence'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>Classroom Geofence</span>
          </button>
        </div>

        {/* Classroom Geofence & Session Banner */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <div>
              <span className="font-bold text-slate-800">{subject}</span>
              <span className="text-slate-500 ml-2">Section: {section}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <MapPin className="w-3 h-3 text-indigo-600" />
              Classroom:
            </span>
            <select
              value={selectedClassroomId}
              onChange={handleClassroomChange}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1 outline-none"
            >
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.radiusMeters || 50}m geofence)
                </option>
              ))}
            </select>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Radius: {sessionData?.configuredRadius || customRadius || 50}m
            </span>
          </div>
        </div>

        {/* REAL-TIME NOTIFICATION POPUP: Attendance Scan Received */}
        {latestScanNotification && (
          <div className="p-4 rounded-xl bg-indigo-950 text-white border-2 border-indigo-500 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-300">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Attendance scan received</span>
              </div>
              <button
                onClick={() => setLatestScanNotification(null)}
                className="text-indigo-400 hover:text-white text-xs font-semibold px-1"
              >
                &times; Dismiss
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
              <div>
                <span className="text-indigo-400 text-[11px] block">Student:</span>
                <span className="font-bold text-white text-sm">
                  {latestScanNotification.student?.name || 'Student'}
                </span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">Student ID:</span>
                <span className="font-mono font-bold text-white">
                  {latestScanNotification.student?.studentId || latestScanNotification.student?.rollNo || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">Classroom:</span>
                <span className="font-semibold text-white">
                  {latestScanNotification.classroom || 'Classroom 12'}
                </span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">Subject:</span>
                <span className="text-slate-200">{latestScanNotification.subject}</span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">Scan time:</span>
                <span className="font-mono text-slate-200">{latestScanNotification.scanTime}</span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">Location permission:</span>
                <span
                  className={`font-semibold ${
                    latestScanNotification.locationPermission === 'Granted' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {latestScanNotification.locationPermission}
                </span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">GPS accuracy:</span>
                <span className="font-mono text-slate-200">{latestScanNotification.gpsAccuracy}</span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">Distance from classroom:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {latestScanNotification.distanceFromClassroom}
                </span>
              </div>

              <div>
                <span className="text-indigo-400 text-[11px] block">Location verification:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] inline-block ${
                    latestScanNotification.locationStatus === 'WITHIN_RADIUS'
                      ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                      : 'bg-amber-900 text-amber-200 border border-amber-700'
                  }`}
                >
                  {latestScanNotification.locationVerification}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-800/80 flex items-center justify-between text-xs">
              <div className="text-[11px] text-indigo-300">
                <strong>Attendance status:</strong>{' '}
                <span
                  className={
                    latestScanNotification.verificationStatus === 'VERIFIED'
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {latestScanNotification.attendanceStatus}
                </span>
              </div>
              {latestScanNotification.flagReason && (
                <span className="text-amber-300 text-[11px]">Note: {latestScanNotification.flagReason}</span>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: LIVE ATTENDANCE TABLE */}
        {activeTab === 'live' && (
          <div className="space-y-3">
            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Scanned</span>
                <span className="text-lg font-bold text-slate-900">{attendees.length}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Verified in Geofence</span>
                <span className="text-lg font-bold text-emerald-700">{presentCount}</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Flagged for Audit</span>
                <span className="text-lg font-bold text-amber-700">{flaggedCount}</span>
              </div>
            </div>

            {/* Live Attendance Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Student Name &amp; ID</th>
                      <th className="py-2.5 px-3">Scan Time</th>
                      <th className="py-2.5 px-3">GPS Accuracy</th>
                      <th className="py-2.5 px-3">Distance</th>
                      <th className="py-2.5 px-3">Location Verification</th>
                      <th className="py-2.5 px-3">Attendance Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {attendees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                          Waiting for students to scan the live QR code in {selectedClassroom?.name || 'Classroom 12'}...
                        </td>
                      </tr>
                    ) : (
                      attendees.map((att, idx) => {
                        const studentName = att.student?.name || att.name || 'Student';
                        const studentId = att.student?.idNumber || att.student?.studentId || att.rollNo || 'N/A';
                        const isVerified =
                          att.verificationStatus === 'VERIFIED' ||
                          att.status === 'PRESENT' ||
                          att.locationStatus === 'WITHIN_RADIUS';
                        const dist = att.distanceMeters ?? att.clientGeo?.distanceMeters;
                        const acc = att.gpsAccuracyValue ?? att.clientGeo?.accuracyMeters;
                        const recordId = att.recordId || att.id || att._id;

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-medium text-slate-900">
                              <div>{studentName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{studentId}</div>
                            </td>

                            <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                              {att.scanTime || (att.verifiedAt ? new Date(att.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now')}
                            </td>

                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                              {acc != null ? `±${acc}m` : 'N/A'}
                            </td>

                            <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-800">
                              {dist != null ? `${dist}m` : 'N/A'}
                            </td>

                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
                                  isVerified
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Within radius</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>{att.locationVerification || 'Flagged for review'}</span>
                                  </>
                                )}
                              </span>
                            </td>

                            <td className="py-2 px-3">
                              <span
                                className={`font-semibold text-[11px] ${
                                  isVerified ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {isVerified ? 'Present' : 'Flagged for review'}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-right">
                              {!isVerified && recordId && (
                                <button
                                  onClick={() => handleOverride(recordId, 'VERIFIED')}
                                  className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition"
                                  title="Authoritatively override & mark Present"
                                >
                                  Verify
                                </button>
                              )}
                              {isVerified && (
                                <span className="text-[10px] text-emerald-600 font-semibold">Recorded</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROTATING QR & LIVE DISPLAY */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            {/* Dynamic QR Display */}
            <div className="mx-auto w-52 h-52 bg-white border-2 border-indigo-200 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center relative">
              <svg className="w-44 h-44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <div className="absolute bottom-1 right-2 bg-indigo-600 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
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
                  <KeyRound className="w-3 h-3" /> Classroom Challenge PIN
                </span>
                <span className="text-base font-mono font-bold tracking-wider text-amber-900">
                  {sessionData?.challengePin || '742'}
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>HMAC Dynamic Rotating Token + GPS Geofence Active</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>{attendees.length} Scans Received</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT QUEUE */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Students flagged due to out-of-radius distance, weak GPS accuracy, or denied permission. Teachers retain authoritative override.
            </div>

            {flaggedList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                No submissions currently flagged for manual audit.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
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
                      <strong>Audit Reason:</strong> {rec.flagReason || 'Distance or GPS accuracy anomaly'}
                    </div>

                    {rec.clientGeo?.distanceMeters != null && (
                      <div className="text-[11px] text-slate-600">
                        <strong>Distance:</strong> {rec.clientGeo.distanceMeters}m (Allowed Radius: {sessionData?.configuredRadius || 50}m)
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleOverride(rec._id, 'VERIFIED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Override &amp; Mark Present</span>
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

        {/* TAB 4: GEOFENCE CONFIGURATION */}
        {activeTab === 'geofence' && (
          <div className="space-y-4 p-2">
            <div className="text-xs text-slate-600">
              Configure classroom location coordinates, attendance boundary radius, and maximum acceptable GPS accuracy.
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Classroom</label>
                <select
                  value={selectedClassroomId}
                  onChange={handleClassroomChange}
                  className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 outline-none"
                >
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.building} ({c.lat}, {c.lng})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Allowed Attendance Radius (metres)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={customRadius}
                    onChange={(e) => setCustomRadius(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Recommended: 50m for standard lecture rooms</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Acceptable GPS Accuracy (metres)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={selectedClassroom?.maxAccuracyMeters || 35}
                    className="w-full text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg p-2 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tolerance threshold: 35m</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleUpdateRadius}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Save Classroom Geofence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
