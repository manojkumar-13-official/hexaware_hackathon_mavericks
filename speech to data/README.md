# Citizen Call Intelligence — Demo Dashboard

A demo dashboard for extracting structured, actionable intelligence from citizen helpline call recordings using the **Gemini 2.5 Flash** API. Complaints are stored in MongoDB, deduplicated using a RAG vector similarity pipeline, and visualised on an interactive heatmap.

---

## Architecture

```
Browser (index.html + app.js)
    │
    ├─ [Gemini API] ──► Direct call for audio → structured JSON (Sections 1–6)
    │
    └─ [localhost:8085] Express Server (server.js)
            │
            ├─ MongoDB  ──► tickets & wards collections
            └─ [localhost:5001] embed_server.py  ──► Sentence Transformers embeddings
```

> **Two servers must be running** for the full feature set. The Gemini analysis (Tab 1) works client-side only; MongoDB storage, duplicate detection, heatmap, and review queue all require the backend.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 18 | https://nodejs.org |
| MongoDB | >= 6 (local) or Atlas | https://www.mongodb.com/try/download/community |
| Python | >= 3.9 | https://www.python.org |
| sentence-transformers | Latest | `pip install sentence-transformers` |

---

## Quickstart

### 1 — Install Node dependencies

```bash
cd "speech to data"
npm install
```

### 2 — Start the Python embedding microservice

```bash
cd "speech to data"
python embed_server.py
```

Expected output:
```
Loading model from local cache: ...
Model loaded successfully. Listening on http://localhost:5001
```

> **First run only:** the model (all-MiniLM-L6-v2, ~90 MB) is downloaded and cached automatically.
> If the embedding server is NOT running, tickets still save to MongoDB but with an empty embedding — duplicate detection is skipped for those entries and needs_manual_review is set to true automatically.

### 3 — Start the Node backend

Open a **second terminal**:

```bash
cd "speech to data"
node server.js
```

Expected output:
```
Seeded 25 wards into reference collection.   <- first run only
Database initialized successfully!
Server listening on port 8085
```

### 4 — Open the dashboard

Navigate to **http://localhost:8085** in your browser.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8085` | Port for the Express server |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |

Example for MongoDB Atlas:
```bash
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/" node server.js
```

---

## Using the Dashboard

### Tab 1 — Single Upload (Analysis)
1. Enter your **Gemini API Key** (stored only in memory, sent directly to Google)
2. Upload an audio file (MP3, WAV, M4A, OGG)
3. Click **Analyse Call** — Gemini extracts structured JSON
4. After results render, a **Save Status card** confirms the ticket ID, ward match, and duplicate status

### Tab 2 — Official Dashboard
- Live metrics strip: Total, Active/Open, Pending Review
- Heatmap of geocoded complaints by ward centroid (Chennai municipal wards)
- Filter by Sector Domain and Time Window

### Tab 3 — Review Queue
- Potential Duplicate cards: side-by-side comparison with semantic similarity % and Gemini AI suggestion
- Location Normalisation cards: assign a ward + verify sector for unrecognised locations

---

## Demo Audio Files

| File | Scenario | Sentiment |
|------|----------|-----------|
| 01_angry.mp3 | Water supply outage — Ward 80, Gandhi Nagar | Angry (4) |
| 02_fearful.mp3 | Building fire — Second Cross Street | Fearful (5) / Emergency |
| 03_sad.mp3 | Pension not received for 3 months | Sad (3) |
| 04_happy.mp3 | Thank-you call for garbage resolution | Happy (2) |
| 05_neutral.mp3 | Street light malfunction — Anand Nagar | Neutral (1) |

To test duplicate detection: analyse `01_angry.mp3` **twice** — the second submission should be flagged as needs_review or auto_duplicate.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Heatmap shows "No data" | No tickets in DB yet | Analyse a call first |
| "Save Failed" toast after analysis | server.js not running | Run `node server.js` |
| Embedding warns in server log | embed_server.py not running | Run `python embed_server.py` |
| ECONNREFUSED port 27017 | MongoDB not running | Start `mongod` or use Atlas URI |
| Fonts look like system sans-serif | No internet | Google Fonts CDN requires network access |
