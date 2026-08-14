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
});
