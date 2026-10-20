import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import StudentSidebar from './StudentSidebar';
import TeacherSidebar from './TeacherSidebar';
import AdminSidebar from './AdminSidebar';
import TransportSidebar from './TransportSidebar';
import HostelSidebar from './HostelSidebar';
import QRScannerModal from './QRScannerModal';
import QRGeneratorModal from './QRGeneratorModal';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const role = user?.role || 'student';
  const isStudent = role === 'student';

  const renderSidebar = () => {
    switch (role) {
      case 'faculty':
        return <TeacherSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case 'admin':
        return <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case 'transport_manager':
        return <TransportSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case 'hostel_warden':
        return <HostelSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      default:
        return <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar based on role */}
      {renderSidebar()}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onOpenQR={() => setQrModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ user }} />
        </main>
      </div>

      {/* QR Code Modals */}
      {isStudent ? (
        <QRScannerModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          onAttendanceMarked={() => {
            window.dispatchEvent(new Event('saarthi_attendance_updated'));
          }}
        />
      ) : (
        <QRGeneratorModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
}
