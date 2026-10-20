// ==============================================
// VOICE COMMAND SYSTEM
// ==============================================
function initVoiceCommands() {
    const buttons = [
        document.getElementById('voiceIndicator'),
        document.getElementById('voiceToggle')
    ].filter(Boolean);
    
    if (buttons.length === 0) return;
    
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!AppState.isVoiceActive) {
                startVoiceRecognition();
            } else {
                stopVoiceRecognition();
            }
        });
    });
}

function startVoiceRecognition() {
    AppState.isVoiceActive = true;
    const indicators = [
        document.getElementById('voiceIndicator'),
        document.getElementById('voiceToggle')
    ].filter(Boolean);
    indicators.forEach(el => el.classList.add('listening'));
    showToast('Listening for voice commands...', 'info');
    
    // Simulate voice command processing
    setTimeout(() => {
        if (!AppState.isVoiceActive) return;
        const commands = [
            'show dashboard',
            'scan qr code',
            'view attendance',
            'check marks',
            'generate report'
        ];
        
        const randomCommand = commands[Math.floor(Math.random() * commands.length)];
        processVoiceCommand(randomCommand);
        
        // Auto-stop after 4 seconds
        setTimeout(stopVoiceRecognition, 4000);
    }, 1000);
}

function stopVoiceRecognition() {
    AppState.isVoiceActive = false;
    const indicators = [
        document.getElementById('voiceIndicator'),
        document.getElementById('voiceToggle')
    ].filter(Boolean);
    indicators.forEach(el => el.classList.remove('listening'));
    showToast('Voice recognition stopped', 'info');
}


function processVoiceCommand(command) {
    showToast(`Voice command: "${command}"`, 'success');
    
    switch(command.toLowerCase()) {
        case 'show dashboard':
            loadDashboard();
            break;
        case 'scan qr code':
            simulateQRScan();
            break;
        case 'view attendance':
            showToast('Showing attendance records...', 'info');
            break;
        case 'check marks':
            showToast('Opening marks overview...', 'info');
            break;
        case 'generate report':
            exportData();
            break;
    }
}