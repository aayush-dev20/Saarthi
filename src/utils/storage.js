import {
  studentProfile,
  teacherProfile,
  subjectsData,
  attendanceHistory,
  assignmentsData,
  teacherClassStudents,
  conceptGraphNodes,
} from "../data/mockData";

const STORAGE_KEYS = {
  CURRENT_USER: "saarthi_current_user",
  SUBJECTS: "saarthi_subjects",
  ATTENDANCE: "saarthi_attendance",
  ASSIGNMENTS: "saarthi_assignments",
  CONCEPTS: "saarthi_concepts",
  ASSESSMENT_RESULTS: "saarthi_assessment_results",
  PRACTICE_PROGRESS: "saarthi_practice_progress",
  CLASS_STUDENTS: "saarthi_class_students",
};

export const getInitialUser = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return studentProfile;
};

export const setCurrentUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  window.dispatchEvent(new Event("saarthi_auth_change"));
};

export const switchRole = (role) => {
  const newUser = role === "teacher" ? teacherProfile : studentProfile;
  setCurrentUser(newUser);
  return newUser;
};

export const getSubjects = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return subjectsData;
};

export const getAttendance = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return attendanceHistory;
};

export const markAttendanceSession = ({ subject, code, method = "QR Verified" }) => {
  const records = getAttendance();
  const newEntry = {
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
    subject: subject || "Engineering Mathematics IV",
    slot: "10:00 - 11:00 AM",
    status: "Present",
    method: method,
    room: "LT-102",
  };
  const updated = [newEntry, ...records];
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
  return newEntry;
};

export const getAssignments = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return assignmentsData;
};

export const submitAssignment = (id) => {
  const list = getAssignments();
  const updated = list.map((a) =>
    a.id === id
      ? {
          ...a,
          status: "Submitted",
          submittedOn: new Date().toISOString().split("T")[0],
        }
      : a
  );
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  return updated;
};

export const getConcepts = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return conceptGraphNodes;
};

export const getAssessmentResults = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.ASSESSMENT_RESULTS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return null;
};

export const saveAssessmentResult = (result) => {
  localStorage.setItem(STORAGE_KEYS.ASSESSMENT_RESULTS, JSON.stringify(result));
  // If reassessment or improved score, also boost the concept mastery in localStorage!
  if (result.score >= 70) {
    const concepts = getConcepts();
    const updated = concepts.map((c) => {
      if (c.id === "c5") {
        return {
          ...c,
          data: {
            ...c.data,
            mastery: 84,
            status: "proficient",
            isFlaggedGap: false,
            evidence: "Prerequisite recovered: Scored 84% on reassessment.",
          },
        };
      }
      if (c.id === "c6") {
        return {
          ...c,
          data: {
            ...c.data,
            mastery: 80,
            status: "proficient",
            description: "First & second order ODEs, integrating factors, and harmonic oscillators.",
          },
        };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(updated));
  }
  window.dispatchEvent(new Event("saarthi_gap_updated"));
  return result;
};

export const getTeacherStudents = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.CLASS_STUDENTS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return teacherClassStudents;
};

export const updateStudentMarks = (rollNo, newScore) => {
  const students = getTeacherStudents();
  const updated = students.map((s) =>
    s.rollNo === rollNo ? { ...s, avgScore: Number(newScore) } : s
  );
  localStorage.setItem(STORAGE_KEYS.CLASS_STUDENTS, JSON.stringify(updated));
  return updated;
};

export const resetAllDemoData = () => {
  localStorage.clear();
  window.location.reload();
};
