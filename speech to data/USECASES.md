# 🎙️ Speech-to-Data — AI-Powered Citizen Call Intelligence

## Overview

The **`speech to data`** module is the AI engine of the Hexaware Hackathon Mavericks project. It transforms raw citizen helpline audio recordings into **structured, searchable, deduplicated complaint tickets** using a combination of Gemini 2.5 Flash, a RAG vector similarity pipeline, and a MongoDB-backed analytics dashboard — all served through a single polished web interface.

---

## Problem Statement

Municipal helplines receive hundreds of audio calls daily. Operators must:
- Manually transcribe and categorise each call
- Identify duplicate complaints from different callers about the same issue
- Route complaints to the right department
- Understand geographic hotspots of civic problems

This is slow, error-prone, and impossible to scale. **Speech-to-Data automates the entire pipeline.**

---

## Use Cases

### 🎯 Use Case 1 — Single Call Analysis (Tab 1: Single Upload)

**Actor:** Helpline supervisor / Call centre operator  
**Trigger:** An audio recording of a citizen complaint arrives  

**Flow:**
1. Operator uploads an MP3/WAV/M4A/OGG recording via drag-and-drop
2. The app sends the audio inline to **Gemini 2.5 Flash** with a strict extraction schema
3. Gemini returns a structured JSON in under 5 seconds containing:
   - Complaint description summary
   - Caller name & age (only if stated — never hallucinated)
   - Incident location & confidence level
   - Sector domain (Water, Electricity, Roads, Health, etc.)
   - Priority level (Low / Medium / High / Critical)
   - Emergency flag (fire, collapse, violence only)
   - Sentiment class (Neutral / Happy / Sad / Angry / Fearful)
   - Recommended department for routing
   - Manual review flag
4. Results are rendered as a live dashboard with sentiment meter, priority colour coding, and routing details
5. The ticket is **silently saved to MongoDB** in the background with a ward geo-lookup
6. A **Save Status card** confirms: ticket ID, matched ward, and duplicate status

**Outcome:** A helpline call that took 3–5 minutes of manual processing is structured and stored in under 10 seconds.

---

### 🔍 Use Case 2 — RAG Duplicate Detection (Automatic, Background)

**Actor:** System (runs automatically on every ticket save)  
**Trigger:** A new ticket is saved to MongoDB  

**Flow:**
1. The ticket description is embedded using **Sentence Transformers (all-MiniLM-L6-v2, 384-dim)** — a local, zero-cost model
2. A **structural pre-filter** queries only tickets in the same sector, same ward/zone, not resolved, within the last 7–30 days (sector-specific window) — eliminating >95% of irrelevant tickets before any vector math
3. **Cosine similarity** is computed against embeddings of the filtered candidates
4. Threshold decision:
   - **≥ 0.87 similarity** → `auto_duplicate`: ticket merged into original, original's `people_affected` counter incremented — no new SLA clock created
   - **0.65–0.87 similarity** → `needs_review`: both descriptions surfaced side-by-side for operator review; optionally, Gemini is called with just the two short texts to suggest "same issue, yes/no"
   - **< 0.65 similarity** → `unique`: new ticket filed normally
5. `duplicate_check` metadata is written to the ticket document

**Outcome:** Citizens reporting the same pothole or water outage from different phones don't create N separate SLA tickets. The system automatically consolidates them and tracks how many households are affected.

---

### 🗺️ Use Case 3 — Geographic Complaint Heatmap (Tab 2: Official Dashboard)

**Actor:** Municipal official / Data analyst  
**Trigger:** Accessing the Dashboard tab  

**Flow:**
1. Backend runs a MongoDB aggregation pipeline grouping tickets by `ward_normalized` and `sector`
2. Each group is joined with the ward's `geo` centroid from the reference `wards` collection
3. Output: `[{lat, lng, weight: count, sector, ward}]` array
4. Frontend renders a **Leaflet.js heatmap** on a dark CartoDB basemap centred on Chennai
5. Officials can filter by:
   - **Sector Domain** (Water Supply, Electricity, Roads, Public Health, etc.)
   - **Time Window** (Last 7 / 14 / 30 days / All Time)
