// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKeyBtn');
const audioFileInput = document.getElementById('audioFile');
const dropzone = document.getElementById('dropzone');
const browseBtn = document.getElementById('browseBtn');
const fileInfoContainer = document.getElementById('fileInfo');
const fileNameEl = document.getElementById('fileName');
const fileSizeEl = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const playerContainer = document.getElementById('playerContainer');
const audioPlayer = document.getElementById('audioPlayer');
const analyzeBtn = document.getElementById('analyzeBtn');

const placeholderState = document.getElementById('placeholderState');
const loadingState = document.getElementById('loadingState');
const dashboardContent = document.getElementById('dashboardContent');

// Step Indicators
const stepUpload = document.getElementById('step-upload');
const stepApi = document.getElementById('step-api');
const stepRender = document.getElementById('step-render');

// Metric elements
const emergencyCard = document.getElementById('emergencyCard');
const priorityCard = document.getElementById('priorityCard');
const reviewCard = document.getElementById('reviewCard');
const valEmergency = document.getElementById('val-emergency');
const valPriority = document.getElementById('val-priority');
const valReview = document.getElementById('val-review');

// Details elements
const valDescription = document.getElementById('val-description');
const valName = document.getElementById('val-name');
const valAge = document.getElementById('val-age');
const valLocation = document.getElementById('val-location');
const valLocConfidence = document.getElementById('val-loc-confidence');
const valScope = document.getElementById('val-scope');
const valPeopleAffected = document.getElementById('val-people-affected');
const valSector = document.getElementById('val-sector');
const valDepartment = document.getElementById('val-department');

// Sentiment elements
const sentimentBar = document.getElementById('sentimentBar');
const valSentimentNum = document.getElementById('val-sentiment-num');
const valSentimentText = document.getElementById('val-sentiment-text');

// Raw JSON inspector elements
const toggleRawBtn = document.getElementById('toggleRawBtn');
const rawJsonContainer = document.getElementById('rawJsonContainer');
const rawJsonOutput = document.getElementById('rawJsonOutput');
const copyJsonBtn = document.getElementById('copyJsonBtn');

// State Variables
let selectedFile = null;
let apiResponseData = null;

// Constant System Instruction
const SYSTEM_INSTRUCTION = `Extract structured data from this citizen helpline call recording. Fill the schema exactly.

RULES:
1. caller_name / caller_age: fill ONLY if explicitly stated aloud by the caller. Never infer age from voice. Never guess a name. If not stated, use null.
2. location: fill only if a place/landmark is mentioned; else null, and set location_confidence to "not_mentioned".
3. people_affected: fill only if the caller states a number or clear group size; else null.
4. sector, affected_scope, priority_level, location_confidence must use ONLY the exact enum values given — never invent a category. If unsure, pick the closest listed option ("Other / Unclear" for sector, "unclear" for affected_scope).
5. is_emergency = true ONLY for explicit life-threatening situations (fire, medical collapse, violence in progress, structural collapse). Do not set true just because the caller sounds upset — that's what sentiment_class is for.
6. sentiment_class reflects caller tone: 1=Neutral, 2=Happy, 3=Sad, 4=Angry, 5=Fearful.
7. needs_manual_review = true if location_confidence is "low"/"not_mentioned" OR sector is "Other / Unclear". Else false.
8. Never fabricate a value not grounded in the audio — null is always preferred over a guess.

Return only the JSON object. No text outside the JSON.`;

// Response Schema Definition
const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        caller_name: { type: "STRING", nullable: true },
        caller_age: { type: "INTEGER", nullable: true },
        location: { type: "STRING", nullable: true },
        location_confidence: { type: "STRING", enum: ["high", "medium", "low", "not_mentioned"] },
        sector: {
            type: "STRING",
            enum: [
                "Water Supply", "Electricity", "Roads & Infrastructure", "Public Health",
                "Police / Law & Order", "Transport", "Sanitation & Waste Management",
                "Disaster Management", "Municipal Administration", "Other / Unclear"
            ]
        },
        description: { type: "STRING" },
        affected_scope: {
            type: "STRING",
            enum: ["single_person", "household", "multiple_households", "public_area_or_community", "unclear"]
        },
        people_affected: { type: "INTEGER", nullable: true },
        priority_level: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] },
        is_emergency: { type: "BOOLEAN" },
        sentiment_class: { type: "STRING", enum: ["1", "2", "3", "4", "5"] },
        recommended_department: { type: "STRING" },
        needs_manual_review: { type: "BOOLEAN" }
    },
    required: [
        "location_confidence", "sector", "description", "affected_scope",
        "priority_level", "is_emergency", "sentiment_class",
        "recommended_department", "needs_manual_review"
    ]
};

