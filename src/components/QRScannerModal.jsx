import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Camera,
  Hash,
  Loader2,
  KeyRound,
  ShieldAlert,
  MapPin,
  Navigation,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { api } from '../services/api';

export default function QRScannerModal({ isOpen, onClose, onAttendanceMarked }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'code'
  const [code, setCode] = useState('');
  const [challengePin, setChallengePin] = useState('');
  const [status, setStatus] = useState(null); // 'success', 'error', 'flagged'
  const [message, setMessage] = useState('');
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoPromptState, setGeoPromptState] = useState('ready'); // 'ready', 'acquiring', 'granted', 'denied'

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isMounted = true;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
          });
          if (isMounted) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err) {
        console.warn('Camera access unavailable or declined:', err.message);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  /**
   * Captures GPS location on-demand via the Browser Geolocation API.
   * Restricts capture to the moment of attendance check-in only (no background tracking).
   */
  const captureDeviceLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          permission: 'UNAVAILABLE',
          latitude: null,
          longitude: null,
          accuracy: null,
          locationTimestamp: Date.now(),
        });
        return;
      }

      setGeoPromptState('acquiring');

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoPromptState('granted');
          resolve({
            permission: 'GRANTED',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            locationTimestamp: pos.timestamp || Date.now(),
          });
        },
        (err) => {
          console.warn('Geolocation error / permission declined:', err.message);
          const perm = err.code === 1 ? 'DENIED' : err.code === 3 ? 'TIMEOUT' : 'UNAVAILABLE';
          setGeoPromptState('denied');
          resolve({
            permission: perm,
            latitude: null,
            longitude: null,
            accuracy: null,
            locationTimestamp: Date.now(),
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setStatus('error');
      setMessage('Please enter or scan the active rotating session code.');
      return;
    }

    setLoading(true);
    setStatus(null);
    setVerificationDetails(null);

    try {
      // 1. Capture one-time device location upon scanning
      const locationData = await captureDeviceLocation();

      // 2. Submit to backend API: POST /api/attendance/scan
      const payload = {
        qrToken: code.trim(),
        code: code.trim(),
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        locationTimestamp: locationData.locationTimestamp,
        locationPermission: locationData.permission,
        challengePin: challengePin.trim(),
      };

      const res = await api.scanAttendance(payload);

      if (res.data?.verificationStatus === 'FLAGGED_FOR_REVIEW') {
        setStatus('flagged');
        setMessage(res.message || 'Attendance logged for faculty review (Proximity check requires teacher confirmation).');
      } else {
        setStatus('success');
        setMessage(res.message || 'Attendance successfully verified within classroom boundary!');
      }

      setVerificationDetails(res.data);

      setTimeout(() => {
        if (onAttendanceMarked) onAttendanceMarked(res.data);
      }, 500);

      // Auto close modal if verified cleanly
      if (res.data?.verificationStatus === 'VERIFIED') {
        setTimeout(() => {
          setStatus(null);
          setCode('');
          setChallengePin('');
          setLoading(false);
          onClose();
        }, 2400);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.data?.message || err.message || 'Verification rejected: Invalid, expired, or duplicate session token.');
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        onClose();
      }}
      title="Classroom Attendance Check-In"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Method Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'code' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Rotating Passcode</span>
          </button>
        </div>

        {/* Location Privacy Notice */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <span className="font-semibold text-slate-800">GPS Classroom Verification:</span> Your device location is requested once upon check-in to verify you are within the designated classroom geofence. Background tracking is never used.
          </div>
        </div>

        {/* Status Alert Banner */}
        {status === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
            {verificationDetails && (
              <div className="text-[11px] text-emerald-700 bg-white/70 p-2 rounded-lg border border-emerald-100 space-y-0.5">
                <div><strong>Classroom:</strong> {verificationDetails.classroom || 'Classroom 12'}</div>
                {verificationDetails.distanceFromClassroom != null && (
                  <div>
                    <strong>Distance:</strong> {verificationDetails.distanceFromClassroom}m (Allowed Radius: {verificationDetails.configuredRadius || 50}m)
                  </div>
                )}
                {verificationDetails.gpsAccuracy != null && (
                  <div><strong>GPS Accuracy:</strong> &plusmn;{verificationDetails.gpsAccuracy}m</div>
                )}
                <div><strong>Live Status:</strong> Sent to teacher dashboard in real-time</div>
              </div>
            )}
          </div>
        )}

        {status === 'flagged' && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{message}</span>
            </div>
            {verificationDetails && (
              <div className="text-[11px] text-amber-800 bg-white/70 p-2 rounded-lg border border-amber-100 space-y-0.5">
                <div><strong>Status:</strong> Flagged for Teacher Audit</div>
                {verificationDetails.flagReason && (
                  <div><strong>Audit Reason:</strong> {verificationDetails.flagReason}</div>
                )}
                {verificationDetails.distanceFromClassroom != null && (
                  <div><strong>Reported Distance:</strong> {verificationDetails.distanceFromClassroom}m</div>
                )}
                <div className="text-slate-500 pt-0.5">The teacher can review and manually verify your attendance in their console.</div>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Camera Viewfinder */}
        {activeTab === 'camera' && (
          <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Box Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 border-2 border-indigo-400 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
              </div>
            </div>
            <div className="absolute bottom-2 inset-x-0 text-center text-[10px] text-white/80 font-medium">
              Point camera at rotating classroom display
            </div>
          </div>
        )}

        {/* Token and PIN Form */}
        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Rotating Session Token / Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MATH-8421 or Scanned Token"
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 py-2.5 px-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Teacher Live Classroom Challenge PIN (Anti-Proxy)</span>
            </label>
            <input
              type="text"
              maxLength={4}
              value={challengePin}
              onChange={(e) => setChallengePin(e.target.value)}
              placeholder="e.g. 742 (Announced or projected in classroom)"
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 py-2.5 px-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-center tracking-widest text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Acquiring GPS &amp; Verifying Location...</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>Verify Attendance with GPS Location</span>
              </span>
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}
