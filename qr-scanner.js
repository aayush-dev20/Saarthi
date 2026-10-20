// ==============================================
// QR CODE FUNCTIONS - FIXED VERSION
// ==============================================
let html5QrCodeScanner;
let isScannerActive = false; // Track scanner state

// --- Diagnostics UI helpers ---
function createQrDiagnostics() {
    if (document.getElementById('qrDiagnostics')) return;
    

    // Attach handler for local file load
    setTimeout(() => {
        const btn = document.getElementById('qrLoadLocalBtn');
        if (btn && !btn._attached) {
            btn._attached = true;
            btn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.js';
                input.onchange = (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    loadLocalScriptFile(file);
                };
                input.click();
            });
        }
    }, 100);
}

async function loadLocalScriptFile(file) {
    try {
        updateQrDiagnostics('loading-local', file.name);
        const text = await file.text();
        const blob = new Blob([text], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const s = document.createElement('script');
        s.src = url;
        s.onload = () => { 
            URL.revokeObjectURL(url); 
            updateQrDiagnostics('loaded-local', file.name); 
        };
        s.onerror = (e) => { 
            URL.revokeObjectURL(url); 
            updateQrDiagnostics('failed-local', file.name); 
            showToast('Local script failed to load', 'error'); 
        };
        document.head.appendChild(s);
    } catch (e) {
        console.error('Failed to load local script file', e);
        updateQrDiagnostics('error', 'local-load');
        showToast('Failed to load local script', 'error');
    }
}

function updateQrDiagnostics(status, msg) {
    try {
        createQrDiagnostics();
        const s = document.getElementById('qrDiagStatus');
        if (s) s.textContent = status + (msg ? ' — ' + msg : '');
    } catch (e) {
        console.warn('Failed to update QR diagnostics:', e);
    }

    // Also update status badge on dashboard if present
    if (typeof setQrStatusBadge === 'function') {
        try { setQrStatusBadge(status); } catch (e) {}
    }
}

function setQrStatusBadge(text) {
    const el = document.getElementById('qrStatusBadge');
    if (!el) return;
    el.textContent = 'Status: ' + text;
    if (text === 'loaded' || text === 'ready' || text === 'scanner-ready') {
        el.style.color = 'var(--secondary-color)';
    } else if (text === 'failed' || text === 'error') {
        el.style.color = 'var(--danger-color)';
    } else {
        el.style.color = 'var(--gray-500)';
    }
}

function ensureHtml5QrcodeLoaded(callback) {
    // Check if already loaded (both possible global names)
    if (window.Html5QrcodeScanner || window.Html5Qrcode) {
        if (window.Html5QrcodeScanner) {
            return callback();
        } else if (window.Html5Qrcode) {
            // Some versions export as Html5Qrcode, not Html5QrcodeScanner
            window.Html5QrcodeScanner = window.Html5Qrcode;
            return callback();
        }
    }

    const cdns = [
        'html5-qrcode.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
        'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
        'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
    ];

    let idx = 0;

    function tryLoadNext() {
        // Check again if library loaded
        if (window.Html5QrcodeScanner || window.Html5Qrcode) {
            if (window.Html5Qrcode && !window.Html5QrcodeScanner) {
                window.Html5QrcodeScanner = window.Html5Qrcode;
            }
            updateQrDiagnostics('loaded', 'library ready');
            return callback();
        }

        if (idx >= cdns.length) {
            // All attempts failed - create enhanced fallback
            createEnhancedFallback();
            updateQrDiagnostics('failed', 'all cdns failed, using fallback');
            showToast('Using fallback QR scanner', 'warning');
            return callback();
        }

        const url = cdns[idx++];
        updateQrDiagnostics('loading', url);

        // Skip if already tried and failed
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript && existingScript.hasAttribute('data-failed')) {
            tryLoadNext();
            return;
        }

        // Create new script element
        const s = document.createElement('script');
        s.src = url;
        s.async = false;
        s.onload = function() {
            setTimeout(() => {
                if (window.Html5QrcodeScanner || window.Html5Qrcode) {
                    if (window.Html5Qrcode && !window.Html5QrcodeScanner) {
                        window.Html5QrcodeScanner = window.Html5Qrcode;
                    }
                    updateQrDiagnostics('loaded', url);
                    callback();
                } else {
                    s.setAttribute('data-failed', 'true');
                    updateQrDiagnostics('not-ready', url);
                    tryLoadNext();
                }
            }, 100);
        };
        s.onerror = function() {
            s.setAttribute('data-failed', 'true');
            updateQrDiagnostics('failed', url);
            tryLoadNext();
        };
        document.head.appendChild(s);
    }

    function createEnhancedFallback() {
        if (window.Html5QrcodeScanner) return;
        
        // Enhanced fallback scanner
        window.Html5QrcodeScanner = class FallbackQrScanner {
            constructor(elementId, config = {}) {
                this.elementId = elementId;
                this.config = config || {};
                this._stream = null;
                this._timer = null;
                this._detector = null;
                this._video = null;
                this._isScanning = false;
            }

            async render(onSuccess, onError) {
                const container = document.getElementById(this.elementId);
                if (!container) {
                    onError && onError('Container not found');
                    return;
                }

                // Clear previous content
                container.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;width:100%;">
                        <video id="__html5_qr_video" autoplay playsinline style="width:100%;max-width:480px;border-radius:6px;background:#000"></video>
                        <div id="__html5_qr_status" style="margin-top:0.5rem;color:var(--gray-600);font-size:0.9rem;">Point your camera at the QR code</div>
                        <button class="btn btn-secondary" style="margin-top:1rem;" id="__fallback_manual_btn">
                            <i class="fas fa-keyboard"></i> Manual Input
                        </button>
                    </div>
                `;

                const video = container.querySelector('video');
                this._video = video;
                this._isScanning = true;

                try {
                    const constraints = {
                        video: {
                            facingMode: 'environment',
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    };
                    
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    this._stream = stream;
                    video.srcObject = stream;
                    
                    await new Promise((resolve, reject) => {
                        video.onloadedmetadata = resolve;
                        video.onerror = reject;
                        setTimeout(resolve, 1000);
                    });
                    
                    await video.play();
                    
                    // Set up manual input button
                    const manualBtn = container.querySelector('#__fallback_manual_btn');
                    if (manualBtn) {
                        manualBtn.addEventListener('click', () => {
                            showManualQrInputModal();
                        });
                    }
                    
                    // Try native BarcodeDetector first
                    if ('BarcodeDetector' in window && BarcodeDetector.getSupportedFormats) {
                        try {
                            const formats = await BarcodeDetector.getSupportedFormats();
                            if (formats.includes('qr_code')) {
                                this._detector = new BarcodeDetector({ formats: ['qr_code'] });
                            }
                        } catch (e) {
                            console.warn('BarcodeDetector not fully supported:', e);
                        }
                    }
                    
                    if (this._detector) {
                        this._startNativeDetection(onSuccess);
                    } else {
                        const status = container.querySelector('#__html5_qr_status');
                        if (status) {
                            status.textContent = 'Using fallback scanner. Use manual input if needed.';
                            status.style.color = 'var(--warning-color)';
                        }
                    }
                    
                } catch (err) {
                    console.warn('Camera access failed:', err);
                    onError && onError(err);
                    
                    const status = container.querySelector('#__html5_qr_status');
                    if (status) {
                        status.textContent = 'Camera unavailable. Please use manual input.';
                        status.style.color = 'var(--danger-color)';
                    }
                    
                    // Auto-show manual input
                    setTimeout(() => showManualQrInputModal(), 500);
                }
            }

            _startNativeDetection(onSuccess) {
                if (!this._isScanning || !this._detector || !this._video) return;
                
                const detectFrame = async () => {
                    if (!this._isScanning) return;
                    
                    try {
                        if (this._video.readyState >= 2) {
                            const detections = await this._detector.detect(this._video);
                            if (detections && detections.length > 0) {
                                onSuccess(detections[0].rawValue);
                                return;
                            }
                        }
                    } catch (e) {
                        // Continue scanning on error
                    }
                    
                    if (this._isScanning) {
                        this._timer = setTimeout(detectFrame, 300);
                    }
                };
                
                detectFrame();
            }

            clear() {
                this._isScanning = false;
                if (this._timer) {
                    clearTimeout(this._timer);
                    this._timer = null;
                }
                if (this._stream) {
                    this._stream.getTracks().forEach(track => track.stop());
                    this._stream = null;
                }
                const container = document.getElementById(this.elementId);
                if (container) container.innerHTML = '';
            }

            pause() {
                this._isScanning = false;
                if (this._timer) clearTimeout(this._timer);
                if (this._stream) {
                    this._stream.getTracks().forEach(track => track.enabled = false);
                }
            }

            resume() {
                this._isScanning = true;
                if (this._stream) {
                    this._stream.getTracks().forEach(track => track.enabled = true);
                }
                if (this._detector && this._video) {
                    this._startNativeDetection(() => {});
                }
            }
        };
    }

    tryLoadNext();
}

function scanQRCode() {
    console.debug('[EduTrack] scanQRCode invoked', AppState.currentUser);
    
    // Close any existing scanner first
    closeQRScanner();
    
    // Initialize diagnostics
    createQrDiagnostics();
    updateQrDiagnostics('preparing', 'starting');

    if (!AppState.currentUser) {
        showToast('Please log in to scan QR codes', 'error');
        if (typeof showLoginPage === 'function') showLoginPage();
        return;
    }

    if (AppState.currentUser.role !== 'student') {
        showToast('Only students can scan QR codes', 'error');
        return;
    }

    // Check if camera is potentially available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Camera not supported on this device/browser', 'warning');
        showManualQrInputModal();
        return;
    }

    showToast('Preparing QR scanner...', 'info');

    ensureHtml5QrcodeLoaded(() => {
        if (!window.Html5QrcodeScanner) {
            showToast('QR scanner not available. Using manual input.', 'warning');
            showManualQrInputModal();
            return;
        }

        // Remove any existing modal first
        const existingModal = document.getElementById('qrScannerModal');
        if (existingModal) existingModal.remove();

        // Create QR scanner modal
        const scannerModalHTML = `
            <div class="modal active" id="qrScannerModal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-qrcode"></i> Scan Attendance QR Code</h3>
                        <button class="modal-close" id="closeQrScanner">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="qr-reader" style="width: 100%; min-height: 300px;"></div>
                        <div style="text-align: center; margin-top: 1rem;">
                            <p class="qr-instruction" style="color: var(--gray-600); font-size: 0.9rem;">
                                Point your camera at the QR code displayed by your teacher
                            </p>
                            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                                <button class="btn btn-secondary" id="manualInputBtn">
                                    <i class="fas fa-keyboard"></i> Manual Input
                                </button>
                                <button class="btn btn-secondary" id="simulateScanModalBtn">
                                    <i class="fas fa-bolt"></i> Simulate Scan
                                </button>
                                <button class="btn btn-danger" id="stopScannerBtn">
                                    <i class="fas fa-stop"></i> Stop Scanner
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', scannerModalHTML);
        
        // Ensure modal is visible
        const modalEl = document.getElementById('qrScannerModal');
        if (modalEl) {
            modalEl.style.zIndex = '10001';
            document.body.style.overflow = 'hidden';
        } else {
            showToast('Failed to open QR modal', 'error');
            return;
        }

        // Initialize QR scanner
        try {
            html5QrCodeScanner = new Html5QrcodeScanner("qr-reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                rememberLastUsedCamera: true
            });

            html5QrCodeScanner.render(
                (decodedText) => {
                    console.debug('[EduTrack] QR decoded:', decodedText);
                    handleScannedQR(decodedText);
                    closeQRScanner();
                },
                (error) => {
                    // Only log verbose errors, don't show to user
                    if (!error.includes('NotFoundException')) {
                        console.log('QR scan error:', error);
                    }
                }
            );
            
            updateQrDiagnostics('scanner-ready', 'scanning');
            isScannerActive = true;
            
        } catch (err) {
            console.error('[EduTrack] Scanner init error:', err);
            showToast('Scanner failed. Using manual input.', 'error');
            showManualQrInputModal();
            closeQRScanner();
            return;
        }

        // Add event listeners
        setTimeout(() => {
            const closeBtn = document.getElementById('closeQrScanner');
            const stopBtn = document.getElementById('stopScannerBtn');
            const simBtn = document.getElementById('simulateScanModalBtn');
            const manualBtn = document.getElementById('manualInputBtn');
            const modal = document.getElementById('qrScannerModal');

            if (closeBtn) {
                closeBtn.addEventListener('click', closeQRScanner);
            }
            
            if (stopBtn) {
                stopBtn.addEventListener('click', closeQRScanner);
            }
            
            if (simBtn) {
                simBtn.addEventListener('click', () => {
                    simulateQRScanModal();
                    closeQRScanner();
                });
            }
            
            if (manualBtn) {
                manualBtn.addEventListener('click', () => {
                    showManualQrInputModal();
                    closeQRScanner();
                });
            }
            
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        closeQRScanner();
                    }
                });
            }
        }, 100);
    });
}

