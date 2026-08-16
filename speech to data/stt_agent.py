"""
stt_agent.py — Multilingual Speech-to-Text Agent
=================================================
FastAPI microservice — runs continuously on port 5002.

TWO MODES:
  • With GEMINI_API_KEY set  → uses Gemini 2.5 Flash for real AI transcription
  • Without GEMINI_API_KEY   → echoes back a mock transcript so the frontend
                               still works end-to-end during development

Endpoints:
  GET  /health      — liveness probe (called by React every 15s)
  POST /transcribe  — multipart/form-data: audio file → JSON transcript

Run:
  pip install fastapi uvicorn python-multipart google-generativeai
  python stt_agent.py

With API key:
  set GEMINI_API_KEY=AIza...    (Windows CMD)
  $env:GEMINI_API_KEY="AIza..."  (PowerShell)
  python stt_agent.py
"""

from __future__ import annotations

import os
import time
import base64
import json
import logging
import traceback

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ──────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────

PORT           = int(os.getenv("STT_PORT",    "5002"))
GEMINI_MODEL   = os.getenv("GEMINI_MODEL",    "gemini-2.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY",  "").strip()

logging.basicConfig(
    level=logging.INFO,
    format="[stt_agent] %(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("stt_agent")

# ──────────────────────────────────────────────────────────────
# Gemini client — lazy, only if key is present
# ──────────────────────────────────────────────────────────────

_model = None

def get_model():
    global _model
    if _model is not None:
        return _model
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel(GEMINI_MODEL)
        log.info("Gemini model loaded: %s", GEMINI_MODEL)
        return _model
    except Exception as e:
        log.error("Failed to load Gemini model: %s", e)
        return None

# ──────────────────────────────────────────────────────────────
# Language map
# ──────────────────────────────────────────────────────────────

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English", "hi": "Hindi", "ta": "Tamil",
    "te": "Telugu",  "kn": "Kannada", "ml": "Malayalam",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "pa": "Punjabi", "or": "Odia",   "ur": "Urdu",
}

# ──────────────────────────────────────────────────────────────
# System prompt
# ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert multilingual transcription engine for a
government citizen-complaint platform in India.

TASK:
1. Transcribe the spoken audio EXACTLY as spoken (preserve original language).
2. Detect the primary language and return its ISO 639-1 code.
3. If the language is NOT English, also provide a natural English translation.
4. Estimate confidence (0.0–1.0).

Return ONLY valid JSON — no markdown, no code fences:
{
  "transcript":        "<exact transcription in original language>",
  "translated_text":   "<English translation — same as transcript if already English>",
  "detected_language": "<ISO 639-1 code>",
  "language_name":     "<e.g. Tamil>",
  "confidence":        <float 0.0-1.0>
}

