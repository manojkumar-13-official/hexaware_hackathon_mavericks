import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8085;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'citizen_call_intel';

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Seed Wards Data
const initialWards = [
    { ward_name: "Ward 80", aliases: ["Gandhi Nagar", "Ward 80 Gandhi Nagar", "Adyar"], zone: "South Chennai", lat: 13.0245, lng: 80.2481 },
    { ward_name: "Ward 170", aliases: ["Mylapore", "Mandaveli"], zone: "South Chennai", lat: 13.0333, lng: 80.2667 },
    { ward_name: "Ward 110", aliases: ["T Nagar", "Thyagaraya Nagar"], zone: "Central Chennai", lat: 13.0405, lng: 80.2337 },
    { ward_name: "Ward 105", aliases: ["Nungambakkam"], zone: "Central Chennai", lat: 13.0569, lng: 80.2425 },
    { ward_name: "Ward 100", aliases: ["Kodambakkam"], zone: "Central Chennai", lat: 13.0521, lng: 80.2201 },
    { ward_name: "Ward 95", aliases: ["West Mambalam", "Mambalam"], zone: "Central Chennai", lat: 13.0333, lng: 80.2201 },
    { ward_name: "Ward 120", aliases: ["Alwarpet"], zone: "South Chennai", lat: 13.0347, lng: 80.2502 },
    { ward_name: "Ward 130", aliases: ["Ashok Nagar"], zone: "Central Chennai", lat: 13.0354, lng: 80.2124 },
    { ward_name: "Ward 135", aliases: ["KK Nagar", "Kalaignar Karunanidhi Nagar"], zone: "Central Chennai", lat: 13.0358, lng: 80.1989 },
    { ward_name: "Ward 140", aliases: ["Guindy"], zone: "South Chennai", lat: 13.0067, lng: 80.2206 },
    { ward_name: "Ward 180", aliases: ["Velachery"], zone: "South Chennai", lat: 12.9796, lng: 80.2196 },
    { ward_name: "Ward 185", aliases: ["Thiruvanmiyur"], zone: "South Chennai", lat: 12.9830, lng: 80.2594 },
    { ward_name: "Ward 50", aliases: ["Royapuram"], zone: "North Chennai", lat: 13.1137, lng: 80.2954 },
    { ward_name: "Ward 55", aliases: ["Vyasarpadi"], zone: "North Chennai", lat: 13.1189, lng: 80.2589 },
    { ward_name: "Ward 60", aliases: ["Perambur"], zone: "North Chennai", lat: 13.1075, lng: 80.2483 },
    { ward_name: "Ward 65", aliases: ["Kolathur"], zone: "North Chennai", lat: 13.1236, lng: 80.2186 },
    { ward_name: "Ward 70", aliases: ["Madhavaram"], zone: "North Chennai", lat: 13.1489, lng: 80.2314 },
    { ward_name: "Ward 75", aliases: ["Tondiarpet"], zone: "North Chennai", lat: 13.1278, lng: 80.2897 },
    { ward_name: "Ward 85", aliases: ["Anna Nagar"], zone: "Central Chennai", lat: 13.0850, lng: 80.2101 },
    { ward_name: "Ward 90", aliases: ["Kilpauk"], zone: "Central Chennai", lat: 13.0790, lng: 80.2428 },
    { ward_name: "Ward 115", aliases: ["Egmore"], zone: "Central Chennai", lat: 13.0732, lng: 80.2604 },
    { ward_name: "Ward 125", aliases: ["Triplicane"], zone: "Central Chennai", lat: 13.0587, lng: 80.2757 },
    { ward_name: "Ward 150", aliases: ["Saidapet"], zone: "South Chennai", lat: 13.0215, lng: 80.2231 },
    { ward_name: "Ward 160", aliases: ["Besant Nagar"], zone: "South Chennai", lat: 13.0003, lng: 80.2687 },
    { ward_name: "Ward 190", aliases: ["Pallikaranai"], zone: "South Chennai", lat: 12.9349, lng: 80.2137 }
];