function closeQRScanner() {
    if (html5QrCodeScanner) {
        try { 
            html5QrCodeScanner.clear(); 
            html5QrCodeScanner = null;
        } catch (e) { 
            console.warn('Error clearing scanner:', e);
        }
    }
    
    const scannerModal = document.getElementById('qrScannerModal');
    if (scannerModal) {
        scannerModal.remove();
    }
    
    isScannerActive = false;
    updateQrDiagnostics('idle', 'scanner closed');
    document.body.style.overflow = '';
}

function showManualQrInputModal() {
    // Close scanner if open
    closeQRScanner();
    
    // Remove existing modal first
    const existingModal = document.getElementById('manualQrModal');
    if (existingModal) existingModal.remove();

    const html = `
        <div class="modal active" id="manualQrModal">
            <div class="modal-content" style="max-width: 480px;">
                <div class="modal-header">
                    <h3><i class="fas fa-keyboard"></i> Manual QR Input</h3>
                    <button class="modal-close" id="closeManualQr">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--gray-700); margin-bottom: 1rem;">
                        Enter the QR code data below. This should be a JSON string from your teacher's QR code.
                    </p>
                    <div class="form-group">
                        <label class="form-label">QR Code Data</label>
                        <textarea 
                            id="manualQrInput" 
                            class="form-control" 
                            style="width:100%;height:120px;font-family:monospace;font-size:0.9rem;" 
                            placeholder='Example: {"type":"attendance","subject":"Mathematics","teacherId":"T2001","timestamp":"2024-01-01T10:00:00Z"}'
                        ></textarea>
                    </div>
                    <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                        <button class="btn" id="processManualQr">
                            <i class="fas fa-check"></i> Process
                        </button>
                        <button class="btn btn-secondary" id="cancelManualQr">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Set high z-index and prevent scroll
    const modal = document.getElementById('manualQrModal');
    if (modal) {
        modal.style.zIndex = '10002';
        document.body.style.overflow = 'hidden';
    }

    // Add event listeners
    setTimeout(() => {
        function closeModal() {
            const m = document.getElementById('manualQrModal');
            if (m) m.remove();
            document.body.style.overflow = '';
        }

        const closeBtn = document.getElementById('closeManualQr');
        const cancelBtn = document.getElementById('cancelManualQr');
        const processBtn = document.getElementById('processManualQr');
        const input = document.getElementById('manualQrInput');

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                const val = input ? input.value.trim() : '';
                if (!val) { 
                    showToast('Please enter QR data first', 'warning'); 
                    return; 
                }
                handleScannedQR(val);
                closeModal();
            });
        }
        
        if (input) {
            input.focus();
            // Add Enter key support
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    processBtn.click();
                }
            });
        }
        
        // Close on background click
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        }
    }, 100);
}

function simulateQRScan() {
    if (!AppState.currentUser || AppState.currentUser.role !== 'student') {
        showToast('Only students can scan QR codes', 'error');
        return;
    }

    if (!confirm('Simulate a QR scan and mark attendance? This will add an attendance entry for you.')) {
        return;
    }

    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Programming', 'Database'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    const fakeQRData = {
        type: 'attendance',
        subject: randomSubject,
        teacherId: 'T2001',
        timestamp: new Date().toISOString(),
        classId: 'CLASS' + Math.floor(Math.random() * 1000),
        expiresIn: 15
    };
    
    handleScannedQR(JSON.stringify(fakeQRData));
}

function simulateQRScanModal() {
    if (!AppState.currentUser || AppState.currentUser.role !== 'student') {
        showToast('Only students can scan QR codes', 'error');
        return;
    }

    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Programming', 'Database'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    const fakeQRData = {
        type: 'attendance',
        subject: randomSubject,
        teacherId: 'T2001',
        timestamp: new Date().toISOString(),
        classId: 'CLASS' + Math.floor(Math.random() * 1000),
        expiresIn: 15
    };
    
    handleScannedQR(JSON.stringify(fakeQRData));
}

function handleScannedQR(qrData) {
    try {
        console.debug('[EduTrack] Processing QR data:', qrData);
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(qrData);
        } catch (e) {
            // If not JSON, try to extract JSON from string
            const jsonMatch = qrData.match(/\{.*\}/);
            if (jsonMatch) {
                data = JSON.parse(jsonMatch[0]);
            } else {
                // Treat as plain text subject
                data = {
                    type: 'attendance',
                    subject: qrData,
                    teacherId: 'Unknown',
                    timestamp: new Date().toISOString(),
                    classId: 'General'
                };
            }
        }
        
        if (!data.type || data.type !== 'attendance') {
            showToast('Invalid QR code: Not an attendance QR', 'error');
            return;
        }
        
        // Check if QR is expired
        const qrTime = new Date(data.timestamp);
        const currentTime = new Date();
        const timeDiff = (currentTime - qrTime) / (1000 * 60); // in minutes
        
        const expiryMinutes = data.expiresIn || 5;
        if (timeDiff > expiryMinutes) {
            showToast(`QR code has expired! (Valid for ${expiryMinutes} minutes)`, 'error');
            return;
        }
        
        // Mark attendance
        markAttendance(data.subject, data.teacherId, data.classId);
        
    } catch (error) {
        console.error('[EduTrack] Error handling QR:', error);
        showToast('Invalid QR code format', 'error');
    }
}

function markAttendance(subject, teacherId = 'Unknown', classId = 'Unknown') {
    if (!AppState.currentUser) {
        showToast('Please log in first', 'error');
        return;
    }
    
    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    
    // Check if already marked for today
    const today = new Date().toISOString().split('T')[0];
    const alreadyMarked = attendance.some(a => 
        a.studentId === AppState.currentUser.id && 
        a.subject === subject && 
        a.date.split('T')[0] === today
    );
    
    if (alreadyMarked) {
        showToast(`Attendance already marked for ${subject} today!`, 'warning');
        return;
    }
    
    // Add new attendance record
    attendance.push({
        studentId: AppState.currentUser.id,
        studentName: AppState.currentUser.name || AppState.currentUser.id,
        subject: subject,
        teacherId: teacherId,
        classId: classId,
        date: new Date().toISOString(),
        status: 'present'
    });
    
    localStorage.setItem('attendance', JSON.stringify(attendance));
    showToast(`Attendance marked for ${subject}! ✅`, 'success');
    
    // Reload dashboard if function exists
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
    
    // Trigger event for UI updates
    document.dispatchEvent(new CustomEvent('attendance-updated'));
}

function openQrGeneratorModal() {
    if (!AppState.currentUser || AppState.currentUser.role !== 'teacher') {
        showToast('Only teachers can generate QR codes', 'error');
        return;
    }

    // Remove existing modal first
    const existingModal = document.getElementById('qrGeneratorModal');
    if (existingModal) existingModal.remove();

    const qrModalHTML = `
        <div class="modal active" id="qrGeneratorModal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-qrcode"></i> Generate Attendance QR</h3>
                    <button class="modal-close" id="closeQrGenerator">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Subject</label>
                        <select class="form-control" id="qrSubject">
                            <option value="Mathematics">Mathematics</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Programming">Programming</option>
                            <option value="Database">Database</option>
                            <option value="English">English</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Custom Subject (if "Other")</label>
                        <input type="text" class="form-control" id="qrCustomSubject" placeholder="Enter custom subject name" style="display: none;">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Class/Group</label>
                        <input type="text" class="form-control" id="qrClassId" placeholder="e.g., CS-101, Group A" value="General">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Valid for (minutes)</label>
                        <select class="form-control" id="qrDuration">
                            <option value="2">2 minutes</option>
                            <option value="5" selected>5 minutes</option>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-primary" id="generateQrBtnModal" style="width: 100%; margin-bottom: 1rem;">
                        <i class="fas fa-qrcode"></i> Generate QR Code
                    </button>
                    
                    <div id="qrCodeContainer" style="text-align: center; display: none;">
                        <div id="qrcode" style="margin: 1rem auto; padding: 1rem; background: white; border-radius: 8px; max-width: 250px;"></div>
                        <p style="color: var(--gray-500); font-size: 0.875rem; margin-top: 0.5rem;">
                            QR Code expires in <span id="qrExpiryTime">5</span> minutes
                        </p>
                        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                            <button class="btn btn-secondary" id="downloadQrBtn">
                                <i class="fas fa-download"></i> Download QR
                            </button>
                            <button class="btn btn-secondary" id="copyQrDataBtn">
                                <i class="fas fa-copy"></i> Copy Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', qrModalHTML);

    // Add event listeners
    setTimeout(() => {
        const closeBtn = document.getElementById('closeQrGenerator');
        const generateBtn = document.getElementById('generateQrBtnModal');
        const subjectSelect = document.getElementById('qrSubject');
        const customSubjectInput = document.getElementById('qrCustomSubject');
        const modal = document.getElementById('qrGeneratorModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeQRGenerator);
        }

        if (subjectSelect && customSubjectInput) {
            subjectSelect.addEventListener('change', function() {
                customSubjectInput.style.display = this.value === 'Other' ? 'block' : 'none';
            });
        }

        if (generateBtn) {
            generateBtn.addEventListener('click', generateQRCodeFromModal);
        }

        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeQRGenerator();
                }
            });
        }
    }, 100);
}

