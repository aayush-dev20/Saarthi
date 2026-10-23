import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  QrCode,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  RefreshCw,
  Loader2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import QRCode from 'qrcode-generator';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentLibrary() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pass'); // 'pass', 'catalogue', 'my-loans'
  const [passData, setPassData] = useState(null);
  const [books, setBooks] = useState([]);
  const [myLoans, setMyLoans] = useState({ activeLoans: [], history: [], totalFineDue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [requestingPass, setRequestingPass] = useState(false);
  const [passPurpose, setPassPurpose] = useState('General Study & Reading');

  const fetchPass = async () => {
    try {
      const res = await api.getMyLibraryPass();
      if (res.data) setPassData(res.data.activePass);
    } catch (err) {
      console.warn('Could not fetch pass:', err.message);
    }
  };

  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      const res = await api.getLibraryBooks(params.toString());
      if (res.data) setBooks(res.data);
    } catch (err) {
      console.warn('Could not fetch books:', err.message);
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await api.getMyLibraryLoans();
      if (res.data) setMyLoans(res.data);
    } catch (err) {
      console.warn('Could not fetch loans:', err.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPass(), fetchBooks(), fetchLoans()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery, selectedCategory]);

  const handleRequestPass = async () => {
    setRequestingPass(true);
    try {
      const res = await api.requestLibraryPass({ purpose: passPurpose, durationHours: 24 });
      if (res.data) {
        setPassData(res.data);
      }
    } catch (err) {
      alert(err.message || 'Pass generation failed');
    } finally {
      setRequestingPass(false);
    }
  };

  // Helper to render QR code data URL
  const getQRCodeDataURL = (text) => {
    try {
      const qr = QRCode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createDataURL(4);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Campus Knowledge Centre & Digital Circulation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Digital Central Library Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Access the institutional book repository, manage your active loans and due dates, and generate an authenticated digital entry pass.
          </p>
        </div>

        {myLoans.totalFineDue > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Overdue Fine Balance: <strong>₹{myLoans.totalFineDue}</strong></span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pass')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeTab === 'pass'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Digital Library Pass</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogue')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeTab === 'catalogue'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Book Catalogue & Availability</span>
        </button>

        <button
          onClick={() => setActiveTab('my-loans')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeTab === 'my-loans'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>My Borrowed Books ({myLoans.activeLoans?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Digital Library Pass */}
      {activeTab === 'pass' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pass Card Display */}
          <div className="md:col-span-2 space-y-4">
            {passData ? (
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-700">
                {/* Background watermarks */}
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>

                <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      Official Digital Access Token
                    </span>
                    <h3 className="text-xl font-bold mt-1 tracking-tight">Central Library Entry Pass</h3>
                    <p className="text-xs text-indigo-200">Indo Global College of Engineering</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300">Status</span>
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {passData.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Student Name</span>
                      <strong className="text-white text-sm">{passData.studentName || user?.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Student Institutional ID</span>
                      <strong className="text-white font-mono">{passData.studentIdNumber || user?.idNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Pass Serial Number</span>
                      <strong className="text-indigo-300 font-mono">{passData.passNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Validity Window</span>
                      <strong className="text-emerald-300">
                        Until {new Date(passData.validUntil).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </strong>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
                    {passData.qrToken && (
                      <img
                        src={getQRCodeDataURL(passData.qrToken)}
                        alt="Library Pass QR Code"
                        className="w-36 h-36"
                      />
                    )}
                    <span className="text-[10px] text-slate-500 mt-2 font-mono text-center">
                      Scan at library barrier gate
                    </span>
                  </div>
                </div>

                {passData.checkInLogs?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Recent check-in: {new Date(passData.checkInLogs[passData.checkInLogs.length - 1].verifiedAt).toLocaleTimeString()}</span>
                    <span>Gate: {passData.checkInLogs[passData.checkInLogs.length - 1].location}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">No Active Library Pass</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You do not currently have an active 24-hour pass for the library reading rooms or book stacks. Generate one instantly below.
                </p>
                <button
                  onClick={handleRequestPass}
                  disabled={requestingPass}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  {requestingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  <span>Generate 24-Hour Digital Pass</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Pass Info Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">Library Access Policy</h4>
            <ul className="space-y-2.5 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Passes are valid for 24 continuous hours from issuance.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tokens are cryptographically signed on the server and verified at entry.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Standard undergraduate borrowing limit: 3 active books simultaneously.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Standard book loan duration is 14 days before overdue fines accrue.</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Pass Purpose</label>
              <input
                type="text"
                value={passPurpose}
                onChange={(e) => setPassPurpose(e.target.value)}
                placeholder="e.g. Project research, quiet study"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Book Catalogue */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          {/* Search bar & filter */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title, author name, or ISBN..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Academic Categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((b) => (
              <div key={b._id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {b.category}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      b.availableCopies > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {b.availableCopies > 0 ? `${b.availableCopies} Available` : 'All Checked Out'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{b.title}</h4>
                  <p className="text-xs text-slate-500">by {b.author}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>ISBN:</span>
                    <span className="font-mono text-slate-700">{b.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shelf Location:</span>
                    <strong className="text-slate-700">{b.shelfLocation}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Inventory:</span>
                    <span>{b.totalCopies} copies</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: My Borrowed Books */}
      {activeTab === 'my-loans' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">Active Book Borrowings</h3>
              <p className="text-xs text-slate-500">Books currently in your possession</p>
            </div>

            {myLoans.activeLoans?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                You have no active book loans. Visit the central library circulation desk to borrow physical books.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="p-3.5">Book Title & Author</th>
                    <th className="p-3.5">Issue Date</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myLoans.activeLoans?.map((l) => (
                    <tr key={l._id}>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{l.book?.title}</div>
                        <div className="text-[11px] text-slate-400">by {l.book?.author}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        {new Date(l.issueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-800">
                        {new Date(l.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        {l.fineAmount > 0 ? `₹${l.fineAmount}` : '₹0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
