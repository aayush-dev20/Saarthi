// ==============================================
// GLOBAL VARIABLES AND STATE MANAGEMENT
// ==============================================
const AppState = {
    currentUser: null,
    selectedRole: 'student',
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    isVoiceActive: false,
    notifications: []
};

// ==============================================
// INITIALIZATION FUNCTION
// ==============================================
function initializeApp() {
    console.log('🚀 Initializing EduTrack Pro...');
    
    // Initialize theme
    initTheme();
    
    // Check authentication
    checkAuthStatus();
    
    // Initialize event listeners
    initEventListeners();
    
    // Show app is ready
    setTimeout(() => {
        hideLoader();
        showToast('EduTrack Pro is ready!', 'success');
    }, 1000);
}

// ==============================================
// THEME MANAGEMENT
// ==============================================
function initTheme() {
    if (AppState.isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('darkMode')) {
            AppState.isDarkMode = e.matches;
            document.body.classList.toggle('dark-mode', e.matches);
        }
    });
}

function toggleTheme() {
    AppState.isDarkMode = !AppState.isDarkMode;
    document.body.classList.toggle('dark-mode');
    
    if (AppState.isDarkMode) {
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('darkMode', 'true');
    } else {
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', 'false');
    }
    
    showToast(`Theme changed to ${AppState.isDarkMode ? 'dark' : 'light'} mode`, 'success');
}

// ==============================================
// UI HELPER FUNCTIONS
// ==============================================
function updateUserInterface() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (AppState.currentUser) {
        userInfo.style.display = 'flex';
        userName.textContent = AppState.currentUser.name;
        userAvatar.textContent = getInitials(AppState.currentUser.name);
    } else {
        userInfo.style.display = 'none';
    }
}

