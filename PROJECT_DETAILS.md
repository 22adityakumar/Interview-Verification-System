# Project Details: Interpreter Watchdog (Audit & Verification System)

This document provides a comprehensive overview of the **Interpreter Watchdog** project, a specialized tool designed to verify and audit real-time translations during bilingual meetings and interviews.

---

## 1. Objective
The primary objective of **Interpreter Watchdog** is to provide an automated, real-time verification and logging system for multi-language communication. Specifically, it:
- Monitors and records dual audio channels: **"To Interviewer"** (interpreting candidate speech to interviewer) and **"To Candidate"** (interpreting interviewer speech to candidate).
- Translates speech independently to a target verification language to cross-examine human interpreter performance.
- Calculates translation confidence levels using speech token metrics.
- Automatically saves structured audit trails to local CSV logs and cloud databases (Supabase) for offline auditing, compliance, and quality control.

---

## 2. Problem Statement
In bilingual settings (e.g., an English-speaking interviewer evaluating a Japanese-speaking candidate through a human interpreter):
1. **Lack of Verification**: The interviewer has no direct way to check if the interpreter is translating their questions accurately, or if the candidate's answers are being modified, summarized, or embellished.
2. **Loss of Technical Nuance**: Interpreters might struggle with domain-specific jargon (e.g., machine learning concepts, systems engineering) and gloss over details.
3. **High Latency & Hardware Costs**: Running high-fidelity local Automatic Speech Recognition (ASR) models (like Whisper Large) requires expensive GPU hardware and causes significant transcription lag, disrupting the live conversational flow.
4. **No Audit Logs**: Standard video calling tools do not log the original untranslated speech alongside the interpreter's version, making historical audit and dispute resolution impossible.

---

## 3. Solution
The **Interpreter Watchdog** application is a lightweight, dockerized Flask web server that interfaces with high-speed AI inference endpoints to verify translations on the fly:
* **Dual-Channel Interface**: Separated panels for "To Interviewer" and "To Candidate" verification with active visualizers, language selectors, and confidence meters.
* **API-Driven Transcription**: Uses **Groq's cloud-based Whisper-large-v3** model to perform automatic language detection and transcription in milliseconds, bypassing the need for local GPU resources.
* **Instant Verification**: Leverages translation layers (Google Translate) to output a verified translation side-by-side with the original transcript.
* **Audit Trail**: Logs all translated segments with timestamps, directions, detected languages, and confidence scores directly to `manual_audit_log.csv` and interfaces with Supabase for cloud history sync.

---

## 4. Current vs. Our Solution

| Feature | Current/Traditional Approach | Our Solution (Interpreter Watchdog) |
| :--- | :--- | :--- |
| **Trust Model** | Blind trust in the interpreter with no validation. | Active, side-by-side verification and translation audits. |
| **ASR Execution** | Local Whisper models inside containers (heavy CPU/GPU load, high latency). | Offloaded to Groq's LPUs (ultra-low latency transcription in milliseconds). |
| **Hardware Overhead** | Requires local GPUs or high-spec instances. | Zero local ML overhead; runs on low-spec docker hosts. |
| **Auditing & Logs** | Manual notes or simple audio recordings. | Structured CSV logs containing timestamps, raw speech, translations, and confidence metrics. |
| **Quality Control** | None; translation mistakes remain unnoticed. | Progress-bar indicators showing Whisper's confidence score for each transcribed segment. |

---

## 5. Technology Stack
* **Backend Framework**: Python 3.12, Flask, Flask-Cors
* **Async Workers**: Gunicorn, Gevent-Websocket (supports Socket.IO for future real-time broadcasts)
* **AI & Language Processing**:
  - **Speech-to-Text**: Groq API (`whisper-large-v3` running on LPU accelerators)
  - **Machine Translation**: `deep-translator` library (Google Translate Engine)
* **Database**: Supabase client (`supabase-py` for cloud-based historical reports)
* **Frontend**: Vanilla HTML5, CSS3 (glassmorphic dark UI, CSS variables, keyframe visualizer animations), Vanilla Javascript (Web MediaRecorder API, client-side timers, dynamic DOM updates)
* **Containerization**: Docker, Docker Compose

---

## 6. Benefits
* **High Efficiency**: Whisper Large V3 runs on Groq's high-speed chips, generating transcriptions in milliseconds so verification does not lag behind the conversation.
* **Cost-Effective**: Offloading heavy computing to API endpoints eliminates the need for expensive GPU cloud instances.
* **Auditing & Compliance**: Creates detailed compliance transcripts automatically (`manual_audit_log.csv`), crucial for corporate hiring compliance and legal checks.
* **Bilingual Flexibility**: Supports dynamic target language switching (e.g., verifying in English, Japanese, Hindi, or Spanish) on the fly.
* **Confidence Assurance**: Helps interviewers immediately notice when transcription quality is low (low confidence scores) so they can ask the candidate/interpreter to repeat if necessary.

---

## 7. Conclusion
The **Interpreter Watchdog** bridges the communication verification gap in multi-lingual meetings. By implementing a lightweight, API-first architecture, the application provides real-time verification of speech translation without heavy local hardware dependency. It ensures that interview evaluations remain fair, accurate, and fully auditable.

---

## 8. Future Scope
1. **Automated AI Discrepancy Auditing**: Integrate an LLM (e.g., Llama-3-70B on Groq or Gemini-Pro) to compare the candidate's original transcript with what the interpreter said, automatically highlighting discrepancies, omissions, or embellishments.
2. **Direct WebRTC Feed Integration**: Capture audio streams directly from virtual meeting platforms (Zoom, Teams, Google Meet) instead of relying solely on browser microphone inputs.
3. **Interactive Dashboard**: Build out the login and past-interview history dashboard interface (connecting to the Supabase client) to let managers search, review, and replay past auditable interviews.
4. **Text-To-Speech (TTS) Ear-piece Feed**: Implement real-time synthesized audio feedback so the auditor can listen to the verified translation directly in their earpiece.