// Event Listeners initialization
function initEvents() {
    // API Key toggle visibility
    toggleKeyBtn.addEventListener('click', () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        const iconPath = toggleKeyBtn.querySelector('svg path');
        if (type === 'text') {
            // eye-off representation
            iconPath.setAttribute('d', 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24');
        } else {
            // normal eye representation
            iconPath.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
        }
    });

    // Handle Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // File input changes
    audioFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioFileInput.click();
    });

    dropzone.addEventListener('click', () => {
        audioFileInput.click();
    });

    // Remove file
    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileInput();
    });

    // Analyze button click
    analyzeBtn.addEventListener('click', analyzeCallRecording);

    // Toggle Raw JSON inspector
    toggleRawBtn.addEventListener('click', () => {
        const isHidden = rawJsonContainer.classList.contains('hidden');
        if (isHidden) {
            rawJsonContainer.classList.remove('hidden');
            toggleRawBtn.classList.add('open');
        } else {
            rawJsonContainer.classList.add('hidden');
            toggleRawBtn.classList.remove('open');
        }
    });

    // Copy JSON to clipboard
    copyJsonBtn.addEventListener('click', () => {
        if (apiResponseData) {
            navigator.clipboard.writeText(JSON.stringify(apiResponseData, null, 2))
                .then(() => {
                    const originalText = copyJsonBtn.textContent;
                    copyJsonBtn.textContent = 'Copied!';
                    copyJsonBtn.style.backgroundColor = 'var(--status-low)';
                    setTimeout(() => {
                        copyJsonBtn.textContent = originalText;
                        copyJsonBtn.style.backgroundColor = '';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
        }
    });

    // Validate inputs dynamically
    apiKeyInput.addEventListener('input', checkValidation);
}

// Handle selected file details
function handleFileSelect(file) {
    // Verify it is an audio file
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav') && !file.name.endsWith('.m4a') && !file.name.endsWith('.ogg')) {
        alert('Please select an audio file (MP3, WAV, M4A, OGG).');
        return;
    }

    selectedFile = file;

    // Update File UI
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatBytes(file.size);
    fileInfoContainer.classList.remove('hidden');
    dropzone.classList.add('hidden');

    // Load into audio preview player
    const fileURL = URL.createObjectURL(file);
    audioPlayer.src = fileURL;
    playerContainer.classList.remove('hidden');

    checkValidation();
}

// Reset selected file state
function resetFileInput() {
    selectedFile = null;
    audioFileInput.value = '';
    fileInfoContainer.classList.add('hidden');
    dropzone.classList.remove('hidden');
    playerContainer.classList.add('hidden');
    audioPlayer.src = '';
    checkValidation();
}

// Enable/Disable analysis button based on key + file availability
function checkValidation() {
    const key = apiKeyInput.value.trim();
    if (key && selectedFile) {
        analyzeBtn.disabled = false;
    } else {
        analyzeBtn.disabled = true;
    }
}

// Main handler for analysis
async function analyzeCallRecording() {
    const apiKey = apiKeyInput.value.trim();
    if (!selectedFile || !apiKey) return;

    // Update views
    setLoadingState(true);
    updateStep(stepUpload, 'active');

    try {
        // Step 1: Base64 encoding
        const base64Audio = await convertFileToBase64(selectedFile);
        updateStep(stepUpload, 'complete');
        updateStep(stepApi, 'active');

        // Step 2: Post to Gemini
        const responseData = await callGeminiAPI(base64Audio, selectedFile.type, apiKey);
        updateStep(stepApi, 'complete');
        updateStep(stepRender, 'active');

        // Step 3: Populate Results
        renderResults(responseData);
        updateStep(stepRender, 'complete');

        // Show Dashboard
        apiResponseData = responseData;
        setLoadingState(false);
        showDashboard(true);

        // Save to Database (Section 13.2) — runs after UI is already shown so it
        // doesn't block or delay the analysis result render.
        try {
            const savedDoc = await saveTicketToDatabase(responseData, apiKey);
            renderSaveStatus(savedDoc);
        } catch (dbErr) {
            console.error("Failed to save ticket to MongoDB database:", dbErr);
            renderSaveStatus(null, dbErr.message);
        }
    } catch (error) {
        console.error('Analysis failed:', error);
        alert(`Analysis Error: ${error.message || 'An unexpected error occurred.'}`);
        setLoadingState(false);
    }
}

// Convert a file to Base64 String using FileReader
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = (error) => reject(error);
    });
}