function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    
    const icon = type === 'success' ? 'fa-check-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' :
                type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function calculateGrade(marks) {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    return 'F';
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

// ==============================================
// EVENT LISTENERS INITIALIZATION
// ==============================================
function initEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    
    // Home link
    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        if (AppState.currentUser) {
            loadDashboard();
        } else {
            showLoginPage();
        }
    });
    
    // Auth modal tabs
    document.getElementById('loginTab').addEventListener('click', () => {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('registerTab').classList.remove('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.querySelector('#authModal .modal-header h3').textContent = 'Login to EduTrack Pro';
    });
    
    document.getElementById('registerTab').addEventListener('click', () => {
        document.getElementById('registerTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
        document.querySelector('#authModal .modal-header h3').textContent = 'Register for EduTrack Pro';
    });
    
    // Role selection
    document.querySelectorAll('.role-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            AppState.selectedRole = this.dataset.role;
        });
    });
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('loginId').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!id || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        loginUser(id, password, AppState.selectedRole);
    });
    
    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('registerId').value.trim();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
        
        // Validation
        if (!id || !name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        const userData = {
            id: id,
            name: name,
            email: email,
            role: AppState.selectedRole,
            password: password
        };
        
        registerUser(userData);
    });
    
    // Close auth modal
    document.getElementById('closeAuthModal').addEventListener('click', () => {
        document.getElementById('authModal').classList.remove('active');
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + D for dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Esc to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    // Initialize voice commands
    initVoiceCommands();
}

// ==============================================
// START THE APPLICATION
// ==============================================
// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page reload
window.addEventListener('beforeunload', () => {
    // Clean up if needed
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    showToast('An error occurred. Please refresh the page.', 'error');
});

// // ==============================================
// // MARKS UPLOAD SYSTEM - FIXED VERSION
// // ==============================================
// function uploadMarks() {
//     if (!AppState.currentUser || AppState.currentUser.role !== 'teacher') {
//         showToast('Only teachers can upload marks', 'error');
//         return;
//     }
    
//     // Show the marks upload modal
//     document.getElementById('marksUploadModal').classList.add('active');
//     loadRecentUploads();
// }

// function loadRecentUploads() {
//     const marks = getAllMarks();
//     const recentMarks = marks
//         .filter(m => m.uploadedBy === AppState.currentUser.id)
//         .sort((a, b) => new Date(b.date) - new Date(a.date))
//         .slice(0, 10);
    
//     const tableBody = document.getElementById('recentMarksTable');
//     const recentUploadsDiv = document.getElementById('recentUploads');
    
//     if (recentMarks.length > 0) {
//         tableBody.innerHTML = recentMarks.map(mark => {
//             return `
//                 <tr>
//                     <td>${mark.studentId}</td>
//                     <td>${mark.subject}</td>
//                     <td>${mark.type}</td>
//                     <td>${mark.marks}/100</td>
//                     <td>${formatDate(mark.date)}</td>
//                 </tr>
//             `;
//         }).join('');
//         recentUploadsDiv.style.display = 'block';
//     } else {
//         recentUploadsDiv.style.display = 'none';
//     }
// }

// function initMarksUploadModal() {
//     // Tab switching
//     document.getElementById('singleEntryBtn').addEventListener('click', () => {
//         document.getElementById('singleMarksForm').style.display = 'block';
//         document.getElementById('bulkUploadForm').style.display = 'none';
//         document.getElementById('singleEntryBtn').classList.add('active');
//         document.getElementById('bulkUploadBtn').classList.remove('active');
//     });
    
//     document.getElementById('bulkUploadBtn').addEventListener('click', () => {
//         document.getElementById('singleMarksForm').style.display = 'none';
//         document.getElementById('bulkUploadForm').style.display = 'block';
//         document.getElementById('bulkUploadBtn').classList.add('active');
//         document.getElementById('singleEntryBtn').classList.remove('active');
//     });
    
//     // Close modal
//     document.getElementById('closeMarksUpload').addEventListener('click', () => {
//         document.getElementById('marksUploadModal').classList.remove('active');
//     });
    
//     // Student search
//     document.getElementById('searchStudentBtn').addEventListener('click', searchStudent);
//     document.getElementById('studentId').addEventListener('keyup', (e) => {
//         if (e.key === 'Enter') searchStudent();
//     });
    
//     // Single entry form submission
//     document.getElementById('singleMarksForm').addEventListener('submit', saveSingleMarks);
    
//     // Bulk upload
//     document.getElementById('browseCsvBtn').addEventListener('click', () => {
//         document.getElementById('csvFile').click();
//     });
    
//     document.getElementById('csvFile').addEventListener('change', handleFileSelect);
    
//     // Drag and drop for CSV
//     const dropArea = document.getElementById('csvDropArea');
//     dropArea.addEventListener('dragover', (e) => {
//         e.preventDefault();
//         dropArea.style.borderColor = 'var(--primary-color)';
//         dropArea.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
//     });
    
//     dropArea.addEventListener('dragleave', () => {
//         dropArea.style.borderColor = 'var(--gray-300)';
//         dropArea.style.backgroundColor = 'transparent';
//     });
    
//     dropArea.addEventListener('drop', (e) => {
//         e.preventDefault();
//         dropArea.style.borderColor = 'var(--gray-300)';
//         dropArea.style.backgroundColor = 'transparent';
        
//         const file = e.dataTransfer.files[0];
//         if (file && file.type === 'text/csv') {
//             handleSelectedFile(file);
//         } else {
//             showToast('Please upload a CSV file only', 'error');
//         }
//     });
    
//     // Remove file button
//     document.getElementById('removeFileBtn').addEventListener('click', removeSelectedFile);
    
//     // Download template
//     document.getElementById('downloadTemplateBtn').addEventListener('click', downloadCSVTemplate);
    
//     // Bulk upload form submission
//     document.getElementById('bulkUploadForm').addEventListener('submit', processBulkUpload);
// }

// function searchStudent() {
//     const studentId = document.getElementById('studentId').value.trim();
//     if (!studentId) return;
    
//     const students = JSON.parse(localStorage.getItem('students') || '[]');
//     const student = students.find(s => s.id === studentId);
    
//     const studentInfoDiv = document.getElementById('studentInfo');
    
//     if (student) {
//         document.getElementById('studentName').textContent = `${student.name} (${student.id})`;
//         studentInfoDiv.style.display = 'block';
//         studentInfoDiv.style.borderLeft = '4px solid var(--secondary-color)';
//     } else {
//         document.getElementById('studentName').textContent = 'Student not found!';
//         studentInfoDiv.style.display = 'block';
//         studentInfoDiv.style.borderLeft = '4px solid var(--danger-color)';
//     }
// }

// function saveSingleMarks(e) {
//     e.preventDefault();
    
//     const studentId = document.getElementById('studentId').value.trim();
//     const subject = document.getElementById('subject').value;
//     const assessmentType = document.getElementById('assessmentType').value;
//     const marks = parseInt(document.getElementById('marks').value);
//     const date = document.getElementById('marksDate').value;
//     const remarks = document.getElementById('remarks').value.trim();
    
//     // Validation
//     if (!studentId || !subject || !assessmentType || isNaN(marks)) {
//         showToast('Please fill all required fields', 'error');
//         return;
//     }
    
//     if (marks < 0 || marks > 100) {
//         showToast('Marks must be between 0 and 100', 'error');
//         return;
//     }
    
//     // Verify student exists
//     const students = JSON.parse(localStorage.getItem('students') || '[]');
//     const student = students.find(s => s.id === studentId);
    
//     if (!student) {
//         showToast('Student not found. Please check Student ID', 'error');
//         return;
//     }
    
//     // Save marks
//     const marksData = JSON.parse(localStorage.getItem('marks') || '[]');
    
//     const newMark = {
//         id: 'M' + Date.now(),
//         studentId: studentId,
//         studentName: student.name,
//         subject: subject,
//         type: assessmentType,
//         marks: marks,
//         remarks: remarks || 'No remarks',
//         date: new Date(date).toISOString(),
//         uploadedBy: AppState.currentUser.id,
//         uploadedAt: new Date().toISOString()
//     };
    
//     marksData.push(newMark);
//     localStorage.setItem('marks', JSON.stringify(marksData));
    
//     // Show success
//     showToast(`Marks saved for ${student.name} (${marks}/100)`, 'success');
    
//     // Reset form
//     document.getElementById('singleMarksForm').reset();
//     document.getElementById('studentInfo').style.display = 'none';
//     document.getElementById('marksDate').value = new Date().toISOString().split('T')[0];
    
//     // Update recent uploads
//     loadRecentUploads();
    
//     // Reload dashboard if on teacher dashboard
//     if (AppState.currentUser.role === 'teacher') {
//         setTimeout(() => loadTeacherDashboard(), 500);
//     }
// }

// function handleFileSelect(e) {
//     const file = e.target.files[0];
//     handleSelectedFile(file);
// }

// function handleSelectedFile(file) {
//     if (!file || file.type !== 'text/csv') {
//         showToast('Please select a CSV file only', 'error');
//         return;
//     }
    
//     const filePreview = document.getElementById('filePreview');
//     const fileName = document.getElementById('fileName');
//     const fileSize = document.getElementById('fileSize');
//     const uploadBtn = document.getElementById('uploadCsvBtn');
    
//     fileName.textContent = file.name;
//     fileSize.textContent = ` (${formatFileSize(file.size)})`;
//     filePreview.style.display = 'flex';
//     uploadBtn.disabled = false;
    
//     // Store file reference
//     filePreview.dataset.fileName = file.name;
//     filePreview.dataset.fileSize = file.size;
// }

// function formatFileSize(bytes) {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// }

// function removeSelectedFile() {
//     const filePreview = document.getElementById('filePreview');
//     const csvFileInput = document.getElementById('csvFile');
//     const uploadBtn = document.getElementById('uploadCsvBtn');
    
//     filePreview.style.display = 'none';
//     csvFileInput.value = '';
//     uploadBtn.disabled = true;
// }

// function downloadCSVTemplate() {
//     const template = `StudentID,Subject,AssessmentType,Marks,Date,Remarks
// S1001,Mathematics,assignment,85,2024-01-15,Excellent work
// S1002,Physics,quiz,78,2024-01-15,Good attempt
// S1003,Chemistry,midterm,92,2024-01-10,Outstanding
// S1004,Programming,project,88,2024-01-12,Well done
// S1005,Database,lab,95,2024-01-14,Perfect score`;

//     const blob = new Blob([template], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'marks_template.csv';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
    
//     showToast('Template downloaded successfully', 'success');
// }

// function processBulkUpload(e) {
//     e.preventDefault();
    
//     const fileInput = document.getElementById('csvFile');
//     if (!fileInput.files.length) {
//         showToast('Please select a CSV file first', 'error');
//         return;
//     }
    
//     const file = fileInput.files[0];
//     const reader = new FileReader();
    
//     reader.onload = function(e) {
//         try {
//             const csvData = e.target.result;
//             const rows = csvData.split('\n').filter(row => row.trim());
            
//             if (rows.length < 2) {
//                 showToast('CSV file is empty or invalid', 'error');
//                 return;
//             }
            
//             const headers = rows[0].split(',').map(h => h.trim());
//             const requiredHeaders = ['StudentID', 'Subject', 'AssessmentType', 'Marks', 'Date'];
            
//             // Validate headers
//             for (const header of requiredHeaders) {
//                 if (!headers.includes(header)) {
//                     showToast(`CSV missing required column: ${header}`, 'error');
//                     return;
//                 }
//             }
            
//             let successCount = 0;
//             let errorCount = 0;
//             const errors = [];
//             const marksData = JSON.parse(localStorage.getItem('marks') || '[]');
//             const students = JSON.parse(localStorage.getItem('students') || '[]');
            
//             // Process each row
//             for (let i = 1; i < rows.length; i++) {
//                 const row = rows[i];
//                 const columns = row.split(',').map(col => col.trim());
                
//                 // Create object from row data
//                 const rowData = {};
//                 headers.forEach((header, index) => {
//                     rowData[header] = columns[index] || '';
//                 });
                
//                 // Validate row data
//                 const validation = validateMarksRow(rowData, students);
//                 if (validation.isValid) {
//                     const newMark = {
//                         id: 'M' + Date.now() + i,
//                         studentId: rowData.StudentID,
//                         studentName: validation.studentName,
//                         subject: rowData.Subject,
//                         type: rowData.AssessmentType,
//                         marks: parseInt(rowData.Marks),
//                         remarks: rowData.Remarks || 'No remarks',
//                         date: new Date(rowData.Date).toISOString(),
//                         uploadedBy: AppState.currentUser.id,
//                         uploadedAt: new Date().toISOString()
//                     };
                    
//                     marksData.push(newMark);
//                     successCount++;
//                 } else {
//                     errors.push(`Row ${i + 1}: ${validation.error}`);
//                     errorCount++;
//                 }
//             }
            
//             // Save all valid marks
//             if (successCount > 0) {
//                 localStorage.setItem('marks', JSON.stringify(marksData));
                
//                 // Show results
//                 let message = `Uploaded ${successCount} marks successfully.`;
//                 if (errorCount > 0) {
//                     message += ` ${errorCount} records failed.`;
//                     console.error('Upload errors:', errors);
//                 }
                
//                 showToast(message, successCount > 0 ? 'success' : 'warning');
                
//                 // Reset form and update display
//                 removeSelectedFile();
//                 loadRecentUploads();
                
//                 // Reload dashboard
//                 setTimeout(() => loadTeacherDashboard(), 1000);
                
//             } else {
//                 showToast('No valid records found in CSV file', 'error');
//             }
            
//         } catch (error) {
//             console.error('Error processing CSV:', error);
//             showToast('Error processing CSV file: ' + error.message, 'error');
//         }
//     };
    
//     reader.onerror = function() {
//         showToast('Error reading file', 'error');
//     };
    
//     reader.readAsText(file);
// }

// function validateMarksRow(rowData, students) {
//     // Check required fields
//     if (!rowData.StudentID || !rowData.Subject || !rowData.AssessmentType || !rowData.Marks || !rowData.Date) {
//         return { isValid: false, error: 'Missing required fields' };
//     }
    
//     // Check student exists
//     const student = students.find(s => s.id === rowData.StudentID);
//     if (!student) {
//         return { isValid: false, error: `Student ${rowData.StudentID} not found` };
//     }
    
//     // Validate marks
//     const marks = parseInt(rowData.Marks);
//     if (isNaN(marks) || marks < 0 || marks > 100) {
//         return { isValid: false, error: 'Marks must be between 0-100' };
//     }
    
//     // Validate date
//     const date = new Date(rowData.Date);
//     if (isNaN(date.getTime())) {
//         return { isValid: false, error: 'Invalid date format' };
//     }
    
//     return {
//         isValid: true,
//         studentName: student.name
//     };
// }

// // Add this to your initEventListeners function:
// function initEventListeners() {
//     // ... existing code ...
    
//     // Initialize marks upload modal
//     initMarksUploadModal();
    
//     // ... rest of existing code ...
// }