let db;
let ticketsCollection;
let wardsCollection;

// Jaro-Winkler distance logic
function jaroWinklerDistance(s1, s2) {
    s1 = (s1 || '').trim().toLowerCase();
    s2 = (s2 || '').trim().toLowerCase();
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    let matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    if (matchWindow < 0) matchWindow = 0;

    let s1Matches = new Array(s1.length).fill(false);
    let s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < s1.length; i++) {
        let start = Math.max(0, i - matchWindow);
        let end = Math.min(s2.length - 1, i + matchWindow);

        for (let j = start; j <= end; j++) {
            if (s2Matches[j]) continue;
            if (s1[i] === s2[j]) {
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    let m = matches;
    let jDist = (m / s1.length + m / s2.length + (m - transpositions / 2) / m) / 3.0;

    let prefixLength = 0;
    for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
        if (s1[i] === s2[i]) prefixLength++;
        else break;
    }

    return jDist + prefixLength * 0.1 * (1.0 - jDist);
}

// Ward matching
function matchWard(rawLocation, wardsList) {
    if (!rawLocation) return { ward: null, matchType: 'unmatched' };

    const cleanInput = rawLocation.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanInput) return { ward: null, matchType: 'unmatched' };

    let bestMatch = null;
    let bestScore = 0.0;
    let exactMatchFound = false;

    for (const w of wardsList) {
        const cleanWardName = w.ward_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        
        if (cleanInput === cleanWardName) {
            return { ward: w, matchType: 'exact' };
        }
        if (cleanInput.includes(cleanWardName) || cleanWardName.includes(cleanInput)) {
            bestMatch = w;
            bestScore = 1.0;
            exactMatchFound = true;
        }

        for (const alias of (w.aliases || [])) {
            const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            if (cleanInput === cleanAlias) {
                return { ward: w, matchType: 'exact' };
            }
            if (cleanInput.includes(cleanAlias) || cleanAlias.includes(cleanInput)) {
                bestMatch = w;
                bestScore = 1.0;
                exactMatchFound = true;
            }
        }
    }

    if (exactMatchFound) {
        return { ward: bestMatch, matchType: 'exact' };
    }

    for (const w of wardsList) {
        let score = jaroWinklerDistance(cleanInput, w.ward_name);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = w;
        }
        for (const alias of (w.aliases || [])) {
            let aliasScore = jaroWinklerDistance(cleanInput, alias);
            if (aliasScore > bestScore) {
                bestScore = aliasScore;
                bestMatch = w;
            }
        }
    }

    if (bestScore >= 0.85) {
        return { ward: bestMatch, matchType: 'fuzzy' };
    }

    return { ward: null, matchType: 'unmatched' };
}

// Generate Embedding via local Sentence Transformers microservice (embed_server.py on port 5001)
async function generateEmbedding(text) {
    const response = await fetch('http://localhost:5001/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding Server Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error("No embedding values returned from local embedding server.");
    }
    return data.embedding;
}