// Gemini API Call via REST
async function callGeminiAPI(base64Data, mimeType, apiKey) {
    // Normalise mimeType in case browser doesn't supply standard values
    let cleanMimeType = mimeType;
    if (!cleanMimeType || cleanMimeType === 'audio/mpeg' || cleanMimeType === 'audio/mp3') {
        cleanMimeType = 'audio/mp3';
    } else if (cleanMimeType === 'audio/x-wav' || cleanMimeType === 'audio/wav') {
        cleanMimeType = 'audio/wav';
    } else if (cleanMimeType === 'audio/x-m4a' || cleanMimeType === 'audio/m4a') {
        cleanMimeType = 'audio/m4a';
    } else if (cleanMimeType === 'audio/ogg') {
        cleanMimeType = 'audio/ogg';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            mimeType: cleanMimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: "Extract and structure variables according to schema."
                    }
                ]
            }
        ],
        systemInstruction: {
            parts: [
                {
                    text: SYSTEM_INSTRUCTION
                }
            ]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        let errText = '';
        try {
            const errJson = await response.json();
            errText = errJson.error ? errJson.error.message : response.statusText;
        } catch {
            errText = await response.text() || response.statusText;
        }
        throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    
    // Extract JSON response text
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
        throw new Error("Invalid response received from Gemini API - No content returned.");
    }

    const responseText = data.candidates[0].content.parts[0].text;
    
    try {
        const parsedJson = JSON.parse(responseText.trim());
        return parsedJson;
    } catch (e) {
        console.error("Failed to parse response text as JSON:", responseText);
        throw new Error("Unable to parse structured response returned by Gemini.");
    }
}

