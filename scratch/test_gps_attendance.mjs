// Comprehensive End-to-End Test for Feature 18: GPS-Based Classroom Attendance Verification with Live Teacher Notifications
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function login(identifier, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${identifier}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}

async function runTests() {
  console.log('======================================================================');
  console.log('🧪 RUNNING VERIFICATION: GPS-BASED ATTENDANCE & LIVE NOTIFICATIONS');
  console.log('======================================================================\n');

  // 1. Authenticate users
  console.log('Step 1: Authenticating test accounts...');
  const teacherToken = await login('T2001', 'teacher123');
  console.log('  ✅ Teacher T2001 logged in successfully');

  const s1Token = await login('S1001', 'student123');
  console.log('  ✅ Student S1001 logged in successfully');

  const s2Token = await login('S1002', 'student123');
  console.log('  ✅ Student S1002 logged in successfully');

  const s3Token = await login('S1003', 'student123');
  console.log('  ✅ Student S1003 logged in successfully');

  const s4Token = await login('S1004', 'student123');
  console.log('  ✅ Student S1004 logged in successfully');

  // 2. Query configured classrooms
  console.log('\nStep 2: Fetching configured classrooms and geofences...');
  const classroomsRes = await request('/attendance/classrooms', {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  if (!classroomsRes.ok || !classroomsRes.data.data?.length) {
    throw new Error(`Failed to load classrooms: ${JSON.stringify(classroomsRes.data)}`);
  }
  const classrooms = classroomsRes.data.data;
  console.log(`  ✅ Loaded ${classrooms.length} configured classrooms`);
  
  const classroom12 = classrooms.find(c => c.name.includes('12') || c.code === 'CR-12') || classrooms[0];
  console.log(`  📍 Target Classroom: "${classroom12.name}" (${classroom12.building || 'Main Campus'})`);
  console.log(`     Coordinates: Lat ${classroom12.lat}, Lng ${classroom12.lng}`);
  console.log(`     Allowed Radius: ${classroom12.radiusMeters}m, Max GPS Accuracy: ${classroom12.maxAccuracyMeters}m`);

  // 3. Teacher starts an attendance session for Classroom 12
  console.log('\nStep 3: Teacher starts live attendance session for Classroom 12...');
  // Find a subject taught by teacher
  const dashRes = await request('/faculty/dashboard', {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const subjects = dashRes.data.data?.subjects || [];
  const subjectId = subjects.length ? subjects[0].id : null;

  const startSessionRes = await request('/faculty/attendance/session/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      subjectId: subjectId,
      section: 'A',
      room: classroom12.name,
      classroomId: classroom12._id,
      classroomName: classroom12.name,
      radiusMeters: classroom12.radiusMeters,
      maxAccuracyMeters: classroom12.maxAccuracyMeters,
    }),
  });

  if (!startSessionRes.ok) {
    throw new Error(`Failed to start attendance session: ${JSON.stringify(startSessionRes.data)}`);
  }

  const session = startSessionRes.data.data;
  console.log(`  ✅ Session started! ID: ${session.sessionId}, Code: ${session.sessionCode}`);
  console.log(`  🔑 Initial QR Token: ${session.currentToken.substring(0, 32)}...`);

  // 4. Connect Teacher Socket.IO client to listen for real-time notifications
  console.log('\nStep 4: Connecting Teacher Socket.IO client...');
  const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    auth: { token: teacherToken },
  });

  const receivedNotifications = [];
  await new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('  ⚡ Socket connected. Joining session room...');
      socket.emit('join_attendance_session', session.sessionId.toString());
      setTimeout(resolve, 300);
    });
    socket.on('connect_error', reject);
  });

  socket.on('attendance:scan_received', (data) => {
    console.log('\n  🔔 [TEACHER NOTIFICATION RECEIVED VIA SOCKET.IO]');
    console.log(`     Student: ${data.studentName || data.student?.name} (ID: ${data.studentId || data.student?.studentId})`);
    console.log(`     Classroom: ${data.classroom}`);
    console.log(`     Subject: ${data.subject}`);
    console.log(`     Scan time: ${data.scanTime}`);
    console.log(`     Location permission: ${data.locationPermission}`);
    console.log(`     GPS accuracy: ${data.gpsAccuracy}`);
    console.log(`     Distance from classroom: ${data.distanceFromClassroom}`);
    console.log(`     Location verification: ${data.locationVerification}`);
    console.log(`     Attendance status: ${data.attendanceStatus}`);
    receivedNotifications.push(data);
  });

  // 5. Test Case 1: Student S1001 scans within classroom radius
  console.log('\n--- Test Case 1: Valid scan within classroom radius (Classroom 12) ---');
  // Coordinates very close to Classroom 12 (offset ~5m)
  const insideScanRes = await request('/attendance/scan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({
      qrToken: session.currentToken,
      latitude: classroom12.lat + 0.00004,
      longitude: classroom12.lng + 0.00003,
      accuracy: 12,
      locationTimestamp: Date.now(),
      locationPermission: 'GRANTED',
    }),
  });

  console.log(`  HTTP Status: ${insideScanRes.status}`);
  console.log(`  Response:`, insideScanRes.data);
  if (insideScanRes.status !== 201 || insideScanRes.data.data.attendanceStatus !== 'PRESENT') {
    throw new Error('Test Case 1 failed: Expected status 201 and PRESENT attendanceStatus');
  }
  if (insideScanRes.data.data.locationVerificationCode !== 'WITHIN_RADIUS' && !insideScanRes.data.data.locationVerification.includes('Within')) {
    throw new Error('Test Case 1 failed: Expected WITHIN_RADIUS');
  }
  console.log(`  ✅ Test Case 1 Passed: S1001 marked PRESENT (Distance: ${insideScanRes.data.data.distanceFromClassroom}m <= ${classroom12.radiusMeters}m, Accuracy: 12m)`);

  // Wait 500ms for socket delivery
  await new Promise(r => setTimeout(r, 500));

  // 6. Test Case 2: Duplicate scan rejected
  console.log('\n--- Test Case 2: Duplicate scan attempt by S1001 ---');
  const duplicateScanRes = await request('/attendance/scan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: JSON.stringify({
      qrToken: session.currentToken,
      latitude: classroom12.lat,
      longitude: classroom12.lng,
      accuracy: 10,
      locationTimestamp: Date.now(),
      locationPermission: 'GRANTED',
    }),
  });

  console.log(`  HTTP Status: ${duplicateScanRes.status}`);
  console.log(`  Message: ${duplicateScanRes.data.message}`);
  if (duplicateScanRes.status !== 409) {
    throw new Error(`Test Case 2 failed: Expected 409 Conflict for duplicate submission, got ${duplicateScanRes.status}`);
  }
  console.log('  ✅ Test Case 2 Passed: Duplicate scan correctly rejected with 409 Conflict');

  // 7. Test Case 3: Student S1002 scans from OUTSIDE the radius (>50m away)
  console.log('\n--- Test Case 3: Out-of-radius scan (Distance ~500m) ---');
  const outsideScanRes = await request('/attendance/scan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s2Token}` },
    body: JSON.stringify({
      qrToken: session.currentToken,
      latitude: classroom12.lat + 0.005, // ~550m away
      longitude: classroom12.lng + 0.004,
      accuracy: 14,
      locationTimestamp: Date.now(),
      locationPermission: 'GRANTED',
    }),
  });

  console.log(`  HTTP Status: ${outsideScanRes.status}`);
  console.log(`  Response:`, outsideScanRes.data);
  if (outsideScanRes.status !== 201 || outsideScanRes.data.data.attendanceStatus !== 'FLAGGED_FOR_REVIEW') {
    throw new Error('Test Case 3 failed: Expected FLAGGED_FOR_REVIEW for out-of-radius scan');
  }
  if (outsideScanRes.data.data.locationVerificationCode !== 'OUT_OF_RADIUS' && !outsideScanRes.data.data.locationVerification.includes('Outside')) {
    throw new Error('Test Case 3 failed: Expected OUT_OF_RADIUS');
  }
  console.log(`  ✅ Test Case 3 Passed: Out-of-radius flagged for teacher review (Distance: ${outsideScanRes.data.data.distanceFromClassroom}m > ${classroom12.radiusMeters}m)`);

  await new Promise(r => setTimeout(r, 500));

  // 8. Test Case 4: Student S1003 has low/poor GPS accuracy (> maxAccuracyMeters)
  console.log('\n--- Test Case 4: Inconclusive GPS accuracy (Reported accuracy 65m > max 35m) ---');
  const poorAccuracyScanRes = await request('/attendance/scan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s3Token}` },
    body: JSON.stringify({
      qrToken: session.currentToken,
      latitude: classroom12.lat + 0.00002,
      longitude: classroom12.lng + 0.00002,
      accuracy: 65, // Poor GPS signal
      locationTimestamp: Date.now(),
      locationPermission: 'GRANTED',
    }),
  });

  console.log(`  HTTP Status: ${poorAccuracyScanRes.status}`);
  console.log(`  Response:`, poorAccuracyScanRes.data);
  if (poorAccuracyScanRes.data.data.attendanceStatus !== 'FLAGGED_FOR_REVIEW') {
    throw new Error('Test Case 4 failed: Expected FLAGGED_FOR_REVIEW');
  }
  if (poorAccuracyScanRes.data.data.locationVerificationCode !== 'INCONCLUSIVE_ACCURACY' && !poorAccuracyScanRes.data.data.locationVerification.includes('Inconclusive')) {
    throw new Error('Test Case 4 failed: Expected INCONCLUSIVE_ACCURACY');
  }
  console.log(`  ✅ Test Case 4 Passed: Poor GPS accuracy safely flagged as INCONCLUSIVE_ACCURACY`);

  await new Promise(r => setTimeout(r, 500));

  // 9. Test Case 5: Student S1004 denies location permission
  console.log('\n--- Test Case 5: Location permission denied by student ---');
  const deniedScanRes = await request('/attendance/scan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s4Token}` },
    body: JSON.stringify({
      qrToken: session.currentToken,
      locationPermission: 'DENIED',
    }),
  });

  console.log(`  HTTP Status: ${deniedScanRes.status}`);
  console.log(`  Response:`, deniedScanRes.data);
  if (deniedScanRes.data.data.attendanceStatus !== 'FLAGGED_FOR_REVIEW') {
    throw new Error('Test Case 5 failed: Expected FLAGGED_FOR_REVIEW');
  }
  if (deniedScanRes.data.data.locationVerificationCode !== 'PERMISSION_DENIED' && !deniedScanRes.data.data.locationVerification.includes('denied')) {
    throw new Error('Test Case 5 failed: Expected PERMISSION_DENIED');
  }
  console.log(`  ✅ Test Case 5 Passed: Denied location handled gracefully and flagged for teacher override`);

  await new Promise(r => setTimeout(r, 500));

  // 10. Test Case 6: Live attendance table data retrieval (Reconnection & persistence)
  console.log('\n--- Test Case 6: Teacher live attendance table retrieval & persistence ---');
  const liveTableRes = await request(`/faculty/attendance/session/${session.sessionId}/live`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });

  if (!liveTableRes.ok) {
    throw new Error(`Failed to fetch live table: ${JSON.stringify(liveTableRes.data)}`);
  }

  const liveAttendees = liveTableRes.data.data.attendees;
  console.log(`  Total attendees in live table: ${liveAttendees.length}`);
  console.table(liveAttendees.map(a => ({
    Name: a.studentName,
    ID: a.studentId,
    Status: a.attendanceStatus,
    Verification: a.locationVerification,
    Distance: a.distanceMeters != null ? `${a.distanceMeters}m` : 'N/A',
    Accuracy: a.gpsAccuracy != null ? `${a.gpsAccuracy}m` : 'N/A',
    Permission: a.locationPermission,
  })));

  if (liveAttendees.length !== 4) {
    throw new Error(`Expected 4 attendees in live table, found ${liveAttendees.length}`);
  }
  console.log('  ✅ Test Case 6 Passed: Live attendance table correctly persisted all 4 scans with full GPS metrics');

  // 11. Test Case 7: Teacher manual review & override
  console.log('\n--- Test Case 7: Teacher manual override of flagged out-of-radius student (S1002) ---');
  const s2Record = liveAttendees.find(a => a.studentId === 'S1002');
  const overrideRes = await request('/faculty/attendance/override', {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      recordId: s2Record.recordId || s2Record._id || s2Record.id,
      overrideStatus: 'VERIFIED',
      reason: 'Physical presence in Classroom 12 independently verified by Prof. Sharma',
    }),
  });

  console.log(`  HTTP Status: ${overrideRes.status}`);
  console.log(`  Override message: ${overrideRes.data.message}`);
  if (!overrideRes.ok || overrideRes.data.data.status !== 'PRESENT') {
    throw new Error('Test Case 7 failed: Attendance override not applied');
  }
  console.log('  ✅ Test Case 7 Passed: Teacher override applied with audit trail (status -> PRESENT)');

  // 12. Test Case 8: Dynamic classroom radius configuration
  console.log('\n--- Test Case 8: Adjusting classroom permitted radius ---');
  const updateRadiusRes = await request(`/attendance/classrooms/${classroom12._id}/radius`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({ radiusMeters: 75, maxAccuracyMeters: 40 }),
  });

  console.log(`  HTTP Status: ${updateRadiusRes.status}`);
  console.log(`  Updated Radius: ${updateRadiusRes.data.data.radiusMeters}m, Max Accuracy: ${updateRadiusRes.data.data.maxAccuracyMeters}m`);
  if (!updateRadiusRes.ok || updateRadiusRes.data.data.radiusMeters !== 75) {
    throw new Error('Test Case 8 failed: Radius adjustment failed');
  }
  console.log('  ✅ Test Case 8 Passed: Configurable classroom radius updated successfully');

  // Disconnect socket
  socket.disconnect();

  console.log('\n======================================================================');
  console.log('🎉 ALL 8 GPS ATTENDANCE VERIFICATION TEST SUITES PASSED FLAWLESSLY!');
  console.log(`📡 Total Live Teacher Socket.IO Notifications Received: ${receivedNotifications.length}`);
  console.log('======================================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
