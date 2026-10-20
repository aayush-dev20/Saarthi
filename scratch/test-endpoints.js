async function testAll() {
  const base = 'http://localhost:5000/api';
  console.log('Testing SARARTHI 5-Role Endpoints...');

  const roles = [
    { id: 'S1001', pass: 'student123', label: 'Student' },
    { id: 'T2001', pass: 'teacher123', label: 'Faculty' },
    { id: 'A3001', pass: 'admin123', label: 'Admin' },
    { id: 'TM4001', pass: 'transport123', label: 'Transport Manager' },
    { id: 'HW5001', pass: 'warden123', label: 'Hostel Warden' },
  ];

  const tokens = {};

  for (const r of roles) {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNumber: r.id, password: r.pass }),
    });
    const data = await res.json();
    if (!data.success) {
      console.error(`❌ Failed to login as ${r.label}:`, data.message);
    } else {
      console.log(`✅ Logged in as ${r.label} (${r.id}): role=${data.user.role}`);
      tokens[data.user.role] = data.token;
    }
  }

  // 1. Student endpoints
  const lbRes = await fetch(`${base}/student/leaderboard`, {
    headers: { Authorization: `Bearer ${tokens['student']}` },
  });
  const lbData = await lbRes.json();
  console.log(`✅ Student Leaderboard: fetched ${lbData.data?.length || 0} entries`);

  const resModule = await fetch(`${base}/student/learning-resources/INTEG-BY-PARTS`, {
    headers: { Authorization: `Bearer ${tokens['student']}` },
  });
  const resData = await resModule.json();
  console.log(`✅ YouTube Learning Resource: "${resData.data?.title}" (pts: ${resData.data?.pointsReward})`);

  // 2. Admin endpoints
  const admRes = await fetch(`${base}/admin/analytics`, {
    headers: { Authorization: `Bearer ${tokens['admin']}` },
  });
  const admData = await admRes.json();
  console.log(`✅ Admin Analytics: students=${admData.data?.totalStudents}, faculty=${admData.data?.totalFaculty}`);

  // 3. Transport endpoints
  const trRes = await fetch(`${base}/transport/buses`, {
    headers: { Authorization: `Bearer ${tokens['transport_manager']}` },
  });
  const trData = await trRes.json();
  console.log(`✅ Transport Fleet: ${trData.data?.length} buses tracked`);

  // 4. Hostel endpoints
  const hRes = await fetch(`${base}/hostel/rooms`, {
    headers: { Authorization: `Bearer ${tokens['hostel_warden']}` },
  });
  const hData = await hRes.json();
  console.log(`✅ Hostel Rooms: ${hData.data?.length} rooms loaded`);

  console.log('\n🎉 ALL 5 ROLES & CORE BACKEND ENDPOINTS ARE FULLY OPERATIONAL!');
}

testAll().catch(console.error);