function closeQRGenerator() {
    const generatorModal = document.getElementById('qrGeneratorModal');
    if (generatorModal) {
        generatorModal.remove();
    }
}

function generateQRCodeFromModal() {
    const subjectSelect = document.getElementById('qrSubject');
    const customSubject = document.getElementById('qrCustomSubject');
    const classId = document.getElementById('qrClassId').value.trim() || 'General';
    const duration = parseInt(document.getElementById('qrDuration').value);
    
    // Determine subject
    let subject = subjectSelect.value;
    if (subject === 'Other' && customSubject && customSubject.value.trim()) {
        subject = customSubject.value.trim();
    }
    
    if (!subject) {
        showToast('Please select or enter a subject', 'error');
        return;
    }
    
    // Create QR data
    const qrData = {
        type: 'attendance',
        subject: subject,
        teacherId: AppState.currentUser.id,
        teacherName: AppState.currentUser.name,
        timestamp: new Date().toISOString(),
        classId: classId,
        expiresIn: duration
    };
    
    const qrDataString = JSON.stringify(qrData);
    
    // Generate QR code
    const qrContainer = document.getElementById('qrCodeContainer');
    const qrcodeDiv = document.getElementById('qrcode');
    
    // Clear previous QR
    qrcodeDiv.innerHTML = '';
    
    // Try different QR code generation methods
    let qrGenerated = false;
    
    // Method 1: Use QRCode.js (if available)
    if (typeof QRCode !== 'undefined') {
        try {
            new QRCode(qrcodeDiv, {
                text: qrDataString,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            qrGenerated = true;
        } catch (err) {
            console.error('QRCode.js error:', err);
        }
    }
    
    // Method 2: Use qrcode-generator (if available)
    if (!qrGenerated && typeof qrcode !== 'undefined') {
        try {
            const qr = qrcode(0, 'M');
            qr.addData(qrDataString);
            qr.make();
            qrcodeDiv.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0 });
            qrGenerated = true;
        } catch (err) {
            console.error('qrcode-generator error:', err);
        }
    }
    
    // Method 3: Fallback to text display
    if (!qrGenerated) {
        qrcodeDiv.innerHTML = `
            <div style="padding: 2rem; background: #f5f5f5; border-radius: 4px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #f39c12; margin-bottom: 1rem;"></i>
                <p style="color: #666; margin-bottom: 1rem;">QR library not available</p>
                <div style="background: white; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; text-align: left; word-break: break-all;">
                    ${qrDataString}
                </div>
            </div>
        `;
        showToast('QR library not found. Displaying data as text.', 'warning');
    }
    
    // Update expiry time display
    document.getElementById('qrExpiryTime').textContent = duration;
    
    // Show QR container
    qrContainer.style.display = 'block';
    
    // Scroll to QR code
    qrContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Add download functionality
    const downloadBtn = document.getElementById('downloadQrBtn');
    if (downloadBtn) {
        downloadBtn.onclick = function() {
            const canvas = qrcodeDiv.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `${subject.replace(/[^a-z0-9]/gi, '_')}_${classId}_${new Date().toISOString().split('T')[0]}.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('QR code downloaded', 'success');
            } else {
                // Try to download SVG
                const svg = qrcodeDiv.querySelector('svg');
                if (svg) {
                    const serializer = new XMLSerializer();
                    const source = serializer.serializeToString(svg);
                    const blob = new Blob([source], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `${subject.replace(/[^a-z0-9]/gi, '_')}_${classId}_${new Date().toISOString().split('T')[0]}.svg`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast('QR code downloaded as SVG', 'success');
                } else {
                    showToast('Cannot download QR code image', 'error');
                }
            }
        };
    }
    
    // Add copy data functionality
    const copyBtn = document.getElementById('copyQrDataBtn');
    if (copyBtn) {
        copyBtn.onclick = function() {
            navigator.clipboard.writeText(qrDataString).then(() => {
                showToast('QR data copied to clipboard', 'success');
            }).catch(err => {
                console.error('Failed to copy:', err);
                showToast('Failed to copy data', 'error');
            });
        };
    }
    
    showToast(`QR code generated for ${subject}`, 'success');
}

// Initialize QR functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add QR library preload if needed
    if (!window.Html5QrcodeScanner && !window.Html5Qrcode) {
        // Preload QR scanner library in background
        ensureHtml5QrcodeLoaded(() => {
            console.debug('[EduTrack] QR scanner preloaded');
        });
    }
    
    // Add QR code generator library if not present
    if (!window.QRCode && !window.qrcode) {
        const qrLibScript = document.createElement('script');
        qrLibScript.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        qrLibScript.async = true;
        document.head.appendChild(qrLibScript);
    }
});