// Render values onto dashboard components
function renderResults(data) {
    // 1. Emergency status metric
    const isEmergency = !!data.is_emergency;
    valEmergency.textContent = isEmergency ? 'Emergency' : 'No';
    emergencyCard.className = `metric-card urgent-${isEmergency}`;

    // 2. Priority level metric
    const priority = data.priority_level || 'Medium';
    valPriority.textContent = priority;
    priorityCard.className = `metric-card priority-${priority}`;

    // 3. Needs Manual Review metric
    const needsReview = !!data.needs_manual_review;
    valReview.textContent = needsReview ? 'Yes' : 'No';
    reviewCard.className = `metric-card review-${needsReview}`;

    // 4. Details Description Summary
    valDescription.textContent = data.description || 'No summary details provided.';

    // 5. Caller Profile
    valName.textContent = data.caller_name || 'Not Mentioned';
    valAge.textContent = data.caller_age !== null && data.caller_age !== undefined ? data.caller_age : 'Not Mentioned';

    // 6. Location & Scope
    valLocation.textContent = data.location || 'Not Mentioned';
    
    const confidence = data.location_confidence || 'not_mentioned';
    valLocConfidence.textContent = confidence.replace('_', ' ');
    valLocConfidence.className = `info-value badge-light confidence-${confidence}`;

    valScope.textContent = (data.affected_scope || 'unclear').replace(/_/g, ' ');
    valPeopleAffected.textContent = data.people_affected !== null && data.people_affected !== undefined ? data.people_affected : 'Not Mentioned';

    // 7. Routing
    valSector.textContent = data.sector || 'Other / Unclear';
    valDepartment.textContent = data.recommended_department || 'General Administration';

    // 8. Sentiment Class
    const sentimentMap = {
        1: { text: 'Neutral', label: 'Neutral' },
        2: { text: 'Happy', label: 'Happy' },
        3: { text: 'Sad', label: 'Sad' },
        4: { text: 'Angry', label: 'Angry' },
        5: { text: 'Fearful', label: 'Fearful' }
    };

    const sentimentClass = parseInt(data.sentiment_class) || 1;
    const mappedVal = sentimentMap[sentimentClass] || sentimentMap[1];
    valSentimentNum.textContent = sentimentClass;
    valSentimentText.textContent = mappedVal.text;

    // Position sentiment bar dot (1 = 0%, 5 = 100%)
    const leftPercentage = ((sentimentClass - 1) / 4) * 100;
    sentimentBar.style.left = `${leftPercentage}%`;

    // Highlight active label
    const labels = document.querySelectorAll('.sentiment-labels span');
    labels.forEach(label => {
        const val = parseInt(label.getAttribute('data-val'));
        if (val === sentimentClass) {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });

    // 9. Raw JSON output
    rawJsonOutput.textContent = JSON.stringify(data, null, 2);
}

// UI State Management helpers
function setLoadingState(isLoading) {
    if (isLoading) {
        placeholderState.classList.add('hidden');
        dashboardContent.classList.add('hidden');
        loadingState.classList.remove('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.querySelector('.spinner').classList.remove('hidden');
        analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';
        
        // Reset steps
        resetSteps();
    } else {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
        analyzeBtn.querySelector('.spinner').classList.add('hidden');
        analyzeBtn.querySelector('.btn-text').textContent = 'Analyze Call';
    }
}

function showDashboard(visible) {
    if (visible) {
        placeholderState.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
    } else {
        placeholderState.classList.remove('hidden');
        dashboardContent.classList.add('hidden');
    }
}

function resetSteps() {
    [stepUpload, stepApi, stepRender].forEach(step => {
        step.className = 'step';
    });
}

function updateStep(stepElement, state) {
    if (state === 'active') {
        stepElement.className = 'step active';
    } else if (state === 'complete') {
        stepElement.className = 'step complete';
    }
}

// Helpers
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Init execution
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    checkValidation();
    initTabs();
    initFilters();
    loadDashboardMetrics();
});

// ==========================================
// PART 2 — Additive Backend Integration Functions
// ==========================================