6. The heatmap updates live on filter change

**Outcome:** A ward-level heat signature of civic complaints lets officials proactively deploy repair teams, prioritise budgets, and identify emerging problem clusters before they escalate.

---

### 🔧 Use Case 4 — Review Queue & Manual Moderation (Tab 3: Review Queue)

**Actor:** Field supervisor / Quality controller  
**Trigger:** Ticket flagged as `needs_review` or `needs_manual_review`  

**Two card types are surfaced:**

#### Type A — Potential Duplicate Resolution
- Side-by-side comparison of the incoming complaint vs the existing matched complaint
- Semantic similarity percentage (e.g., "74% Semantic Match")
- Optional Gemini AI suggestion badge: "🤖 Gemini AI matches this as same issue"
- One-click actions:
  - **Confirm Duplicate** → merges ticket, increments original's counter
  - **Mark as Unique** → clears duplicate flag, files as independent ticket

#### Type B — Location/Sector Normalization
- Shown when Gemini returned a location that couldn't be matched to any known ward (low confidence or vague address)
- Operator selects the correct ward from a dropdown of all 25 reference wards
- Operator verifies/corrects the sector category
- **Save & Approve** resolves the ticket and clears the review flag

**Outcome:** Human oversight is applied only to the ~5–15% of cases where automated systems are genuinely uncertain, not to every ticket.

---

### 📦 Use Case 5 — Batch Reference Seeding (Startup, One-Time)

**Actor:** System (automatic on first `node server.js` run)  
**Trigger:** Empty `wards` collection  

**Flow:**
1. On startup, if `wards` collection is empty, 25 Chennai municipal ward centroids are seeded automatically
2. Each ward document contains: `ward_name`, `aliases` (common locality names), `zone`, `lat`, `lng`
3. The Jaro-Winkler fuzzy matcher uses these to normalise free-text location strings from Gemini
4. If `embed_server.py` is not running at ticket-save time, the ticket is stored with an empty embedding and `needs_manual_review: true` — no zero-vector corruption, no data loss

**Outcome:** Zero manual DB setup required. The system is self-seeding and resilient to partial infrastructure outages.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (index.html + app.js)                 │
│                                                                  │
│  Tab 1: Upload    Tab 2: Dashboard     Tab 3: Review Queue       │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ Dropzone   │  │ Metrics Strip   │  │ Duplicate Cards      │  │
│  │ API Key    │  │ Leaflet Heatmap │  │ Normalisation Forms  │  │
│  │ Results    │  │ Sector Filters  │  │ Confirm / Reject     │  │
│  │ Save Status│  │ Time Filters    │  │                      │  │
│  └────────────┘  └─────────────────┘  └──────────────────────┘  │
└───────────────────────┬────────────────────────────┬────────────┘
                        │ Direct API call             │ REST API calls
                        ▼                             ▼
              ┌──────────────────┐         ┌──────────────────────┐
              │  Gemini 2.5 Flash│         │  Express Server :8085 │
              │  (Google AI API) │         │  server.js            │
              │                  │         │  ┌──────────────────┐ │
              │  Audio → JSON    │         │  │  Ward Matcher    │ │
              │  Structured      │         │  │  (Jaro-Winkler)  │ │
              │  Extraction      │         │  │  Cosine Similarity│ │
              └──────────────────┘         │  │  RAG Pipeline    │ │
                                           │  └──────────────────┘ │
                                           │         │              │
                                           │         ▼              │
                                           │  ┌──────────────┐     │
                                           │  │  MongoDB     │     │
                                           │  │  tickets     │     │
                                           │  │  wards       │     │
                                           │  └──────────────┘     │
                                           │         │              │
                                           │         ▼              │
                                           │  ┌──────────────┐     │
                                           │  │embed_server  │     │
                                           │  │.py :5001     │     │
                                           │  │all-MiniLM    │     │
                                           │  │-L6-v2 (384d) │     │
                                           │  └──────────────┘     │
                                           └──────────────────────┘
