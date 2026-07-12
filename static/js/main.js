const socket = io();
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const userRoleSelect = document.getElementById('userRole');
const interviewerRecord = document.getElementById('interviewerRecord');
const candidateRecord = document.getElementById('candidateRecord');
const interviewerTranscript = document.getElementById('interviewerTranscript');
const candidateTranscript = document.getElementById('candidateTranscript');
const status = document.getElementById('status');
const endInterviewBtn = document.getElementById('endInterviewBtn');
const reportOverlay = document.getElementById('reportOverlay');
const reportContent = document.getElementById('reportContent');
const closeReportBtn = document.getElementById('closeReportBtn');

// Handle incoming messages via Socket.IO
socket.on('new_message', (data) => {
    addMessageToUI(data);
    speakTranslation(data);
});

function addMessageToUI(data) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', data.role);
    
    messageDiv.innerHTML = `
        <span class="original">${data.original} (${data.detected_lang})</span>
        <span class="translated">${data.translated}</span>
    `;
    
    interviewerTranscript.appendChild(messageDiv.cloneNode(true));
    candidateTranscript.appendChild(messageDiv);
    
    interviewerTranscript.scrollTop = interviewerTranscript.scrollHeight;
    candidateTranscript.scrollTop = candidateTranscript.scrollHeight;
}

function speakTranslation(data) {
    const currentUserRole = userRoleSelect.value;
    if (data.role !== currentUserRole) {
        const utterance = new SpeechSynthesisUtterance(data.translated);
        utterance.lang = data.target_lang === 'ja' ? 'ja-JP' : 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}

async function startRecording(role) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            sendAudioToBackend(audioBlob, role);
        };

        mediaRecorder.start();
        isRecording = true;
        updateRecordingUI(role, true);
        status.textContent = 'Listening...';
    } catch (err) {
        console.error('Mic error:', err);
        alert('Could not access microphone.');
    }
}

function stopRecording(role) {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        updateRecordingUI(role, false);
        status.textContent = 'Processing...';
    }
}

function updateRecordingUI(role, recording) {
    const btn = role === 'interviewer' ? interviewerRecord : candidateRecord;
    if (recording) {
        btn.textContent = 'Stop Speaking';
        btn.classList.add('recording');
    } else {
        btn.textContent = 'Start Speaking';
        btn.classList.remove('recording');
    }
}

async function sendAudioToBackend(audioBlob, role) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('role', role);

    try {
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            status.textContent = 'Ready';
        } else {
            status.textContent = 'Error processing audio';
        }
    } catch (err) {
        console.error('Network error:', err);
        status.textContent = 'Network error';
    }
}

// Verification Logic
endInterviewBtn.addEventListener('click', async () => {
    const candidateName = document.getElementById('candidateName').value;
    if (!confirm(`End interview for ${candidateName} and generate report?`)) return;
    
    reportOverlay.classList.remove('hidden');
    reportContent.innerHTML = '<p>Analyzing data & saving to database... Please wait.</p>';

    try {
        const response = await fetch('/verify', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate_name: candidateName })
        });
        const data = await response.json();

        if (data.report) {
            const report = JSON.parse(data.report);
            displayReport(report);
        } else {
            reportContent.innerHTML = `<p class="error">Error: ${data.error || 'Failed to generate report'}</p>`;
        }
    } catch (err) {
        console.error('Verification error:', err);
        reportContent.innerHTML = '<p class="error">Network error during verification.</p>';
    }
});

function displayReport(report) {
    reportContent.innerHTML = `
        <div class="report-item">
            <h4>Confidence Score: ${report.confidence_score}/100</h4>
            <progress value="${report.confidence_score}" max="100" style="width: 100%"></progress>
        </div>
        <div class="report-item">
            <h4>Summary</h4>
            <p>${report.summary}</p>
        </div>
        <div class="report-item">
            <h4>Answer Consistency</h4>
            <p>${report.consistency}</p>
        </div>
        <div class="report-item">
            <h4>Relevance</h4>
            <p>${report.relevance}</p>
        </div>
        <div class="report-item">
            <h4>Red Flags</h4>
            <p>${report.red_flags}</p>
        </div>
    `;
}

closeReportBtn.addEventListener('click', async () => {
    await fetch('/reset', { method: 'POST' });
    interviewerTranscript.innerHTML = '';
    candidateTranscript.innerHTML = '';
    reportOverlay.classList.add('hidden');
});

// Event Listeners
interviewerRecord.addEventListener('click', () => {
    if (userRoleSelect.value !== 'interviewer') return alert('Please switch your role to Interviewer first.');
    if (!isRecording) startRecording('interviewer');
    else stopRecording('interviewer');
});

candidateRecord.addEventListener('click', () => {
    if (userRoleSelect.value !== 'candidate') return alert('Please switch your role to Candidate first.');
    if (!isRecording) startRecording('candidate');
    else stopRecording('candidate');
});
