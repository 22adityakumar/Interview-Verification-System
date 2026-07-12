# Interpreter Watchdog (Audit & Verification System)

Interpreter Watchdog is a specialized verification and auditing tool designed to monitor and check real-time translations during bilingual meetings, interviews, and audits. It helps ensure quality control, compliance, and accuracy by comparing human translations against cloud-based AI translation baselines.

---

## 🚀 Key Features

* **Dual-Channel Monitoring**: Tracks separate channels for "To Interviewer" (candidate-to-interviewer) and "To Candidate" (interviewer-to-candidate) translation paths.
* **Ultra-Low Latency Transcription**: Offloads speech-to-text processing to Groq's high-speed API endpoints using the `whisper-large-v3` model.
* **Instant Verification**: Leverages translation layers (Google Translate) to display verified side-by-side translation baselines for non-native languages.
* **Whisper Confidence Tracking**: Analyzes speech token metrics (average log probabilities) to calculate a rough confidence score (0-100%) for each audio segment.
* **Comprehensive Audit Trail**: Automatically logs all events with timestamps, directions, languages, original text, verified translation, and confidence scores locally into `manual_audit_log.csv`.
* **Database Sync Ready**: Ready for cloud synchronization with Supabase integration for historical reporting and dashboard tracking.
* **Containerized Deployment**: Ready-to-go `Dockerfile` and `docker-compose.yml` for quick, cross-platform deployment.

---

## 🛠️ Technology Stack

* **Backend Framework**: Python 3.12, Flask, Flask-Cors
* **Async Server/WS**: Gunicorn, Gevent-Websocket (supports Socket.IO)
* **Speech-to-Text**: Groq Cloud API (`whisper-large-v3`)
* **Machine Translation**: `deep-translator` library (Google Translate Engine)
* **Database (Optional/Audit Sync)**: Supabase client (`supabase-py`)
* **Frontend**: Vanilla HTML5, CSS3 (glassmorphic dark UI, CSS variables, keyframe animations), Vanilla Javascript (Web MediaRecorder API, client-side recorders)
* **Containerization**: Docker, Docker Compose

---

## 📋 Prerequisites & Configuration

Before running the application, you need to configure the required environment variables.

Create a `.env` file in the root directory (this file is ignored by git to keep your secrets safe):

```env
# Flask Application Secret Key
SECRET_KEY=your-secret-key-here

# Groq API Configuration (Required for Speech-to-Text)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Supabase Configuration (Optional - for database syncing)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key-here
```

---

## 💻 Getting Started

### Method 1: Local Installation (Python)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/22adityakumar/Interview-Verification-System.git
   cd Interview-Verification-System
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```
   Open your browser and navigate to `http://localhost:5000`.

---

### Method 2: Containerized Installation (Docker)

To run the application inside Docker containers (Gunicorn + Gevent production server):

1. **Build and start the container**:
   ```bash
   docker-compose up --build
   ```

2. **Stop the container**:
   ```bash
   docker-compose down
   ```

---

## 📂 Project Structure

```
├── app.py                # Main Flask application and translation routes
├── Dockerfile            # Container configuration for production deployment
├── docker-compose.yml    # Compose file mapping environment & volumes
├── requirements.txt      # Python dependencies
├── PROJECT_DETAILS.md    # Detailed project documentation & roadmap
├── test_supabase.py      # Script to verify database connectivity
├── manual_audit_log.csv  # Auto-generated audit log (excluded from git)
├── templates/            # Frontend templates
│   ├── index.html        # Main Watchdog dashboard UI
│   ├── login.html        # Login screen
│   └── dashboard.html    # Analytics dashboard
└── static/               # Client-side assets (CSS, JS)
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

---

## 📊 Audit & Logs

The system records translations in the root directory under `manual_audit_log.csv`. 
Each record contains the following columns:
* **Timestamp**: Time of the event (e.g. `10:35:12 AM`).
* **Direction**: Who the target translation is for (`To Interviewer` or `To Candidate`).
* **Detected Lang**: The source language detected by Whisper.
* **Target Lang**: The translation language selected by the interviewer.
* **Original Speech**: The transcription returned by Groq Whisper.
* **Verified Translation**: The translated version from the Google Translate API.
* **Confidence**: Whisper's transcription confidence score.

The log file can be downloaded directly from the dashboard by clicking the **Export Audit Log (CSV)** button.