```

---

## Why This Is a RAG Pattern (Not a Re-Analysis Pattern)

> **Non-negotiable design principle: The Gemini extraction call runs exactly once per ticket. It never sees historic data.**

| Step | What happens | LLM tokens spent |
|------|-------------|-----------------|
| Ticket created | Gemini extracts JSON from audio | ~800–1200 input tokens (audio) |
| Embedding | Local Sentence Transformers embeds description | **0 tokens** (local model) |
| Duplicate check | Cosine similarity math against pre-filtered DB subset | **0 tokens** |
| Borderline case (optional) | Gemini called with 2 short text strings only | ~50–100 tokens total |
| Heatmap | MongoDB aggregation | **0 tokens** |

This architecture scales linearly with ticket volume. 10,000 tickets cost the same per-comparison as 10 tickets.

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Audio → JSON | Gemini 2.5 Flash (inline audio) | Native multimodal, structured output with schema enforcement |
| Embedding | all-MiniLM-L6-v2 (Sentence Transformers) | 384-dim, ~90MB, free, no API key, runs locally |
| Duplicate detection | Cosine similarity (manual scan) | Pre-filtered set is always small enough for O(n) scan |
| Ward matching | Jaro-Winkler fuzzy string distance | Handles OCR/speech variations without an LLM |
| Database | MongoDB | Native aggregation pipeline for heatmap; flexible schema for evolving ticket fields |
| Heatmap | Leaflet.js + leaflet.heat | Lightweight, CDN-served, no API key required |
| UI | Vanilla HTML/CSS/JS (no framework) | Zero build step, instant load, fully auditable |
| Backend | Node.js + Express | Minimal footprint, native ES modules, easy deployment |

---

## Folder Structure

```
speech to data/
├── index.html          # Full single-page app (3 tabs)
├── app.js              # All frontend JS: Gemini call, tab nav, heatmap, review queue
├── style.css           # Full glassmorphism dark-theme CSS design system
├── server.js           # Express backend: MongoDB, ward matching, RAG pipeline, all REST endpoints
├── embed_server.py     # Python microservice: Sentence Transformers embedding on port 5001
├── package.json        # Node dependencies (express, mongodb, cors)
├── README.md           # Setup and quickstart guide
├── batch_results.json  # Sample Gemini output for 5 demo audio files
├── 01_angry.mp3        # Demo: Water supply outage (Angry, High)
├── 02_fearful.mp3      # Demo: Building fire (Fearful, Critical, Emergency)
├── 03_sad.mp3          # Demo: Pension not received (Sad, High)
├── 04_happy.mp3        # Demo: Thank-you call for resolved issue (Happy, Low)
└── 05_neutral.mp3      # Demo: Street light malfunction (Neutral, Medium)
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets` | Save ticket + run ward match + embed + duplicate pipeline |
| `GET` | `/api/tickets` | — |
| `GET` | `/api/metrics` | Total, open, and needs-review counts |
| `GET` | `/api/heatmap` | Geocoded complaint aggregation (filterable) |
| `GET` | `/api/review-queue` | Tickets flagged for human review |
| `GET` | `/api/wards` | All 25 reference wards for dropdowns |
| `POST` | `/api/tickets/:id/resolve-duplicate` | Confirm or reject a duplicate |
| `POST` | `/api/tickets/:id/resolve-manual` | Assign ward + sector to unresolved ticket |

---

## Demo Scenarios to Impress the Judges

1. **Upload `01_angry.mp3`** → Watch Gemini extract Water Supply, High Priority, Angry sentiment, Ward 80 match, geo coordinate assigned
2. **Upload `01_angry.mp3` again** → Watch duplicate detection flag it as `needs_review` with a similarity score
3. **Upload `02_fearful.mp3`** → Critical Emergency ticket with 🚨 pulsing red indicator
4. **Switch to Dashboard** → Heatmap shows Ward 80 as a hotspot
5. **Switch to Review Queue** → Side-by-side duplicate comparison with AI suggestion badge
6. **Confirm Duplicate in Review Queue** → Metrics update live, original ticket's people_affected counter increments