async function saveTicketToDatabase(ticketData, apiKey) {
    const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify(ticketData)
    });
    if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to save to DB (${response.status}): ${errText}`);
    }
    const savedDoc = await response.json();
    console.log("Successfully saved ticket to database:", savedDoc);
    loadDashboardMetrics();
    return savedDoc; // Return so the caller can render save-status feedback
}

// Render a non-intrusive save-status card below the raw JSON inspector
function renderSaveStatus(doc, errorMsg) {
    // Remove any previous save status card first
    const existing = document.getElementById('saveStatusCard');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'saveStatusCard';
    card.className = 'save-status-card';

    if (errorMsg || !doc) {
        card.classList.add('save-status-error');
        card.innerHTML = `
            <div class="save-status-header">
                <span class="save-status-label">⚠ Save Failed — Backend Unavailable</span>
            </div>
            <div class="save-status-meta">
                <span>${escapeHTML(errorMsg || 'Could not reach the backend server.')}</span>
                <span class="save-status-hint">Start <code>node server.js</code> and refresh to enable ticket storage.</span>
            </div>
        `;
    } else {
        const dupStatus = doc.duplicate_check?.review_status || 'unique';
        const ward = doc.ward_normalized || 'Unmatched';
        const matchType = doc.ward_match_type || 'unmatched';
        const ticketId = doc.ticket_id || '—';

        const statusConfig = {
            unique:         { icon: '✓', label: 'Unique — New Ticket Filed',          cls: 'save-status-unique' },
            auto_duplicate: { icon: '⟳', label: 'Auto-Duplicate Merged',              cls: 'save-status-duplicate' },
            needs_review:   { icon: '⚑', label: 'Needs Review — Borderline Duplicate', cls: 'save-status-review' }
        };
        const cfg = statusConfig[dupStatus] || statusConfig.unique;
        card.classList.add(cfg.cls);

        const dupExtra = dupStatus === 'auto_duplicate'
            ? `<span>Merged into: <code>${escapeHTML(doc.duplicate_check?.duplicate_of_ticket_id || '—')}</code></span>`
            : dupStatus === 'needs_review'
            ? `<span class="save-status-hint">→ Check the Review Queue tab to confirm or reject</span>`
            : '';

        card.innerHTML = `
            <div class="save-status-header">
                <span class="save-status-label">${cfg.icon} ${cfg.label}</span>
                <span class="save-status-id">ID: <code>${escapeHTML(ticketId)}</code></span>
            </div>
            <div class="save-status-meta">
                <span>📍 Ward: <strong>${escapeHTML(ward)}</strong></span>
                <span>Match: <strong>${escapeHTML(matchType)}</strong></span>
                ${dupExtra}
            </div>
        `;
    }

    // Insert after the raw JSON section (or append to dashboardContent as fallback)
    const rawSection = document.querySelector('#dashboardContent .raw-data-section');
    if (rawSection && rawSection.parentNode) {
        rawSection.after(card);
    } else {
        dashboardContent.appendChild(card);
    }
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Set buttons active
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Set panes active
            tabPanes.forEach(pane => {
                if (pane.id === `tab-${targetTab}`) {
                    pane.classList.remove('hidden');
                    pane.classList.add('active');
                } else {
                    pane.classList.add('hidden');
                    pane.classList.remove('active');
                }
            });

            // Trigger specific page loads
            if (targetTab === 'dashboard') {
                loadDashboardMetrics();
                loadHeatmapData();
            } else if (targetTab === 'review') {
                loadReviewQueue();
            }
        });
    });
}

let map = null;
let heatmapLayer = null;

// Initialises the Leaflet map exactly once. Returns true if the map is ready
// to use (already existed or was just created), false if the container is missing.
function initHeatmapMap() {
    if (map) return true; // Already initialised — idempotent

    const mapContainer = document.getElementById('heatmapMap');
    if (!mapContainer) return false;

    // Center on Chennai centroid
    map = L.map('heatmapMap').setView([13.04, 80.24], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    return true;
    // NOTE: invalidateSize is called inside loadHeatmapData every time data is
    // loaded, which happens on every dashboard tab switch — no separate listener needed.
}

async function loadHeatmapData() {
    // Ensure map is initialised before doing anything; bail if container is missing.
    if (!initHeatmapMap()) return;

    // Always call invalidateSize after a tab-show: Leaflet can't measure the
    // container's dimensions while it is display:none, so tiles / zoom may be
    // wrong until we tell it to recalculate.
    setTimeout(() => { if (map) map.invalidateSize(); }, 120);

    const sector = document.getElementById('filterSector').value;
    const timeRange = document.getElementById('filterTime').value;

    try {
        const res = await fetch(`/api/heatmap?sector=${encodeURIComponent(sector)}&timeRange=${encodeURIComponent(timeRange)}`);
        if (!res.ok) throw new Error(`Heatmap fetch failed: ${res.status} ${res.statusText}`);
        const data = await res.json();

        // Remove old heatmap layer before re-drawing
        if (heatmapLayer) {
            map.removeLayer(heatmapLayer);
            heatmapLayer = null;
        }

        // Format: [lat, lng, weight]
        const points = data.map(item => [item.lat, item.lng, item.weight * 5]);

        if (points.length === 0) {
            setMapEmptyState(true);
            return;
        }

        setMapEmptyState(false);

        // Add Leaflet Heat layer
        heatmapLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 13,
            gradient: {
                0.2: 'blue',
                0.4: 'cyan',
                0.6: 'lime',
                0.8: 'yellow',
                1.0: 'red'
            }
        }).addTo(map);

    } catch (err) {
        console.error("Error loading heatmap data:", err);
        setMapEmptyState(true, '⚠ Could not load heatmap data. Is the backend server running?');
    }
}

// Shows or hides an overlay message on top of the heatmap for empty/error states.
function setMapEmptyState(show, customMsg) {
    const mapEl = document.getElementById('heatmapMap');
    if (!mapEl) return;

    let overlay = document.getElementById('mapEmptyOverlay');

    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mapEmptyOverlay';
            overlay.className = 'map-empty-overlay';
            mapEl.appendChild(overlay);
        }
        overlay.innerHTML = `
            <span class="map-empty-icon">🗺️</span>
            <p>${escapeHTML(customMsg || 'No geocoded complaints match the current filters.')}<br>
            <small>Submit and analyse calls to begin building the heatmap.</small></p>
        `;
        overlay.style.display = 'flex';
    } else {
        if (overlay) overlay.style.display = 'none';
    }
}

function initFilters() {
    const filterSector = document.getElementById('filterSector');
    const filterTime = document.getElementById('filterTime');

    if (filterSector) {
        filterSector.addEventListener('change', loadHeatmapData);
    }
    if (filterTime) {
        filterTime.addEventListener('change', loadHeatmapData);
    }
}

async function loadDashboardMetrics() {
    try {
        const res = await fetch('/api/metrics');
        if (!res.ok) throw new Error("Failed to fetch metrics");
        const data = await res.json();

        document.getElementById('metric-total-tickets').textContent = data.total;
        document.getElementById('metric-open-tickets').textContent = data.open;
        document.getElementById('metric-review-tickets').textContent = data.needsReview;

        // Update badge count in Tab bar
        const badge = document.getElementById('reviewCountBadge');
        if (badge) {
            if (data.needsReview > 0) {
                badge.textContent = data.needsReview;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error("Error loading metrics:", err);
    }
}

let staticWardsList = [];

async function fetchStaticWards() {
    if (staticWardsList.length > 0) return staticWardsList;
    try {
        const res = await fetch('/api/wards');
        if (res.ok) {
            staticWardsList = await res.json();
        }
    } catch (e) {
        console.error("Failed to load wards dropdown list:", e);
    }
    return staticWardsList;
}

async function loadReviewQueue() {
    const listContainer = document.getElementById('reviewQueueList');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="loading-state"><h3>Loading Review Queue...</h3></div>';

    try {
        const wards = await fetchStaticWards();
        const res = await fetch('/api/review-queue');
        if (!res.ok) throw new Error("Failed to fetch review queue");
        const queueItems = await res.json();

        if (queueItems.length === 0) {
            listContainer.innerHTML = `
                <div class="placeholder-state card-empty">
                    <span class="placeholder-icon">🎉</span>
                    <h3>Review Queue is Empty</h3>
                    <p>No complaints require manual verification or duplicate resolution at this time.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '';

        queueItems.forEach(item => {
            const ticket = item.ticket;
            const original = item.originalMatch;

            const card = document.createElement('div');
            card.className = 'review-card glass-card';

            const createdDate = new Date(ticket.created_at).toLocaleString();

            if (ticket.duplicate_check && ticket.duplicate_check.review_status === 'needs_review' && original) {
                const simPercent = Math.round(ticket.duplicate_check.similarity_score * 100);
                const llmSuggestion = ticket.duplicate_check.llm_review_suggestion || null;
                
                let suggestionHtml = '';
                if (llmSuggestion === 'yes') {
                    suggestionHtml = `<div class="badge-suggestion positive">🤖 Gemini AI matches this as same issue</div>`;
                } else if (llmSuggestion === 'no') {
                    suggestionHtml = `<div class="badge-suggestion negative">🤖 Gemini AI suspects different issue</div>`;
                }

                card.innerHTML = `
                    <div class="review-card-header">
                        <span class="badge warning">Potential Duplicate — ${simPercent}% Semantic Match</span>
                        <span class="review-date">${createdDate}</span>
                    </div>
                    
                    <div class="side-by-side-layout">
                        <div class="comparison-column new-ticket">
                            <h4>Incoming Complaint (Unreviewed)</h4>
                            <p class="desc-box">${escapeHTML(ticket.description)}</p>
                            <div class="meta-strip">
                                <span><strong>Sector:</strong> ${escapeHTML(ticket.sector)}</span>
                                <span><strong>Ward:</strong> ${escapeHTML(ticket.ward_normalized)}</span>
                            </div>
                        </div>
                        
                        <div class="comparison-column original-ticket">
                            <h4>Existing Complaint (SLA Active)</h4>
                            <p class="desc-box">${escapeHTML(original.description)}</p>
                            <div class="meta-strip">
                                <span><strong>Sector:</strong> ${escapeHTML(original.sector)}</span>
                                <span><strong>Ward:</strong> ${escapeHTML(original.ward_normalized)}</span>
                                <span><strong>Status:</strong> ${escapeHTML(original.status)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${suggestionHtml}

                    <div class="review-actions">
                        <button type="button" class="btn-primary btn-confirm-dup" data-id="${ticket.ticket_id}">Confirm Duplicate</button>
                        <button type="button" class="btn-secondary btn-reject-dup" data-id="${ticket.ticket_id}">Mark as Unique</button>
                    </div>
                `;

                card.querySelector('.btn-confirm-dup').addEventListener('click', () => resolveDuplicate(ticket.ticket_id, 'confirm'));
                card.querySelector('.btn-reject-dup').addEventListener('click', () => resolveDuplicate(ticket.ticket_id, 'reject'));

            } else if (ticket.needs_manual_review) {
                let wardOptions = `<option value="">-- Select Ward --</option>`;
                wards.forEach(w => {
                    const selected = ticket.ward_normalized === w.ward_name ? 'selected' : '';
                    wardOptions += `<option value="${w.ward_name}" ${selected}>${w.ward_name} (${w.zone})</option>`;
                });

                const sectorsList = [
                    "Water Supply", "Electricity", "Roads & Infrastructure", "Public Health",
                    "Police / Law & Order", "Transport", "Sanitation & Waste Management",
                    "Disaster Management", "Municipal Administration", "Other / Unclear"
                ];

                let sectorOptions = '';
                sectorsList.forEach(sec => {
                    const selected = ticket.sector === sec ? 'selected' : '';
                    sectorOptions += `<option value="${sec}" ${selected}>${sec}</option>`;
                });

                card.innerHTML = `
                    <div class="review-card-header">
                        <span class="badge info">Needs Location/Sector Normalization</span>
                        <span class="review-date">${createdDate}</span>
                    </div>
                    
                    <div class="manual-review-layout">
                        <div class="manual-info-col">
                            <h4>Complaint Description</h4>
                            <p class="desc-box">${escapeHTML(ticket.description)}</p>
                            <div class="extracted-details">
                                <p><strong>AI Extracted Location:</strong> <code>${escapeHTML(ticket.location || 'Not Mentioned')}</code> (Confidence: ${escapeHTML(ticket.location_confidence)})</p>
                                <p><strong>AI Extracted Sector:</strong> <code>${escapeHTML(ticket.sector)}</code></p>
                            </div>
                        </div>
                        
                        <div class="manual-form-col">
                            <h4>Standardization Fields</h4>
                            <div class="form-group">
                                <label>Assign Normalized Ward</label>
                                <select class="select-ward-norm" required>
                                    ${wardOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Verify Sector Category</label>
                                <select class="select-sector-norm" required>
                                    ${sectorOptions}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-actions">
                        <button type="button" class="btn-primary btn-save-manual" data-id="${ticket.ticket_id}">Save & Approve</button>
                    </div>
                `;

                card.querySelector('.btn-save-manual').addEventListener('click', () => {
                    const wardVal = card.querySelector('.select-ward-norm').value;
                    const sectorVal = card.querySelector('.select-sector-norm').value;
                    resolveManual(ticket.ticket_id, wardVal, sectorVal);
                });
            }

            listContainer.appendChild(card);
        });

    } catch (err) {
        listContainer.innerHTML = `<div class="placeholder-state error-state"><h3>Failed to Load Review Queue</h3><p>${err.message}</p></div>`;
    }
}

async function resolveDuplicate(ticketId, action) {
    try {
        const res = await fetch(`/api/tickets/${ticketId}/resolve-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        if (!res.ok) throw new Error("Action failed");
        
        loadReviewQueue();
        loadDashboardMetrics();
    } catch (e) {
        alert("Failed to resolve duplicate: " + e.message);
    }
}

async function resolveManual(ticketId, wardNormalized, sector) {
    if (!wardNormalized) {
        alert("Please select a normalized ward to resolve this complaint.");
        return;
    }
    try {
        const res = await fetch(`/api/tickets/${ticketId}/resolve-manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ward_normalized: wardNormalized, sector })
        });
        if (!res.ok) throw new Error("Action failed");
        
        loadReviewQueue();
        loadDashboardMetrics();
    } catch (e) {
        alert("Failed to save normalization: " + e.message);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