// Optional Cheap LLM Review suggestion helper
async function getLLMDuplicateSuggestion(desc1, desc2, apiKey) {
    if (!apiKey) return null;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Compare these two citizen helpline complaints and determine if they refer to the same underlying local issue (e.g., the exact same power outage, the same pothole, or the same water leak in the same location). Respond with exactly one word: 'YES' or 'NO'.

Complaint 1: "${desc1}"
Complaint 2: "${desc2}"`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            if (textResponse.toUpperCase().includes('YES')) {
                return 'yes';
            } else if (textResponse.toUpperCase().includes('NO')) {
                return 'no';
            }
        }
    } catch (e) {
        console.error("Optional LLM duplicate suggestion call failed:", e);
    }
    return null;
}

// Helper to determine structural pre-filter window (in days)
function getVerificationWindowDays(sector) {
    const s = (sector || '').toLowerCase();
    if (s.includes('water') || s.includes('electr')) {
        return 7;
    }
    if (s.includes('road') || s.includes('sanitat') || s.includes('waste')) {
        return 30;
    }
    return 14;
}

// Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate unique ID
function generateUUID() {
    return 'ticket-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// Initialize Database
async function initDB() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    ticketsCollection = db.collection('tickets');
    wardsCollection = db.collection('wards');

    // Create Indexes
    await ticketsCollection.createIndex({ sector: 1, ward_normalized: 1, status: 1, created_at: -1 });
    await ticketsCollection.createIndex({ ticket_id: 1 }, { unique: true });
    
    // Seed Wards
    const count = await wardsCollection.countDocuments();
    if (count === 0) {
        await wardsCollection.insertMany(initialWards);
        console.log(`Seeded ${initialWards.length} wards into reference collection.`);
    }

    console.log("Database initialized successfully!");
}

// GET list of static wards (useful for dropdowns in manual review)
app.get('/api/wards', async (req, res) => {
    try {
        const wards = await wardsCollection.find({}).toArray();
        res.json(wards);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST save tickets and run duplicate detection RAG pipeline
app.post('/api/tickets', async (req, res) => {
    try {
        const rawTicket = req.body; // Untouched JSON from Sections 1-6
        const apiKey = req.headers['x-api-key'];

        if (!rawTicket || !rawTicket.description) {
            return res.status(400).json({ error: "Invalid ticket payload." });
        }

        // Get UUID and timestamp
        const ticketId = generateUUID();
        const createdAt = new Date().toISOString();

        // 1. Normalization & Geo lookup
        const allWards = await wardsCollection.find({}).toArray();
        const matched = matchWard(rawTicket.location, allWards);
        
        let ward_normalized = 'unmatched';
        let ward_match_type = 'unmatched';
        let geo = null;
        let zone = null;
        let needs_manual_review = !!rawTicket.needs_manual_review;

        if (matched.ward) {
            ward_normalized = matched.ward.ward_name;
            ward_match_type = matched.matchType;
            geo = { lat: matched.ward.lat, lng: matched.ward.lng };
            zone = matched.ward.zone;
        } else {
            // Flip needs_manual_review to true if unmatched
            needs_manual_review = true;
        }

        // 2. Generate Embedding (via local Sentence Transformers - all-MiniLM-L6-v2, 384-dim)
        let embedding = [];
        try {
            embedding = await generateEmbedding(rawTicket.description);
        } catch (embErr) {
            console.warn(`⚠️  Embedding server unreachable — ticket saved WITHOUT embedding. Duplicate detection will be skipped for this ticket. Start embed_server.py to enable RAG deduplication.\n   Reason: ${embErr.message}`);
            // Do NOT write a zero-vector — that would make every future cosine similarity
            // return 0.0 against this ticket (a known zero-vector), corrupting the pipeline.
            // Leave embedding as [] so the cosine guard (embedding.length > 0) skips this ticket.
            needs_manual_review = true;
        }

        // Create initial ticket document (Section 8 fields + original raw fields)
        const newDoc = {
            ticket_id: ticketId,
            created_at: createdAt,
            status: "filed",
            ward_normalized,
            ward_match_type,
            geo,
            zone,
            embedding,
            // Original fields from Gemini
            caller_name: rawTicket.caller_name || null,
            caller_age: rawTicket.caller_age || null,
            location: rawTicket.location || null,
            location_confidence: rawTicket.location_confidence || "not_mentioned",
            sector: rawTicket.sector || "Other / Unclear",
            description: rawTicket.description,
            affected_scope: rawTicket.affected_scope || "unclear",
            people_affected: rawTicket.people_affected !== null && rawTicket.people_affected !== undefined ? rawTicket.people_affected : null,
            priority_level: rawTicket.priority_level || "Medium",
            is_emergency: !!rawTicket.is_emergency,
            sentiment_class: rawTicket.sentiment_class || "1",
            recommended_department: rawTicket.recommended_department || "General Administration",
            needs_manual_review,
            // Duplicate metadata
            duplicate_check: {
                review_status: "unique",
                is_duplicate: false,
                duplicate_of_ticket_id: null,
                similarity_score: null
            }
        };

        // 3. Duplicate Detection Pipeline (Section 10)
        // Structural pre-filter query
        const windowDays = getVerificationWindowDays(newDoc.sector);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - windowDays);

        const filterQuery = {
            sector: newDoc.sector,
            status: { $ne: "resolved" },
            created_at: { $gte: cutoffDate.toISOString() }
        };

        if (newDoc.ward_normalized !== 'unmatched') {
            if (newDoc.zone) {
                filterQuery.$or = [
                    { ward_normalized: newDoc.ward_normalized },
                    { zone: newDoc.zone }
                ];
            } else {
                filterQuery.ward_normalized = newDoc.ward_normalized;
            }
        }

        // Find candidate tickets
        const candidates = await ticketsCollection.find(filterQuery).toArray();
        let topCandidate = null;
        let topSimilarity = 0.0;

        for (const cand of candidates) {
            if (cand.embedding && cand.embedding.length > 0 && newDoc.embedding && newDoc.embedding.length > 0) {
                const sim = cosineSimilarity(newDoc.embedding, cand.embedding);
                if (sim > topSimilarity) {
                    topSimilarity = sim;
                    topCandidate = cand;
                }
            }
        }

        // Threshold decisions
        if (topSimilarity >= 0.87 && topCandidate) {
            newDoc.duplicate_check = {
                review_status: "auto_duplicate",
                is_duplicate: true,
                duplicate_of_ticket_id: topCandidate.ticket_id,
                similarity_score: topSimilarity
            };

            // Increment the original ticket's people_affected
            const incAmount = newDoc.people_affected || 1;
            await ticketsCollection.updateOne(
                { ticket_id: topCandidate.ticket_id },
                { 
                    $inc: { 
                        people_affected: incAmount,
                        duplicate_count: 1 
                    } 
                }
            );
        } else if (topSimilarity >= 0.65 && topCandidate) {
            newDoc.duplicate_check = {
                review_status: "needs_review",
                is_duplicate: false,
                duplicate_of_ticket_id: topCandidate.ticket_id,
                similarity_score: topSimilarity
            };

            // Optional cheap LLM call to suggest whether it is a duplicate
            const suggestion = await getLLMDuplicateSuggestion(newDoc.description, topCandidate.description, apiKey);
            if (suggestion) {
                newDoc.duplicate_check.llm_review_suggestion = suggestion;
            }
        }

        // Save new ticket
        newDoc.duplicate_count = 0;
        await ticketsCollection.insertOne(newDoc);
        
        // Strip embedding before returning it to the frontend to minimize response size
        const { embedding: _, ...clientDoc } = newDoc;
        res.json(clientDoc);

    } catch (e) {
        console.error("Save ticket endpoint error:", e);
        res.status(500).json({ error: e.message });
    }
});

// GET Heatmap aggregation data (Section 11)
app.get('/api/heatmap', async (req, res) => {
    try {
        const { sector, timeRange } = req.query;
        const match = {};

        if (sector && sector !== 'All') {
            match.sector = sector;
        }

        // Add filter to exclude resolved or duplicate tickets to avoid skewing heatmap
        match['duplicate_check.is_duplicate'] = { $ne: true };

        // Handle time range
        if (timeRange && timeRange !== 'All Time') {
            const cutoff = new Date();
            if (timeRange === 'Last 7 Days') {
                cutoff.setDate(cutoff.getDate() - 7);
            } else if (timeRange === 'Last 14 Days') {
                cutoff.setDate(cutoff.getDate() - 14);
            } else if (timeRange === 'Last 30 Days') {
                cutoff.setDate(cutoff.getDate() - 30);
            }
            match.created_at = { $gte: cutoff.toISOString() };
        }

        const aggregationPipeline = [
            { $match: match },
            { 
                $group: {
                    _id: {
                        ward: "$ward_normalized",
                        sector: "$sector"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "wards",
                    localField: "_id.ward",
                    foreignField: "ward_name",
                    as: "ward_details"
                }
            },
            { $unwind: "$ward_details" },
            {
                $project: {
                    _id: 0,
                    ward: "$_id.ward",
                    sector: "$_id.sector",
                    weight: "$count",
                    lat: "$ward_details.lat",
                    lng: "$ward_details.lng"
                }
            }
        ];

        const results = await ticketsCollection.aggregate(aggregationPipeline).toArray();
        res.json(results);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET Dashboard metrics overview
app.get('/api/metrics', async (req, res) => {
    try {
        const total = await ticketsCollection.countDocuments();
        
        // Open tickets are filed / processing, and are not marked duplicates
        const open = await ticketsCollection.countDocuments({
            status: { $ne: "resolved" },
            'duplicate_check.is_duplicate': { $ne: true }
        });

        // Needs review (either duplicate needs review OR location needs manual review)
        const needsReview = await ticketsCollection.countDocuments({
            $or: [
                { 'duplicate_check.review_status': 'needs_review' },
                { needs_manual_review: true }
            ]
        });

        res.json({ total, open, needsReview });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET Review Queue tickets
app.get('/api/review-queue', async (req, res) => {
    try {
        const query = {
            $or: [
                { 'duplicate_check.review_status': 'needs_review' },
                { needs_manual_review: true }
            ]
        };

        const tickets = await ticketsCollection.find(query).sort({ created_at: -1 }).toArray();
        const output = [];

        for (const ticket of tickets) {
            let matchedTicket = null;
            if (ticket.duplicate_check && ticket.duplicate_check.duplicate_of_ticket_id) {
                matchedTicket = await ticketsCollection.findOne({ ticket_id: ticket.duplicate_check.duplicate_of_ticket_id });
            }
            output.push({
                ticket,
                originalMatch: matchedTicket
            });
        }

        res.json(output);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST Resolve Borderline Duplicate Action
app.post('/api/tickets/:id/resolve-duplicate', async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'confirm' or 'reject'

        const ticket = await ticketsCollection.findOne({ ticket_id: id });
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found." });
        }

        if (action === 'confirm') {
            const originalId = ticket.duplicate_check.duplicate_of_ticket_id;
            // Update this ticket to duplicate status
            await ticketsCollection.updateOne(
                { ticket_id: id },
                { 
                    $set: { 
                        'duplicate_check.review_status': 'auto_duplicate',
                        'duplicate_check.is_duplicate': true
                    }
                }
            );

            // Increment the original ticket counters
            if (originalId) {
                const incAmount = ticket.people_affected || 1;
                await ticketsCollection.updateOne(
                    { ticket_id: originalId },
                    { 
                        $inc: { 
                            people_affected: incAmount,
                            duplicate_count: 1
                        }
                    }
                );
            }
        } else if (action === 'reject') {
            // Update this ticket as unique
            await ticketsCollection.updateOne(
                { ticket_id: id },
                { 
                    $set: { 
                        'duplicate_check.review_status': 'unique',
                        'duplicate_check.is_duplicate': false,
                        'duplicate_check.duplicate_of_ticket_id': null,
                        'duplicate_check.similarity_score': null
                    }
                }
            );
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST Resolve Manual Location/Sector Action
app.post('/api/tickets/:id/resolve-manual', async (req, res) => {
    try {
        const { id } = req.params;
        const { ward_normalized, sector } = req.body;

        const ticket = await ticketsCollection.findOne({ ticket_id: id });
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found." });
        }

        const allWards = await wardsCollection.find({}).toArray();
        const selectedWard = allWards.find(w => w.ward_name === ward_normalized);

        const updates = {
            needs_manual_review: false
        };

        if (selectedWard) {
            updates.ward_normalized = selectedWard.ward_name;
            updates.ward_match_type = 'exact';
            updates.geo = { lat: selectedWard.lat, lng: selectedWard.lng };
            updates.zone = selectedWard.zone;
        }

        if (sector) {
            updates.sector = sector;
        }

        await ticketsCollection.updateOne({ ticket_id: id }, { $set: updates });
        res.json({ success: true });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start Express Server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize server/database:", err);
});
