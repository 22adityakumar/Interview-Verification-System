import os
import csv
import tempfile
import json
import psutil
from groq import Groq
from flask import Flask, request, jsonify, render_template, send_file
from flask_socketio import SocketIO, emit
from deep_translator import GoogleTranslator
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'high-fidelity-audit-secret')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
LOG_FILE = 'manual_audit_log.csv'
SESSION_START = datetime.now()

@app.route('/export_csv')
def export_csv():
    if os.path.exists(LOG_FILE):
        return send_file(LOG_FILE, as_attachment=True)
    return jsonify({"error": "No log file found"}), 404

def log_to_csv(data):
    file_exists = os.path.isfile(LOG_FILE)
    with open(LOG_FILE, 'a', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(['Timestamp', 'Direction', 'Detected Lang', 'Target Lang', 'Original Speech', 'Verified Translation', 'Confidence'])
        writer.writerow([
            data['timestamp'],
            data['target_person'],
            data['detected_lang'],
            data['target_lang'],
            data['original'],
            data['display_text'],
            data['confidence']
        ])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/system_stats')
def system_stats():
    # Only return whisper status as other stats were removed from UI
    # We'll check if the API key is set as a proxy for status
    api_status = "Running" if os.getenv("GROQ_API_KEY") else "Off"
    return jsonify({
        "whisper_status": api_status
    })

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio"}), 400
    
    target_person = request.form.get('target_person')
    target_lang = request.form.get('target_lang', 'en')
    
    audio_file = request.files['audio']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
        audio_file.save(tmp_file.name)
        tmp_path = tmp_file.name

    try:
        # Transcribe with Groq's Whisper
        with open(tmp_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(tmp_path, file.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
            )
        
        original_text = transcription.text.strip()
        detected_lang = transcription.language
        
        # Calculate a rough confidence score from segment tokens if available
        avg_logprob = 0
        segments = getattr(transcription, 'segments', [])
        if segments and len(segments) > 0:
            logprobs = []
            for s in segments:
                # Handle both object (pydantic) and dictionary structures
                lp = getattr(s, 'avg_logprob', None)
                if lp is None and isinstance(s, dict):
                    lp = s.get('avg_logprob')
                if lp is not None:
                    logprobs.append(lp)
            
            if logprobs:
                avg_logprob = sum(logprobs) / len(logprobs)
        
        # Convert logprob to a 0-100 scale (logprob is usually -1 to 0)
        confidence = min(100, max(0, int((1 + avg_logprob) * 100)))

        if original_text:
            display_text = GoogleTranslator(source='auto', target=target_lang).translate(original_text)
            timestamp = datetime.now().strftime("%I:%M:%S %p")
            
            audit_data = {
                "timestamp": timestamp,
                "target_person": target_person,
                "detected_lang": detected_lang,
                "target_lang": target_lang,
                "original": original_text,
                "display_text": display_text,
                "confidence": f"{confidence}%"
            }
            
            log_to_csv(audit_data)

            return jsonify(audit_data)
        
        return jsonify({"error": "No speech detected"}), 400
    except Exception as e:
        print(f"Transcription Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000, use_reloader=False)
