import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Enrollment } from '../models/Enrollment.js';
import { Mark } from '../models/Mark.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Assignment, AssignmentSubmission } from '../models/Assignment.js';
import { Concept, ConceptPrerequisite } from '../models/Concept.js';
import { DiagnosticQuestion, AssessmentAttempt } from '../models/DiagnosticQuestion.js';
import { PracticeSet, PracticeAttempt, AuditLog } from '../models/PracticeSet.js';
import { Timetable } from '../models/Timetable.js';
import { Bus, BusRoute, OutingPass } from '../models/Transport.js';
import { HostelBlock, HostelRoom, HostelCheckLog, MaintenanceRequest } from '../models/Hostel.js';
import { LeaderboardEntry } from '../models/Leaderboard.js';
import { LearningResource } from '../models/LearningResource.js';
import { Notification } from '../models/Notification.js';

export async function seedDatabase() {
  console.log('🌱 Starting Saarthi Complete Smart Campus Seeding Process...');

  // 1. Clean existing records
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Enrollment.deleteMany({});
  await Mark.deleteMany({});
  await AttendanceSession.deleteMany({});
  await AttendanceRecord.deleteMany({});
  await Assignment.deleteMany({});
  await AssignmentSubmission.deleteMany({});
  await Concept.deleteMany({});
  await ConceptPrerequisite.deleteMany({});
  await DiagnosticQuestion.deleteMany({});
  await AssessmentAttempt.deleteMany({});
  await PracticeSet.deleteMany({});
  await PracticeAttempt.deleteMany({});
  await AuditLog.deleteMany({});
  await Timetable.deleteMany({});
  await Bus.deleteMany({});
  await BusRoute.deleteMany({});
  await OutingPass.deleteMany({});
  await HostelBlock.deleteMany({});
  await HostelRoom.deleteMany({});
  await HostelCheckLog.deleteMany({});
  await MaintenanceRequest.deleteMany({});
  await LeaderboardEntry.deleteMany({});
  await LearningResource.deleteMany({});
  await Notification.deleteMany({});

  console.log('🧹 Purged all existing collections.');

  // 2. Create Users across all 5 roles
  // Student Demo: Aayush Sharma (S1001 / student123)
  const aayush = new User({
    idNumber: 'S1001',
    name: 'Aayush Sharma',
    email: 'aayush.sharma@college.edu',
    password: 'student123',
    role: 'student',
    department: 'Computer Science & Engineering',
    semester: 4,
    section: 'CSE-A',
    phone: '+91 98765 43210',
    avatar: 'AS',
    hostelInfo: {
      block: 'Aravali Boys Hostel',
      roomNumber: 'B-204',
      bedNumber: 'Bed-1',
      isResident: true,
    },
    transportInfo: {
      isBusUser: true,
      busNumber: 'BUS-12',
      routeNumber: 'Route-5 (Metro Shuttle)',
      stopName: 'Sector 62 Metro Station',
    },
  });
  await aayush.save();

  // Faculty Demo: Dr. Vandana Rao (T2001 / teacher123)
  const vandana = new User({
    idNumber: 'T2001',
    name: 'Dr. Vandana Rao',
    email: 'vandana.rao@college.edu',
    password: 'teacher123',
    role: 'faculty',
    status: 'active',
    department: 'Department of Applied Mathematics & Computing',
    designation: 'Associate Professor & HOD',
    semester: 4,
    section: 'CSE-A',
    phone: '+91 98111 22334',
    avatar: 'VR',
    subjectsTaught: ['BTCS 401-18', 'BTAM 304-18', 'HSMC 122-18'],
  });
  await vandana.save();

  // Additional Department Faculty for PTU Curriculum
  const raman = new User({
    idNumber: 'T2002',
    name: 'Prof. K. Raman',
    email: 'k.raman@college.edu',
    password: 'teacher123',
    role: 'faculty',
    status: 'active',
    department: 'Department of Computer Science & Engineering',
    designation: 'Professor (Algorithms & Data Structures)',
    semester: 4,
    section: 'CSE-A',
    phone: '+91 98111 33445',
    avatar: 'KR',
    subjectsTaught: ['BTCS 301-18', 'BTCS 403-18', 'BTCS 303-18', 'BTCS 405-18'],
  });
  await raman.save();

  const kulkarni = new User({
    idNumber: 'T2003',
    name: 'Dr. S. Kulkarni',
    email: 's.kulkarni@college.edu',
    password: 'teacher123',
    role: 'faculty',
    status: 'active',
    department: 'Department of Computer Science & Engineering',
    designation: 'Associate Professor (Systems & Architecture)',
    semester: 4,
    section: 'CSE-A',
    phone: '+91 98111 44556',
    avatar: 'SK',
    subjectsTaught: ['BTCS 402-18', 'BTES 401-18', 'BTES 301-18', 'BTCS 404-18'],
  });
  await kulkarni.save();

  // Admin Demo: Col. R. K. Varma (A3001 / admin123)
  const admin = new User({
    idNumber: 'A3001',
    name: 'Col. R. K. Varma',
    email: 'admin.varma@college.edu',
    password: 'admin123',
    role: 'admin',
    department: 'Dean of Academic Administration',
    designation: 'Registrar & Chief Administrator',
    phone: '+91 98000 11223',
    avatar: 'RV',
  });
  await admin.save();

  // Transport Manager Demo: Rajesh Sharma (TM4001 / transport123)
  const transportMgr = new User({
    idNumber: 'TM4001',
    name: 'Rajesh Sharma',
    email: 'transport.rajesh@college.edu',
    password: 'transport123',
    role: 'transport_manager',
    department: 'Campus Transport Services',
    designation: 'Chief Fleet Officer',
    phone: '+91 98222 33445',
    avatar: 'RS',
  });
  await transportMgr.save();

  // Hostel Warden Demo: Dr. Anita Deshmukh (HW5001 / warden123)
  const warden = new User({
    idNumber: 'HW5001',
    name: 'Dr. Anita Deshmukh',
    email: 'warden.anita@college.edu',
    password: 'warden123',
    role: 'hostel_warden',
    department: 'Campus Residencies & Student Welfare',
    designation: 'Chief Hostel Warden',
    phone: '+91 98333 44556',
    avatar: 'AD',
  });
  await warden.save();

  // Peer Students for class roster & leaderboards
  const peerStudents = [
    { idNumber: 'S1002', name: 'Priya Nair', email: 'priya.nair@college.edu', avatar: 'PN' },
    { idNumber: 'S1003', name: 'Rohan Mehta', email: 'rohan.mehta@college.edu', avatar: 'RM' },
    { idNumber: 'S1004', name: 'Ananya Sen', email: 'ananya.sen@college.edu', avatar: 'AS' },
    { idNumber: 'S1005', name: 'Dev Patel', email: 'dev.patel@college.edu', avatar: 'DP' },
    { idNumber: 'S1006', name: 'Meera Iyer', email: 'meera.iyer@college.edu', avatar: 'MI' },
  ];

  const createdPeers = [];
  for (const peer of peerStudents) {
    const u = new User({
      idNumber: peer.idNumber,
      name: peer.name,
      email: peer.email,
      password: 'student123',
      role: 'student',
      department: 'Computer Science & Engineering',
      semester: 4,
      section: 'CSE-A',
      avatar: peer.avatar,
    });
    await u.save();
    createdPeers.push(u);
  }

  const allStudents = [aayush, ...createdPeers];
  console.log(`👤 Created ${allStudents.length} students, 1 faculty, 1 admin, 1 transport manager, and 1 hostel warden.`);

  // 3. Create Official IKGPTU B.Tech CSE Curriculum Subjects (Semesters 3 & 4)
  const ptuSubjects = [
    // --- SEMESTER 3 ---
    {
      code: 'BTCS 301-18',
      name: 'Data Structures & Algorithms',
      courseType: 'Professional Core Course',
      semester: 3,
      credits: 3,
      load: '3-0-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: raman._id,
      instructorName: raman.name,
      room: 'LT-104',
      schedule: 'Mon, Wed 10:00 AM',
      color: 'blue',
    },
    {
      code: 'BTCS 302-18',
      name: 'Object Oriented Programming',
      courseType: 'Professional Core Course',
      semester: 3,
      credits: 3,
      load: '3-0-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: raman._id,
      instructorName: raman.name,
      room: 'LT-105',
      schedule: 'Tue, Thu 09:00 AM',
      color: 'purple',
    },
    {
      code: 'BTAM 304-18',
      name: 'Mathematics-III (Probability & Statistics)',
      courseType: 'Basic Science Course',
      semester: 3,
      credits: 3,
      load: '3-0-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: vandana._id,
      instructorName: vandana.name,
      room: 'LT-102',
      schedule: 'Mon, Wed, Fri 11:00 AM',
      color: 'indigo',
    },
    {
      code: 'BTES 301-18',
      name: 'Digital Electronics',
      courseType: 'Engineering Science Course',
      semester: 3,
      credits: 3,
      load: '3-0-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: kulkarni._id,
      instructorName: kulkarni.name,
      room: 'LT-101',
      schedule: 'Tue, Thu 11:30 AM',
      color: 'emerald',
    },
    {
      code: 'HSMC 101-18',
      name: 'Foundation Course in Humanities (Development of Societies)',
      courseType: 'Humanities & Social Sciences',
      semester: 3,
      credits: 3,
      load: '2-1-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: vandana._id,
      instructorName: vandana.name,
      room: 'LT-201',
      schedule: 'Fri 02:00 PM',
      color: 'slate',
    },
    {
      code: 'BTCS 303-18',
      name: 'Data Structures & Algorithms Lab',
      courseType: 'Professional Core Course',
      semester: 3,
      credits: 2,
      load: '0-0-4',
      internalMax: 30,
      externalMax: 20,
      totalMax: 50,
      faculty: raman._id,
      instructorName: raman.name,
      room: 'Computing Lab 1',
      schedule: 'Wed 02:00 - 05:00 PM',
      color: 'blue',
    },
    {
      code: 'BTCS 304-18',
      name: 'Object Oriented Programming Lab',
      courseType: 'Professional Core Course',
      semester: 3,
      credits: 2,
      load: '0-0-4',
      internalMax: 30,
      externalMax: 20,
      totalMax: 50,
      faculty: raman._id,
      instructorName: raman.name,
      room: 'Computing Lab 2',
      schedule: 'Thu 02:00 - 05:00 PM',
      color: 'purple',
    },
    {
      code: 'BTES 302-18',
      name: 'Digital Electronics Lab',
      courseType: 'Engineering Science Course',
      semester: 3,
      credits: 1,
      load: '0-0-2',
      internalMax: 30,
      externalMax: 20,
      totalMax: 50,
      faculty: kulkarni._id,
      instructorName: kulkarni.name,
      room: 'Hardware Lab',
      schedule: 'Mon 02:00 - 04:00 PM',
      color: 'emerald',
    },
    {
      code: 'BTCS 305-18',
      name: 'IT Workshop',
      courseType: 'Professional Core Course',
      semester: 3,
      credits: 1,
      load: '0-0-2',
      internalMax: 30,
      externalMax: 20,
      totalMax: 50,
      faculty: kulkarni._id,
      instructorName: kulkarni.name,
      room: 'Software Lab 3',
      schedule: 'Tue 02:00 - 04:00 PM',
      color: 'cyan',
    },

    // --- SEMESTER 4 ---
    {
      code: 'BTCS 401-18',
      name: 'Discrete Mathematics',
      courseType: 'Professional Core Course',
      semester: 4,
      credits: 4,
      load: '3-1-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: vandana._id,
      instructorName: vandana.name,
      room: 'LT-102',
      schedule: 'Mon, Wed, Fri 10:00 AM',
      color: 'indigo',
    },
    {
      code: 'BTES 401-18',
      name: 'Computer Organization & Architecture',
      courseType: 'Engineering Science Course',
      semester: 4,
      credits: 3,
      load: '3-0-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: kulkarni._id,
      instructorName: kulkarni.name,
      room: 'LT-103',
      schedule: 'Tue, Thu 10:00 AM',
      color: 'amber',
    },
    {
      code: 'BTCS 402-18',
      name: 'Operating Systems',
      courseType: 'Professional Core Course',
      semester: 4,
      credits: 3,
      load: '3-0-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: kulkarni._id,
      instructorName: kulkarni.name,
      room: 'LT-204',
      schedule: 'Mon, Thu 02:00 PM',
      color: 'rose',
    },
    {
      code: 'BTCS 403-18',
      name: 'Design & Analysis of Algorithms',
      courseType: 'Professional Core Course',
      semester: 4,
      credits: 3,
      load: '3-0-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: raman._id,
      instructorName: raman.name,
      room: 'LT-104',
      schedule: 'Tue, Thu 11:30 AM',
      color: 'blue',
    },
    {
      code: 'HSMC 122-18',
      name: 'Universal Human Values 2: Understanding Harmony',
      courseType: 'Humanities & Social Sciences',
      semester: 4,
      credits: 3,
      load: '2-1-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: vandana._id,
      instructorName: vandana.name,
      room: 'Auditorium Hall B',
      schedule: 'Fri 03:00 PM',
      color: 'teal',
    },
    {
      code: 'EVS 101-18',
      name: 'Environmental Sciences',
      courseType: 'Mandatory Course',
      semester: 4,
      credits: 0,
      load: '3-0-0',
      internalMax: 100,
      externalMax: 0,
      totalMax: 100,
      faculty: vandana._id,
      instructorName: 'Dr. Anita Deshmukh',
      room: 'LT-101',
      schedule: 'Sat 10:00 AM',
      color: 'emerald',
    },
    {
      code: 'BTES 402-18',
      name: 'Computer Organization & Architecture Lab',
      courseType: 'Engineering Science Course',
      semester: 4,
      credits: 1,
      load: '0-0-2',
      internalMax: 30,
      externalMax: 20,
      totalMax: 50,
      faculty: kulkarni._id,
      instructorName: kulkarni.name,
      room: 'Systems Lab 1',
      schedule: 'Wed 02:00 - 04:00 PM',
      color: 'amber',
    },
    {
      code: 'BTCS 404-18',
      name: 'Operating Systems Lab',
      courseType: 'Professional Core Course',
      semester: 4,
      credits: 2,
      load: '0-0-4',
      internalMax: 30,
      externalMax: 20,
      totalMax: 50,
      faculty: kulkarni._id,
      instructorName: kulkarni.name,
      room: 'Systems Lab 2',
      schedule: 'Mon 02:00 - 05:00 PM',
      color: 'rose',
    },
    {
      code: 'BTCS 405-18',
      name: 'Design & Analysis of Algorithms Lab',
      courseType: 'Professional Core Course',
      semester: 4,
      credits: 2,
      load: '0-0-4',
      internalMax: 30,
      externalMax: 20,
      totalMax: 50,
      faculty: raman._id,
      instructorName: raman.name,
      room: 'Algorithm Lab 3',
      schedule: 'Thu 02:00 - 05:00 PM',
      color: 'blue',
    },

    // Legacy Course Code mapping for backwards compatibility with diagnostic checks
    {
      code: 'MATH-202',
      name: 'Engineering Mathematics IV (ODEs & Linear Algebra)',
      courseType: 'Basic Science Course',
      semester: 4,
      credits: 4,
      load: '3-1-0',
      internalMax: 40,
      externalMax: 60,
      totalMax: 100,
      faculty: vandana._id,
      instructorName: vandana.name,
      room: 'LT-102',
      schedule: 'Mon, Wed, Fri 10:00 AM',
      color: 'indigo',
    },
  ];

  const createdSubjects = await Subject.insertMany(ptuSubjects);
  const mathSubject = createdSubjects.find((s) => s.code === 'MATH-202');
  const dsaSubject = createdSubjects.find((s) => s.code === 'BTCS 301-18');
  const osSubject = createdSubjects.find((s) => s.code === 'BTCS 402-18');
  const daaSubject = createdSubjects.find((s) => s.code === 'BTCS 403-18');
  console.log(`Academic courses created: ${createdSubjects.length} official IKGPTU subjects.`);

  // 4. Enrollments & Official Marks across PTU scheme
  for (const student of allStudents) {
    for (const sub of createdSubjects) {
      await Enrollment.create({
        student: student._id,
        subject: sub._id,
        semester: sub.semester,
        section: 'CSE-A',
        status: 'enrolled',
      });

      // Realistic authentic marks scaling to internalMax & externalMax
      let internal = Math.round(sub.internalMax * 0.8);
      let external = Math.round(sub.externalMax * 0.78);

      if (student.idNumber === 'S1001') {
        // Aayush Sharma: strong in Algorithms & Systems, recovering in Math-III / ODEs
        if (sub.code.includes('BTCS 301') || sub.code.includes('BTCS 403')) {
          internal = Math.round(sub.internalMax * 0.92);
          external = Math.round(sub.externalMax * 0.88);
        } else if (sub.code.includes('BTCS 402')) {
          internal = Math.round(sub.internalMax * 0.85);
          external = Math.round(sub.externalMax * 0.82);
        } else if (sub.code === 'MATH-202' || sub.code === 'BTAM 304-18') {
          internal = Math.round(sub.internalMax * 0.7);
          external = Math.round(sub.externalMax * 0.72);
        }
      } else if (student.idNumber === 'S1004') {
        // Ananya: top ranker
        internal = Math.round(sub.internalMax * 0.95);
        external = Math.round(sub.externalMax * 0.94);
      } else if (student.idNumber === 'S1005') {
        // Dev Patel: needs academic guidance
        internal = Math.round(sub.internalMax * 0.62);
        external = Math.round(sub.externalMax * 0.58);
      }

      const mark = new Mark({
        student: student._id,
        subject: sub._id,
        internalMarks: internal,
        internalMax: sub.internalMax,
        semesterMarks: external,
        semesterMax: sub.externalMax,
        publicationStatus: 'PUBLISHED',
        updatedBy: sub.faculty,
      });
      await mark.save();
    }
  }

  // 5. Attendance Sessions & Records
  const pastSessions = [
    { date: new Date(Date.now() - 6 * 86400000), code: 'MATH-1084', pin: '412' },
    { date: new Date(Date.now() - 4 * 86400000), code: 'MATH-2491', pin: '659' },
    { date: new Date(Date.now() - 2 * 86400000), code: 'MATH-7812', pin: '823' },
    { date: new Date(Date.now() - 1 * 86400000), code: 'MATH-9321', pin: '194' },
  ];

  for (const ps of pastSessions) {
    const session = await AttendanceSession.create({
      subject: mathSubject._id,
      faculty: vandana._id,
      section: 'CSE-A',
      room: 'LT-102',
      sessionCode: ps.code,
      challengePin: ps.pin,
      currentToken: `archived_token_${ps.code}`,
      tokenExpiresAt: ps.date,
      sessionExpiresAt: ps.date,
      isActive: false,
      createdAt: ps.date,
    });

    for (const student of allStudents) {
      if (student.idNumber === 'S1005' && ps.code === 'MATH-2491') continue;

      await AttendanceRecord.create({
        session: session._id,
        student: student._id,
        subject: mathSubject._id,
        method: 'QR_VERIFIED',
        status: 'PRESENT',
        verificationStatus: 'VERIFIED',
        proximityScore: 92,
        wifiSsid: 'IndoGlobal-Campus-WiFi',
        room: 'LT-102',
        verifiedAt: ps.date,
        createdAt: ps.date,
      });
    }
  }

  // Active Live Lecture Session with Challenge PIN
  const liveSession = await AttendanceSession.create({
    subject: mathSubject._id,
    faculty: vandana._id,
    section: 'CSE-A',
    room: 'LT-102',
    sessionCode: 'MATH-8421',
    challengePin: '742',
    currentToken: 'MATH-8421-INIT-TOKEN',
    tokenExpiresAt: new Date(Date.now() + 15000),
    sessionExpiresAt: new Date(Date.now() + 3600000),
    isActive: true,
  });

  // 6. Assignments for Official PTU 2nd-Year B.Tech CSE Subjects
  const assignments = [
    {
      title: 'Characteristic Polynomials & Differential Systems',
      subject: mathSubject._id,
      courseCode: 'BTCS 401-18',
      unitTopic: 'Unit 3: Recurrence Relations & Generating Functions',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      totalPoints: 100,
      description: 'Solve analytical problem set 4 focusing on homogeneous recurrence relations, characteristic roots, and generating functions.',
      faculty: vandana._id,
      section: 'CSE-A',
      status: 'PUBLISHED',
      priority: 'High',
    },
    {
      title: 'B-Tree & Red-Black Tree Implementation Invariant Verification',
      subject: dsaSubject._id,
      courseCode: 'BTCS 301-18',
      unitTopic: 'Unit 4: Advanced Balanced Trees',
      dueDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      totalPoints: 100,
      description: 'Implement balance invariant enforcement, tree rotations, and logarithmic range search in C++.',
      faculty: raman._id,
      section: 'CSE-A',
      status: 'PUBLISHED',
      priority: 'High',
    },
    {
      title: 'Virtual Memory Paging & Replacement Simulation',
      subject: osSubject._id,
      courseCode: 'BTCS 402-18',
      unitTopic: 'Unit 3: Memory Management & Paging',
      dueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      totalPoints: 100,
      description: 'Simulate LRU, Clock, and FIFO page replacement algorithms and analyze hit-ratio curves.',
      faculty: kulkarni._id,
      section: 'CSE-A',
      status: 'PUBLISHED',
      priority: 'Medium',
    },
    {
      title: 'Greedy vs Dynamic Programming: 0/1 Knapsack & Bellman-Ford',
      subject: daaSubject._id,
      courseCode: 'BTCS 403-18',
      unitTopic: 'Unit 2: Dynamic Programming & Shortest Paths',
      dueDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      totalPoints: 100,
      description: 'Analyze asymptotic complexity, optimal substructure, and memoization table structure.',
      faculty: raman._id,
      section: 'CSE-A',
      status: 'PUBLISHED',
      priority: 'Medium',
    },
  ];

  const createdAssignments = await Assignment.insertMany(assignments);

  for (let i = 1; i < createdAssignments.length; i++) {
    await AssignmentSubmission.create({
      assignment: createdAssignments[i]._id,
      student: aayush._id,
      status: 'Graded',
      submittedOn: new Date(Date.now() - (8 - i) * 86400000).toISOString().split('T')[0],
      submittedAt: new Date(Date.now() - (8 - i) * 86400000),
      submissionText: 'Implemented all required algorithms in clean C++17 with full test coverage and benchmarks.',
      fileName: `S1001_${createdAssignments[i].courseCode.replace(/[^a-zA-Z0-9]/g, '_')}_solution.pdf`,
      serverReceiptId: `REC-${Date.now().toString(36).toUpperCase()}-S1001-${i}`,
      score: 92,
      feedback: 'Excellent analytical rigor, code style, and test coverage.',
      gradedAt: new Date(Date.now() - (7 - i) * 86400000),
      gradedBy: createdAssignments[i].faculty,
    });
  }

  // 7. Concept Knowledge Graph
  const concepts = [
    { code: 'c1', label: 'Functions & Limits', category: 'Foundation', description: 'Domain, range, epsilon-delta limits, continuity.', defaultMastery: 92, posX: 100, posY: 100 },
    { code: 'c2', label: 'Differentiation Basics', category: 'Calculus I', description: 'Product rule, quotient rule, chain rule, implicit differentiation.', defaultMastery: 88, posX: 320, posY: 100 },
    { code: 'c3', label: 'Integration Fundamentals', category: 'Calculus II', description: 'Definite/indefinite integrals, Riemann sums, substitution method.', defaultMastery: 75, posX: 540, posY: 100 },
    { code: 'c4', label: 'Linear Algebra Basics', category: 'Algebra', description: 'Matrices, determinants, vector spaces, Gaussian elimination.', defaultMastery: 85, posX: 100, posY: 280 },
    { code: 'c5', label: 'Integration by Parts & Substitution', category: 'Prerequisite Core', description: 'Reduction formulas, algebraic substitutions, partial fractions.', defaultMastery: 42, posX: 320, posY: 280 },
    { code: 'c6', label: 'First-Order Differential Equations', category: 'Core Course', description: 'Separable equations, integrating factors, Bernoulli equations.', defaultMastery: 52, posX: 540, posY: 280, isTarget: true },
    { code: 'c7', label: 'Second-Order Linear ODEs', category: 'Target Topic', description: 'Homogeneous/non-homogeneous equations, undetermined coefficients.', defaultMastery: 35, posX: 760, posY: 280, isTarget: true },
  ];

  await Concept.insertMany(concepts);

  const edges = [
    { edgeId: 'e1-2', source: 'c1', target: 'c2' },
    { edgeId: 'e2-3', source: 'c2', target: 'c3' },
    { edgeId: 'e3-5', source: 'c3', target: 'c5' },
    { edgeId: 'e5-6', source: 'c5', target: 'c6', isAnimated: true },
    { edgeId: 'e4-6', source: 'c4', target: 'c6' },
    { edgeId: 'e6-7', source: 'c6', target: 'c7' },
  ];

  await ConceptPrerequisite.insertMany(edges);

  // 8. Diagnostic Questions & Initial Attempt for Aayush
  // FIXED: Correct answers distributed across B, C, D, A (not defaulting to A/opt_1)
  const diagnosticQuestions = [
    {
      conceptCode: 'c5',
      conceptName: 'Integration by Parts & Substitution',
      isPrerequisiteCheck: true,
      question: 'Evaluate the integral ∫ x * e^(2x) dx using integration by parts.',
      options: [
        { id: 'opt_1', text: 'x e^(2x) - 2 e^(2x) + C', correct: false },
        { id: 'opt_2', text: '(x/2) e^(2x) - (1/4) e^(2x) + C', correct: true },
        { id: 'opt_3', text: '(x/2) e^(2x) + (1/4) e^(2x) + C', correct: false },
        { id: 'opt_4', text: '(1/4) x e^(2x) - (1/2) e^(2x) + C', correct: false },
      ],
      explanation: 'Using ∫ u dv = u v - ∫ v du with u = x (du = dx) and dv = e^(2x) dx: Result = (x/2) e^(2x) - (1/4) e^(2x) + C (Option B).',
    },
    {
      conceptCode: 'c5',
      conceptName: 'Integration by Parts & Substitution',
      isPrerequisiteCheck: true,
      question: 'To solve ∫ (2x + 3) / (x^2 + 3x + 5) dx, what is the exact evaluated result?',
      options: [
        { id: 'opt_1', text: '1 / (x^2 + 3x + 5)^2 + C', correct: false },
        { id: 'opt_2', text: 'arctan(x + 3/2) + C', correct: false },
        { id: 'opt_3', text: 'ln|x^2 + 3x + 5| + C', correct: true },
        { id: 'opt_4', text: '(2x + 3) * ln|x^2 + 3x + 5| + C', correct: false },
      ],
      explanation: 'The numerator (2x + 3) is the exact derivative of the denominator (x^2 + 3x + 5), yielding ln|x^2 + 3x + 5| + C directly (Option C).',
    },
    {
      conceptCode: 'c6',
      conceptName: 'First-Order Differential Equations',
      isPrerequisiteCheck: false,
      question: 'Find the integrating factor I(x) for the linear ODE: dy/dx + (2/x)y = x^3.',
      options: [
        { id: 'opt_1', text: '2 ln(x)', correct: false },
        { id: 'opt_2', text: 'e^(2x)', correct: false },
        { id: 'opt_3', text: '1/x^2', correct: false },
        { id: 'opt_4', text: 'x^2', correct: true },
      ],
      explanation: 'The integrating factor is I(x) = e^(∫ (2/x) dx) = e^(2 ln x) = e^(ln(x^2)) = x^2 (Option D).',
    },
    {
      conceptCode: 'c6',
      conceptName: 'First-Order Differential Equations',
      isPrerequisiteCheck: false,
      question: 'What is the general solution to dy/dx = 3x^2 y with y > 0?',
      options: [
        { id: 'opt_1', text: 'y = C * e^(x^3)', correct: true },
        { id: 'opt_2', text: 'y = x^3 + C', correct: false },
        { id: 'opt_3', text: 'y = C * e^(3x)', correct: false },
        { id: 'opt_4', text: 'ln(y) = 6x + C', correct: false },
      ],
      explanation: 'Separating variables: dy/y = 3x^2 dx => ln(y) = x^3 + C1 => y = C e^(x^3) (Option A).',
    },
    {
      conceptCode: 'c5',
      conceptName: 'Integration by Parts & Substitution',
      isPrerequisiteCheck: true,
      question: 'Evaluate the integral ∫ ln(x) dx.',
      options: [
        { id: 'opt_1', text: '(1/x) + C', correct: false },
        { id: 'opt_2', text: '(ln(x))^2 / 2 + C', correct: false },
        { id: 'opt_3', text: 'x ln(x) - x + C', correct: true },
        { id: 'opt_4', text: 'x ln(x) + x + C', correct: false },
      ],
      explanation: 'Using parts with u = ln(x) and dv = dx: ∫ ln(x) dx = x ln(x) - x + C (Option C).',
    },
    {
      conceptCode: 'c4',
      conceptName: 'Differentiation Fundamentals',
      isPrerequisiteCheck: true,
      question: 'If y = x^2 * ln(x), what is the first derivative dy/dx?',
      options: [
        { id: 'opt_1', text: '2x / x = 2', correct: false },
        { id: 'opt_2', text: '2x ln(x) + x', correct: true },
        { id: 'opt_3', text: 'x^2 + 2x', correct: false },
        { id: 'opt_4', text: '2x ln(x)', correct: false },
      ],
      explanation: 'Product rule: d/dx [u * v] = u\' v + u v\'. Here u = x^2 and v = ln(x). dy/dx = 2x ln(x) + x^2(1/x) = 2x ln(x) + x (Option B).',
    },
  ];

  await DiagnosticQuestion.insertMany(diagnosticQuestions);

  await AssessmentAttempt.create({
    student: aayush._id,
    subjectCode: 'MATH-202',
    score: 40,
    correctCount: 2,
    totalQuestions: 5,
    prereqErrors: 2,
    targetErrors: 1,
    hasIntegrationGap: true,
    isReassessment: false,
    createdAt: new Date(Date.now() - 2 * 86400000),
  });

  // 9. Self-Contained Learning Resource Library (In-App Interactive Derivations & Examples)
  await LearningResource.create({
    conceptCode: 'c5',
    conceptName: 'Integration by Parts & Substitution',
    subjectCode: 'MATH-202',
    title: 'Theoretical Derivation & Systematic Problem Solving: Integration by Parts & U-Substitution',
    description: 'A complete, self-contained educational module authored by faculty detailing the mathematical origin from the product rule of differential calculus, the LIATE priority framework, and step-by-step worked solutions for differential equation integration.',
    author: 'Department of Applied Mathematics & Faculty Board',
    theoreticalDerivation: 'Integration by parts is the integral calculus analog of the product rule for differentiation. Given two differentiable functions u(x) and v(x), the derivative of their product is: d/dx [u(x) * v(x)] = u(x) * (dv/dx) + v(x) * (du/dx). Integrating both sides with respect to x gives: ∫ (d/dx [u(x) * v(x)]) dx = ∫ u(x) * (dv/dx) dx + ∫ v(x) * (du/dx) dx. By the Fundamental Theorem of Calculus, this simplifies to: u(x) * v(x) = ∫ u dv + ∫ v du. Rearranging terms yields the canonical formula: ∫ u dv = u * v - ∫ v du.',
    formulaBox: {
      formula: '∫ u dv = u * v - ∫ v du',
      description: 'The LIATE rule provides the optimal selection hierarchy for choice of u(x):',
      rules: [
        'L — Logarithmic functions: ln(x), log_a(x) (Highest priority for u)',
        'I — Inverse trigonometric functions: arctan(x), arcsin(x)',
        'A — Algebraic polynomials: x^n, 3x^2 + 2x, √x',
        'T — Trigonometric functions: sin(x), cos(x), sec^2(x)',
        'E — Exponential functions: e^(kx), a^x (Lowest priority for u, ideal for dv)',
      ],
    },
    workedExamples: [
      {
        problem: 'Example 1: Evaluate ∫ x * e^(3x) dx',
        stepByStepSolution: [
          'Step 1: Identify components using LIATE. Algebraic (x) comes before Exponential (e^(3x)). Therefore, let u = x and dv = e^(3x) dx.',
          'Step 2: Differentiate u to get du = dx. Integrate dv to get v = (1/3) * e^(3x).',
          'Step 3: Apply the integration by parts formula ∫ u dv = u*v - ∫ v du: ∫ x * e^(3x) dx = x * ((1/3) * e^(3x)) - ∫ ((1/3) * e^(3x)) dx.',
          'Step 4: Integrate the remaining expression: (1/3) * ∫ e^(3x) dx = (1/9) * e^(3x).',
          'Step 5: Combine terms and attach the arbitrary constant of integration C: Result = (x/3) * e^(3x) - (1/9) * e^(3x) + C.',
        ],
        finalAnswer: '(x/3) * e^(3x) - (1/9) * e^(3x) + C',
        pitfallToAvoid: 'Do not forget the 1/3 coefficient when integrating dv = e^(3x) dx, which squares to 1/9 in the second step.',
      },
      {
        problem: 'Example 2: Evaluate ∫ ln(x) dx',
        stepByStepSolution: [
          'Step 1: Notice that ln(x) cannot be integrated directly. Treat the integrand as ln(x) * 1 dx.',
          'Step 2: Following LIATE, choose u = ln(x) (Logarithmic) and dv = 1 dx.',
          'Step 3: Compute differentials: du = (1/x) dx and v = x.',
          'Step 4: Apply formula: ∫ ln(x) dx = ln(x) * x - ∫ x * (1/x) dx = x * ln(x) - ∫ 1 dx.',
          'Step 5: Evaluate the remaining integral: x * ln(x) - x + C.',
        ],
        finalAnswer: 'x * ln(x) - x + C',
        pitfallToAvoid: 'Assuming dv must be a separate variable; 1 dx is a valid differential component.',
      },
      {
        problem: 'Example 3: U-Substitution: Evaluate ∫ (2x + 3) / (x^2 + 3x + 7) dx',
        stepByStepSolution: [
          'Step 1: Observe that the numerator (2x + 3) is the exact derivative of the quadratic denominator (x^2 + 3x + 7).',
          'Step 2: Set substitution variable u = x^2 + 3x + 7.',
          'Step 3: Differentiate: du = (2x + 3) dx.',
          'Step 4: Substitute into the integral: ∫ (1/u) du = ln|u| + C.',
          'Step 5: Substitute back the original variable x: ln|x^2 + 3x + 7| + C.',
        ],
        finalAnswer: 'ln|x^2 + 3x + 7| + C',
        pitfallToAvoid: 'Attempting integration by parts when a direct derivative-numerator relationship exists.',
      },
    ],
    prerequisiteRefresher: {
      prerequisiteConcept: 'Differentiation Product Rule & Chain Rule',
      whyItMatters: 'Higher order differential equations (BTCS 401 / MATH-202) rely on reduction of order and integrating factors that require seamless reverse-product operations.',
      coreRule: 'Always verify if the integrand contains a function and its derivative (U-Substitution) before attempting parts factorization.',
    },
    downloadableNotesSummary: 'Official Lecture Summary Sheet: IKGPTU Engineering Mathematics III & IV — Calculus Module 2: Reduction Formulas, LIATE Selection Matrix & Differential Integrators.',
    // Optional external video reference
    youtubeVideoId: '2UQCfhzZ3b8',
    youtubeUrl: 'https://www.youtube.com/watch?v=2UQCfhzZ3b8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/2UQCfhzZ3b8',
    durationMinutes: 14,
    keyTakeaways: [
      'Mathematical proof of ∫ u dv = u*v - ∫ v du via the product rule of differentiation',
      'The LIATE priority hierarchy: Logarithmic, Inverse trig, Algebraic, Trig, Exponential',
      'Recognizing derivative relationships in denominators for rapid logarithmic substitution',
      'Avoiding the cyclical integral trap via algebraic rearrangement',
    ],
    timestamps: [
      { title: 'Derivation from Product Rule', time: '01:15', seconds: 75 },
      { title: 'The LIATE Priority Matrix', time: '05:30', seconds: 330 },
      { title: 'Application in Differential Equations', time: '09:45', seconds: 585 },
    ],
    postLearningQuestions: [
      {
        id: 'plq-1',
        question: 'In applying integration by parts to ∫ x * ln(x) dx, what should u be chosen as according to LIATE?',
        options: ['u = ln(x)', 'u = x', 'u = x * ln(x)', 'u = dx'],
        correctIndex: 0,
        explanation: 'Logarithmic functions have highest priority in LIATE (L before A), so u = ln(x) and dv = x dx.',
      },
      {
        id: 'plq-2',
        question: 'Evaluate ∫ x * e^x dx using the parts formula u*v - ∫ v du.',
        options: ['x * e^x - e^x + C', 'x * e^x + e^x + C', '(x^2/2) * e^x + C', 'e^x - x + C'],
        correctIndex: 0,
        explanation: 'With u = x, du = dx, and dv = e^x dx, v = e^x: Result is x e^x - ∫ e^x dx = x e^x - e^x + C.',
      },
    ],
  });

  // 10. Transparent Leaderboard Data
  const scores = [
    { student: createdPeers[2]._id, academic: 380, gap: 50, coursework: 90, part: 40, badges: [{ name: 'Campus Rank 1', icon: 'Award' }] }, // Ananya
    { student: aayush._id, academic: 330, gap: 80, coursework: 90, part: 50, badges: [{ name: 'Calculus Pioneer', icon: 'Sparkles' }] }, // Aayush
    { student: createdPeers[0]._id, academic: 340, gap: 40, coursework: 85, part: 30, badges: [{ name: 'Lab Ace', icon: 'Check' }] }, // Priya
    { student: createdPeers[4]._id, academic: 320, gap: 30, coursework: 80, part: 25, badges: [] }, // Meera
    { student: createdPeers[1]._id, academic: 290, gap: 20, coursework: 75, part: 20, badges: [] }, // Rohan
    { student: createdPeers[3]._id, academic: 230, gap: 10, coursework: 60, part: 10, badges: [] }, // Dev
  ];

  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    await LeaderboardEntry.create({
      student: s.student,
      section: 'CSE-A',
      semester: 4,
      academicPoints: s.academic,
      diagnosticImprovementPoints: s.gap,
      courseworkPoints: s.coursework,
      participationPoints: s.part,
      rank: i + 1,
      badges: s.badges,
    });
  }

  // 11. Campus Transport: Buses, Routes & Weekend Outing Pass
  const bus1 = await Bus.create({
    busNumber: 'BUS-12',
    registrationPlate: 'DL-01-TA-4981',
    capacity: 45,
    assignedDriver: { name: 'Manoj Kumar', phone: '+91 98777 11223', licenseNumber: 'DL-TR-89210' },
    status: 'ACTIVE',
    currentLocation: { currentStop: 'Sector 62 Metro Station' },
  });

  const bus2 = await Bus.create({
    busNumber: 'BUS-05',
    registrationPlate: 'DL-01-TA-3204',
    capacity: 40,
    assignedDriver: { name: 'Sukhdev Singh', phone: '+91 98777 22334', licenseNumber: 'DL-TR-74122' },
    status: 'ON_ROUTE',
    currentLocation: { currentStop: 'City Center Hub' },
  });

  const bus3 = await Bus.create({
    busNumber: 'BUS-08',
    registrationPlate: 'DL-01-TA-5819',
    capacity: 45,
    assignedDriver: { name: 'Ramesh Yadav', phone: '+91 98777 33445', licenseNumber: 'DL-TR-65891' },
    status: 'MAINTENANCE',
    currentLocation: { currentStop: 'Workshop Bay 2' },
  });

  await BusRoute.create({
    routeNumber: 'Route-5',
    routeName: 'Sector 62 Metro Shuttle via Knowledge Park',
    origin: 'Knowledge Park Gate 3',
    destination: 'Campus Terminal',
    morningDeparture: '07:45 AM',
    eveningDeparture: '05:30 PM',
    assignedBus: bus1._id,
    stops: [
      { stopName: 'Sector 62 Metro Station', morningPickupTime: '07:45 AM', eveningDropTime: '05:45 PM', landmark: 'Exit Gate 2', sequence: 1 },
      { stopName: 'City Center Circle', morningPickupTime: '08:05 AM', eveningDropTime: '06:05 PM', landmark: 'Near Police Post', sequence: 2 },
      { stopName: 'Campus Main Gate', morningPickupTime: '08:30 AM', eveningDropTime: '06:30 PM', landmark: 'Admin Block', sequence: 3 },
    ],
  });

  await OutingPass.create({
    student: aayush._id,
    destination: 'Greater Noida City Center Library',
    purpose: 'Semester Project Research & Materials',
    departureDate: new Date(Date.now() + 1 * 86400000),
    expectedReturnDate: new Date(Date.now() + 2 * 86400000),
    status: 'APPROVED',
    shuttleBooked: true,
    shuttleRoute: 'Route-5 (Weekend Metro Shuttle)',
    approvedBy: warden._id,
    approvalRemarks: 'Approved by Warden. Curfew check required by 09:30 PM Sunday.',
  });

  await OutingPass.create({
    student: createdPeers[1]._id, // Rohan
    destination: 'Home Visit (Delhi NCR)',
    purpose: 'Family Function',
    departureDate: new Date(Date.now() + 2 * 86400000),
    expectedReturnDate: new Date(Date.now() + 4 * 86400000),
    status: 'REQUESTED',
    shuttleBooked: false,
  });

  // 12. Hostel Residencies: Blocks, Rooms, Curfew Logs & Maintenance
  const blockA = await HostelBlock.create({
    name: 'Aravali Boys Hostel',
    gender: 'BOYS',
    totalFloors: 4,
    warden: warden._id,
    wardenContact: { name: 'Dr. Anita Deshmukh', phone: '+91 98333 44556', office: 'Ground Floor Room 101' },
    curfewTime: '09:30 PM',
  });

  const blockB = await HostelBlock.create({
    name: 'Nilgiri Girls Hostel',
    gender: 'GIRLS',
    totalFloors: 4,
    warden: warden._id,
    wardenContact: { name: 'Mrs. Sunita Rao', phone: '+91 98333 99887', office: 'Block B Entrance' },
    curfewTime: '09:00 PM',
  });

  await HostelRoom.create({
    block: blockA._id,
    roomNumber: 'B-204',
    floor: 2,
    capacity: 2,
    occupancy: 2,
    beds: [
      { bedNumber: 'Bed-1', student: aayush._id, status: 'OCCUPIED' },
      { bedNumber: 'Bed-2', student: createdPeers[1]._id, status: 'OCCUPIED' }, // Rohan
    ],
    status: 'FULL',
  });

  await HostelRoom.create({
    block: blockA._id,
    roomNumber: 'B-205',
    floor: 2,
    capacity: 2,
    occupancy: 1,
    beds: [
      { bedNumber: 'Bed-1', student: createdPeers[3]._id, status: 'OCCUPIED' }, // Dev
      { bedNumber: 'Bed-2', student: null, status: 'VACANT' },
    ],
    status: 'AVAILABLE',
  });

  await HostelRoom.create({
    block: blockB._id,
    roomNumber: 'G-102',
    floor: 1,
    capacity: 2,
    occupancy: 2,
    beds: [
      { bedNumber: 'Bed-1', student: createdPeers[0]._id, status: 'OCCUPIED' }, // Priya
      { bedNumber: 'Bed-2', student: createdPeers[2]._id, status: 'OCCUPIED' }, // Ananya
    ],
    status: 'FULL',
  });

  await HostelCheckLog.create({
    student: aayush._id,
    block: blockA._id,
    roomNumber: 'B-204',
    type: 'NIGHT_CURFEW_CHECK',
    status: 'PRESENT',
    verifiedBy: warden._id,
    remarks: 'Verified present during 09:30 PM roll call.',
  });

  await MaintenanceRequest.create({
    student: aayush._id,
    blockName: 'Aravali Boys Hostel',
    roomNumber: 'B-204',
    category: 'ELECTRICAL',
    title: 'Study Lamp Power Socket Loose',
    description: 'Desk 1 power socket sparks when plugging in laptop adapter.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedStaff: { name: 'Satish Electrician', phone: '+91 98999 12345' },
  });

  // 13. Master Timetable
  const timetableSlots = [
    { day: 'Monday', period: 1, start: '09:00 AM', end: '10:00 AM', room: 'LT-102', subject: mathSubject._id, type: 'Lecture' },
    { day: 'Monday', period: 2, start: '10:00 AM', end: '11:00 AM', room: 'LT-204', subject: createdSubjects[2]._id, type: 'Lecture' }, // OS
    { day: 'Wednesday', period: 2, start: '10:00 AM', end: '11:00 AM', room: 'LT-102', subject: mathSubject._id, type: 'Lecture' },
    { day: 'Thursday', period: 3, start: '11:30 AM', end: '01:00 PM', room: 'Lab-3', subject: createdSubjects[1]._id, type: 'Lab' }, // DSA
    { day: 'Friday', period: 2, start: '10:00 AM', end: '11:00 AM', room: 'LT-102', subject: mathSubject._id, type: 'Tutorial' },
  ];

  for (const slot of timetableSlots) {
    await Timetable.create({
      subject: slot.subject,
      faculty: vandana._id,
      dayOfWeek: slot.day,
      periodNumber: slot.period,
      startTime: slot.start,
      endTime: slot.end,
      room: slot.room,
      section: 'CSE-A',
      semester: 4,
      type: slot.type,
    });
  }

  console.log('🎉 Seeding successfully completed! SARARTHI Smart Campus Database is fully ready.');
}

// Direct CLI execution
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('❌ Seeding failed with error:', err);
      process.exit(1);
    }
  })();
}