Rules:
- Never hallucinate content not in the audio.
- If silent: transcript="" confidence=0.0
- Preserve numbers, place names, proper nouns as heard.
"""

# ──────────────────────────────────────────────────────────────
# MIME type normaliser
# ──────────────────────────────────────────────────────────────

MIME_MAP = {
    "audio/mpeg":  "audio/mp3",
    "audio/mp3":   "audio/mp3",
    "audio/wav":   "audio/wav",
    "audio/x-wav": "audio/wav",
    "audio/m4a":   "audio/mp4",
    "audio/x-m4a": "audio/mp4",
    "audio/ogg":   "audio/ogg",
    "audio/webm":  "audio/webm",
}

# ──────────────────────────────────────────────────────────────
# Response model
# ──────────────────────────────────────────────────────────────

class TranscribeResponse(BaseModel):
    transcript:        str
    translated_text:   str
    detected_language: str
    language_name:     str
    confidence:        float
    is_translated:     bool
    processing_ms:     int
    mode:              str   # "gemini" | "mock"

# ──────────────────────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="GovConnect STT Agent",
    description="Multilingual Speech-to-Text — Gemini 2.5 Flash",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model":  GEMINI_MODEL,
        "port":   PORT,
        "mode":   "gemini" if GEMINI_API_KEY else "mock",
        "key_set": bool(GEMINI_API_KEY),
    }


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio:    UploadFile = File(...),
    language: str        = Form(""),
):
    t_start = time.monotonic()

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    mime_type = MIME_MAP.get(audio.content_type or "audio/webm", "audio/webm")
    log.info("transcribe  size=%d bytes  mime=%s  lang_hint=%s",
             len(audio_bytes), mime_type, language or "auto")

    model = get_model()

    # ── GEMINI MODE ────────────────────────────────────────────
    if model is not None:
        try:
            import google.generativeai as genai

            b64 = base64.b64encode(audio_bytes).decode("utf-8")

            hint = ""
            if language:
                lang_name = LANGUAGE_NAMES.get(language.split("-")[0], language)
                hint = f" Language hint: {lang_name}."

            response = model.generate_content(
                contents=[
                    {
                        "role": "user",
                        "parts": [
                            {"inline_data": {"mime_type": mime_type, "data": b64}},
                            {"text": f"Transcribe and translate this audio.{hint}"},
                        ],
                    }
                ],
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                    max_output_tokens=2048,
                ),
                system_instruction=SYSTEM_PROMPT,
            )

            raw = response.text.strip()
            # Strip accidental markdown fences
            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1] if len(parts) > 1 else raw
                if raw.startswith("json"):
                    raw = raw[4:]

            data = json.loads(raw)

            transcript      = str(data.get("transcript", "")).strip()
            translated_text = str(data.get("translated_text", transcript)).strip()
            detected_lang   = str(data.get("detected_language", "en")).lower().strip()
            lang_name       = str(data.get("language_name",
                                           LANGUAGE_NAMES.get(detected_lang, detected_lang)))
            confidence      = float(data.get("confidence", 0.9))
            is_translated   = detected_lang != "en" and translated_text != transcript

            log.info("gemini ok  lang=%s  conf=%.2f  %d ms",
                     detected_lang, confidence,
                     int((time.monotonic() - t_start) * 1000))

            return TranscribeResponse(
                transcript=transcript,
                translated_text=translated_text,
                detected_language=detected_lang,
                language_name=lang_name,
                confidence=confidence,
                is_translated=is_translated,
                processing_ms=int((time.monotonic() - t_start) * 1000),
                mode="gemini",
            )

        except Exception:
            log.error("Gemini transcription failed:\n%s", traceback.format_exc())
            raise HTTPException(status_code=502,
                                detail="Gemini API call failed. Check server logs.")

    # ── MOCK MODE (no API key) ─────────────────────────────────
    # Returns a realistic mock response so the React form still works
    # for UI testing without a real API key.
    log.warning("No GEMINI_API_KEY — returning mock transcript.")

    lang_code = (language.split("-")[0] if language else "en") or "en"
    lang_name_mock = LANGUAGE_NAMES.get(lang_code, "English")

    mock_transcripts: dict[str, tuple[str, str]] = {
        "ta": (
            "என் வீட்டிற்கு முன்னால் உள்ள சாலையில் பெரிய குழி உள்ளது. இது கடந்த இரண்டு மாதங்களாக இருக்கிறது.",
            "There is a big pothole on the road in front of my house. This has been there for the past two months.",
        ),
        "hi": (
            "मेरे घर के सामने की सड़क पर एक बड़ा गड्ढा है। यह दो महीनों से है और दुर्घटनाएं हो रही हैं।",
            "There is a big pothole on the road in front of my house. It has been there for two months and accidents are happening.",
        ),
        "te": (
            "మా ఇంటి ముందు రోడ్డులో పెద్ద గుంత ఉంది. రెండు నెలల నుండి ఇది ఉంది.",
            "There is a big pothole on the road in front of our house. It has been there for two months.",
        ),
        "en": (
            "The road in front of my house has a large pothole causing accidents. This needs urgent repair.",
            "The road in front of my house has a large pothole causing accidents. This needs urgent repair.",
        ),
    }

    original, translation = mock_transcripts.get(
        lang_code, mock_transcripts["en"]
    )
    is_translated = lang_code != "en"

    return TranscribeResponse(
        transcript=original,
        translated_text=translation,
        detected_language=lang_code,
        language_name=lang_name_mock,
        confidence=0.85,
        is_translated=is_translated,
        processing_ms=int((time.monotonic() - t_start) * 1000),
        mode="mock",
    )


# ──────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mode = "GEMINI (live)" if GEMINI_API_KEY else "MOCK (no API key — set GEMINI_API_KEY to enable)"
    log.info("=" * 60)
    log.info("GovConnect STT Agent  v1.1.0")
    log.info("Port  : %d", PORT)
    log.info("Model : %s", GEMINI_MODEL)
    log.info("Mode  : %s", mode)
    log.info("=" * 60)

    uvicorn.run(
        "stt_agent:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info",
        workers=1,
    )
