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
  GraduationCap,
  Briefcase,
  BookOpen,
  Filter,
  Home,
  Bus,
  Eye,
  X,
  Save,
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'teachers', 'pending', 'rbac'
  
  // Student directory state
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [hostelFilter, setHostelFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');

  // Teacher directory state
  const [teachers, setTeachers] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('all');

  // Pending queue state
  const [pendingUsers, setPendingUsers] = useState([]);

  // RBAC state
  const [rbacUsers, setRbacUsers] = useState([]);

  // Loading & notification
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Profile modal / edit state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch Students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (studentSearch) params.append('search', studentSearch);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (semesterFilter !== 'all') params.append('semester', semesterFilter);
      if (hostelFilter !== 'all') params.append('hostel', hostelFilter);
      if (studentStatusFilter !== 'all') params.append('status', studentStatusFilter);

      const res = await api.getAdminStudents(params.toString());
      setStudents(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch admin students:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (teacherSearch) params.append('search', teacherSearch);
      if (deptFilter !== 'all') params.append('department', deptFilter);
      if (teacherStatusFilter !== 'all') params.append('status', teacherStatusFilter);

      const res = await api.getAdminTeachers(params.toString());
      setTeachers(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch admin teachers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pending
  const fetchPendingUsers = async () => {
    try {
      const res = await api.getAdminPendingUsers();
      setPendingUsers(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch pending users:', err.message);
    }
  };

  // Fetch RBAC Users
  const fetchRbacUsers = async () => {
    try {
      const res = await api.getAdminUsers('');
      const list = res.data?.users || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setRbacUsers(list);
    } catch (err) {
      console.warn('Failed to fetch rbac users:', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    else if (activeTab === 'teachers') fetchTeachers();
    else if (activeTab === 'pending') fetchPendingUsers();
    else if (activeTab === 'rbac') fetchRbacUsers();
  }, [activeTab, branchFilter, semesterFilter, hostelFilter, studentStatusFilter, deptFilter, teacherStatusFilter]);

  // Handle Search on enter or debounced
  const handleStudentSearch = (e) => {
    if (e.key === 'Enter') fetchStudents();
  };
  const handleTeacherSearch = (e) => {
    if (e.key === 'Enter') fetchTeachers();
  };

  // Open 360 Profile
  const handleOpenDetail = async (userId) => {
    try {
      setUserDetailLoading(true);
      setIsEditing(false);
      const res = await api.getAdminUserDetail(userId);
      setSelectedUser(res.data);
      setEditFormData({
        name: res.data.user.name,
        department: res.data.user.department || '',
        semester: res.data.user.semester || 1,
        section: res.data.user.section || 'A',
        designation: res.data.user.designation || '',
        status: res.data.user.status || 'active',
        rollNumber: res.data.user.rollNumber || '',
        phone: res.data.user.phone || '',
        hostelResident: res.data.user.hostelInfo?.isResident || false,
        hostelBlock: res.data.user.hostelInfo?.block || '',
        hostelRoom: res.data.user.hostelInfo?.roomNumber || '',
        hostelBed: res.data.user.hostelInfo?.bedNumber || '',
        busUser: res.data.user.transportInfo?.isBusUser || false,
        busRoute: res.data.user.transportInfo?.routeNumber || '',
      });
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to fetch user 360 profile' });
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Save profile edits
  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    try {
      setSavingEdit(true);
      const payload = {
        name: editFormData.name,
        department: editFormData.department,
        status: editFormData.status,
        phone: editFormData.phone,
      };

      if (selectedUser.user.role === 'student') {
        payload.semester = Number(editFormData.semester);
        payload.section = editFormData.section;
        payload.rollNumber = editFormData.rollNumber;
        payload.hostelInfo = {
          isResident: editFormData.hostelResident,
          block: editFormData.hostelBlock,
          roomNumber: editFormData.hostelRoom,
          bedNumber: editFormData.hostelBed,
        };
        payload.transportInfo = {
          isBusUser: editFormData.busUser,
          routeNumber: editFormData.busRoute,
        };
      } else if (selectedUser.user.role === 'faculty') {
        payload.designation = editFormData.designation;
      }

      await api.updateAdminUserProfile(selectedUser.user._id, payload);
      setNotification({ type: 'success', text: `Profile for ${editFormData.name} updated successfully (Audit Log recorded).` });
      setIsEditing(false);
      setSelectedUser(null);
      if (activeTab === 'students') fetchStudents();
      if (activeTab === 'teachers') fetchTeachers();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to update user profile' });
    } finally {
      setSavingEdit(false);
    }
  };

  // Role change for RBAC tab
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      setNotification({ type: 'success', text: `User role successfully updated to ${newRole}` });
      await fetchRbacUsers();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to update role' });
    }
  };

  // Pending queue approval / rejection
  const handleApprove = async (userId) => {
    try {
      await api.approveAdminUser(userId, 'Verified by Academic Administration');
      setNotification({ type: 'success', text: 'Registration approved! Account is now active.' });
      await fetchPendingUsers();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to approve account' });
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.rejectAdminUser(userId, 'Record does not match official college enrollment');
      setNotification({ type: 'success', text: 'Registration rejected.' });
      await fetchPendingUsers();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to reject account' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Institutional Records & Directory Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional User & Academic Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Search and manage official records across enrolled students and appointed faculty. Inspect 360° student academic histories, hostel allocations, and update authorized records in compliance with college policy.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap p-1 bg-white border border-slate-200 rounded-xl w-fit gap-1">
        <button
          onClick={() => setActiveTab('students')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Students Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'teachers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Faculty Directory</span>
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

        <button
          onClick={() => setActiveTab('rbac')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'rbac'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Role & RBAC Access</span>
        </button>
      </div>

      {/* TAB 1: STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[220px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, student ID, roll no, or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={handleStudentSearch}
                className="bg-transparent border-none outline-none text-xs text-slate-800 w-full"
              />
              <button
                onClick={fetchStudents}
                className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">All Branches</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
              </select>

              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
                <option value="7">Sem 7</option>
                <option value="8">Sem 8</option>
              </select>

              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">All Accommodation</option>
                <option value="resident">Hostel Resident</option>
                <option value="dayscholar">Day Scholar</option>
              </select>

              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading student records...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No students found matching current filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Student ID / Roll</th>
                    <th className="py-3.5 px-4">Name & Email</th>
                    <th className="py-3.5 px-4">Degree & Branch</th>
                    <th className="py-3.5 px-4 text-center">Attendance</th>
                    <th className="py-3.5 px-4 text-center">Est. CGPA</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {students.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div>{st.studentId}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Roll: {st.rollNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{st.officialEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{st.branch}</div>
                        <div className="text-[10px] text-slate-400">
                          Sem {st.semester} • Section {st.section}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold ${
                            st.attendanceRate >= 75
                              ? 'text-emerald-600'
                              : st.attendanceRate >= 65
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {st.attendanceRate}%
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {st.attendedSessions}/{st.totalSessions} sessions
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900">{st.cgpa > 0 ? st.cgpa.toFixed(2) : 'N/A'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            st.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(st._id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>360° Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FACULTY DIRECTORY */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[220px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teacher by name, faculty ID, or email..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                onKeyDown={handleTeacherSearch}
                className="bg-transparent border-none outline-none text-xs text-slate-800 w-full"
              />
              <button
                onClick={fetchTeachers}
                className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md"
              >
                Search
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
              </select>

              <select
                value={teacherStatusFilter}
                onChange={(e) => setTeacherStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading faculty records...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No teachers found matching current filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Faculty ID</th>
                    <th className="py-3.5 px-4">Name & Email</th>
                    <th className="py-3.5 px-4">Department & Designation</th>
                    <th className="py-3.5 px-4 text-center">Assigned Subjects</th>
                    <th className="py-3.5 px-4 text-center">Sessions Held</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {teachers.map((tc) => (
                    <tr key={tc._id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{tc.facultyId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{tc.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{tc.officialEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{tc.department}</div>
                        <div className="text-[10px] text-slate-400">{tc.designation}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {tc.assignedSubjectsCount} Courses
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {tc.sessionsConducted}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            tc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {tc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(tc._id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View / Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENDING APPROVALS QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <h3 className="font-semibold text-slate-700">No Pending Registration Requests</h3>
              <p className="text-xs text-slate-400 mt-1">
                All teacher registrations and external student accounts have been reviewed.
              </p>
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
                      <div className="text-[11px] font-mono text-slate-400">
                        {pu.idNumber} • {pu.email}
                      </div>
                    </div>
                    <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {pu.role} Registration
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div>
                      <span className="text-slate-500">Department:</span> <strong>{pu.department}</strong>
                    </div>
                    {pu.designation && (
                      <div>
                        <span className="text-slate-500">Designation:</span> <strong>{pu.designation}</strong>
                      </div>
                    )}
                    {pu.subjectsTaught?.length > 0 && (
                      <div>
                        <span className="text-slate-500">Requested Subjects:</span>{' '}
                        <strong className="font-mono text-indigo-700">{pu.subjectsTaught.join(', ')}</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Phone:</span> {pu.phone || 'N/A'}
                    </div>
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

      {/* TAB 4: RBAC DIRECTORY */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User ID</th>
                <th className="py-3.5 px-4">Name & Email</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">System Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {rbacUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-900">{u.idNumber}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{u.department}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
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
      )}

      {/* 360 PROFILE & EDIT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {selectedUser.user.role.toUpperCase()} 360° PROFILE
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedUser.user.name}</h2>
                <p className="text-xs text-slate-400 font-mono">
                  ID: {selectedUser.user.idNumber} • {selectedUser.user.email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingEdit}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Changes</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setIsEditing(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {isEditing ? (
                /* EDIT FORM */
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Note:</strong> All changes made here are validated on the server and committed to the immutable institutional Audit Log.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Official Phone</label>
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    {selectedUser.user.role === 'student' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">University Roll Number</label>
                          <input
                            type="text"
                            value={editFormData.rollNumber}
                            onChange={(e) => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Semester & Section</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="1"
                              max="8"
                              value={editFormData.semester}
                              onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                            />
                            <input
                              type="text"
                              value={editFormData.section}
                              onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                            <input
                              type="checkbox"
                              checked={editFormData.hostelResident}
                              onChange={(e) => setEditFormData({ ...editFormData, hostelResident: e.target.checked })}
                              className="rounded text-indigo-600"
                            />
                            <span>Hostel Accommodation Allocated</span>
                          </label>

                          {editFormData.hostelResident && (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Block (e.g. Block A)"
                                value={editFormData.hostelBlock}
                                onChange={(e) => setEditFormData({ ...editFormData, hostelBlock: e.target.value })}
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Room (e.g. 204)"
                                value={editFormData.hostelRoom}
                                onChange={(e) => setEditFormData({ ...editFormData, hostelRoom: e.target.value })}
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Bed (e.g. B-1)"
                                value={editFormData.hostelBed}
                                onChange={(e) => setEditFormData({ ...editFormData, hostelBed: e.target.value })}
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {selectedUser.user.role === 'faculty' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Designation</label>
                        <input
                          type="text"
                          value={editFormData.designation}
                          onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* READ-ONLY 360 VIEW */
                <div className="space-y-6">
                  {/* Institutional Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">College / Affiliation</span>
                      <strong className="text-slate-800 font-semibold">{selectedUser.user.college || 'Indo Global Colleges'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Department</span>
                      <strong className="text-slate-800 font-semibold">{selectedUser.user.department}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Official Status</span>
                      <strong className="text-emerald-700 font-semibold capitalize">{selectedUser.user.status}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Contact Phone</span>
                      <strong className="text-slate-800 font-semibold">{selectedUser.user.phone || 'N/A'}</strong>
                    </div>
                  </div>

                  {/* Student Specific Metrics */}
                  {selectedUser.user.role === 'student' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                            Attendance Verified
                          </span>
                          <span className="text-xl font-bold text-indigo-700">
                            {selectedUser.attendanceRate}%
                          </span>
                          <span className="text-[10px] text-indigo-400 block mt-0.5">
                            {selectedUser.attendedSessions}/{selectedUser.totalSessions} Sessions
                          </span>
                        </div>

                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                            Published Marks
                          </span>
                          <span className="text-xl font-bold text-emerald-700">
                            {selectedUser.recentMarks?.length || 0}
                          </span>
                          <span className="text-[10px] text-emerald-400 block mt-0.5">
                            Verified Assessments
                          </span>
                        </div>

                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">
                            Leave Requests
                          </span>
                          <span className="text-xl font-bold text-purple-700">
                            {selectedUser.leaveApplications?.length || 0}
                          </span>
                          <span className="text-[10px] text-purple-400 block mt-0.5">
                            Gate Passes Processed
                          </span>
                        </div>
                      </div>

                      {/* Hostel & Transport Allocation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Home className="w-4 h-4 text-indigo-600" />
                            <span>Hostel Accommodation</span>
                          </div>
                          {selectedUser.user.hostelInfo?.isResident ? (
                            <p className="text-slate-600">
                              Block: <strong>{selectedUser.user.hostelInfo.block}</strong> • Room: <strong>{selectedUser.user.hostelInfo.roomNumber}</strong> • Bed: <strong>{selectedUser.user.hostelInfo.bedNumber}</strong>
                            </p>
                          ) : (
                            <p className="text-slate-400">Day Scholar (Non-resident)</p>
                          )}
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Bus className="w-4 h-4 text-emerald-600" />
                            <span>Campus Transport</span>
                          </div>
                          {selectedUser.user.transportInfo?.isBusUser ? (
                            <p className="text-slate-600">
                              Route: <strong>{selectedUser.user.transportInfo.routeNumber}</strong> • Stop: <strong>{selectedUser.user.transportInfo.stopName}</strong>
                            </p>
                          ) : (
                            <p className="text-slate-400">Self-Commute / Walking</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Faculty Specific Details */}
                  {selectedUser.user.role === 'faculty' && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>Teaching Portfolio & Assigned Subjects</span>
                      </h4>
                      {selectedUser.subjects?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedUser.subjects.map((sub) => (
                            <div key={sub._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                              <span className="font-mono font-bold text-indigo-600 text-[11px]">{sub.code}</span>
                              <div className="font-bold text-slate-800">{sub.name}</div>
                              <div className="text-[10px] text-slate-400">Sem {sub.semester} • Sec {sub.section}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No courses currently assigned to this faculty member.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
