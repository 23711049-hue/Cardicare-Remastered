/* ============================================================
   CARDICARE INTELLIGENCE ENGINE (SECURE MODULE)
   Connects to Google Gemini 2.5 Flash Lite
   ============================================================ */

/**
 * MENGAMBIL API KEY DENGAN AMAN
 * Logika: Cek apakah variabel global CONFIG tersedia (dari config.js).
 * Jika tidak ada, tampilkan error agar developer sadar.
 */
const API_KEY = (() => {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_KEY) {
        return CONFIG.API_KEY;
    } else {
        console.error("❌ CRITICAL ERROR: API Key tidak ditemukan! Pastikan file js/config.js sudah dimuat dan berisi API_KEY yang valid.");
        return null; // Mengembalikan null agar sistem tidak crash total, tapi bisa di-handle di bawah
    }
})();

// Menggunakan Gemini 2.5 Flash Lite
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

/**
 * Fungsi Utama: Mengirim gambar ke Gemini Vision
 * @param {string} base64Image - String gambar dalam format base64
 * @param {string} promptType - Jenis prompt ('ekg', 'food', 'cxr', 'drug')
 * @param {string} mimeType - Tipe file gambar (default: image/jpeg)
 */
async function askGeminiVision(base64Image, promptType, mimeType = "image/jpeg") {
    
    // 1. Validasi Keamanan (Guard Clause)
    if (!API_KEY) {
        alert("⚠️ Konfigurasi Error: API Key belum dipasang. Silakan cek console browser.");
        throw new Error("API Key Missing");
    }

    let systemInstruction = "";

    // --- 2. KONFIGURASI PROMPT (SYSTEM INSTRUCTIONS) ---
    
   // A. PROMPT EKG (JANTUNG) - VERSI LENGKAP (FIX ERROR 'pr' undefined)
    if (promptType === 'ekg') {
        systemInstruction = `
        You are a Senior Cardiologist. Perform a systematic diagnostic interpretation of this EKG image.
        
        DIAGNOSTIC PROTOCOL:
        1. RHYTHM: Check P-waves. Is it Sinus? Atrial Fibrillation? SVT?
        2. RATE: Calculate Heart Rate.
        3. INTERVALS: Estimate PR, QRS, and QT intervals in ms.
        4. AXIS: Determine the axis.
        5. IMPRESSION: Clinical diagnosis.

        CRITICAL RULES:
        - Do not hallucinate. If intervals are unclear, estimate based on visual grid.
        - Use "Normal" ranges: PR (120-200ms), QRS (<120ms), QTc (<440ms).

        Return ONLY a valid JSON object (no markdown) with this EXACT structure:
        {
          "rhythm": "Specific rhythm (e.g., Sinus Rhythm)",
          "rate": "Numeric value (e.g., 75 bpm)",
          "intervals": {
            "pr": "Value in ms (e.g., 160ms)",
            "qrs": "Value in ms (e.g., 80ms)",
            "qt": "Value in ms (e.g., 400ms)"
          },
          "axis": "Normal/Left/Right",
          "impression": "Concise clinical impression",
          "severity": "normal" | "warning" | "danger",
          "recommendation": "Actionable advice for the doctor"
        }`;
    } 
    
    // B. PROMPT MAKANAN (NUTRISI)
    else if (promptType === 'food') {
        systemInstruction = `
        You are a Clinical Nutritionist for heart failure patients. Analyze this food image.
        
        Identify the main dish and estimate:
        1. Total Calories (kcal)
        2. Sodium Content (mg) - THIS IS CRITICAL.
        
        Risk Assessment Rules (based on typical Heart Failure diet of <2000mg Sodium/day):
        - SAFE: <400mg Sodium per serving.
        - MODERATE: 400-800mg Sodium per serving.
        - DANGEROUS: >800mg Sodium per serving.

        Return ONLY a valid JSON object (no markdown) with this structure:
        {
          "food_name": "Name of the dish",
          "calories": "Estimated kcal (e.g., 500 kcal)",
          "sodium": "Estimated sodium in mg (e.g., 600 mg)",
          "status": "safe" | "moderate" | "danger",
          "advice": "Short nutritional advice. Warn strictly if high sodium."
        }`;
    }

    // C. PROMPT OBAT (INTERAKSI)
    else if (promptType === 'drug') {
        systemInstruction = `
        You are a Clinical Pharmacist. Identify the medication in the image (pill/packaging).
        Check for potential adverse effects or interactions common in heart patients (e.g., with blood thinners, beta-blockers).

        Return ONLY a valid JSON object (no markdown) with this structure:
        {
          "drug_name": "Name of the drug identified",
          "function": "Primary use (e.g., Pain relief, Hypertension)",
          "safety_alert": "Any warnings for heart patients?",
          "status": "safe" | "warning" | "danger"
        }`;
    }

    // D. PROMPT RONTGEN (CXR)
    else if (promptType === 'cxr') {
        systemInstruction = `
        You are a Radiologist. Analyze this Chest X-Ray (CXR) specifically for signs of Heart Failure.
        
        Look for:
        1. Cardiomegaly (CTR > 50%)
        2. Pulmonary Edema / Congestion
        3. Pleural Effusion (Blunted costophrenic angles)
        4. Kerley B Lines

        Return ONLY a valid JSON object (no markdown) with this structure:
        {
          "finding": "Key radiological findings",
          "ctr_ratio": "Estimated Cardiothoracic Ratio (e.g., ~55%)",
          "impression": "Radiological diagnosis (e.g., Cardiomegaly with mild congestion)",
          "severity": "normal" | "warning" | "danger"
        }`;
    }

    // --- 3. MENYUSUN REQUEST BODY ---
    const requestBody = {
        contents: [{
            parts: [
                { text: systemInstruction },
                { inline_data: { mime_type: mimeType, data: base64Image } }
            ]
        }]
    };

    // --- 4. EKSEKUSI API CALL ---
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const textResult = data.candidates[0].content.parts[0].text;
        
        // Membersihkan format Markdown (jika Gemini bandel ngasih ```json)
        const cleanJson = textResult.replace(/```json|```/g, '').trim();
        
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("❌ Error in askGeminiVision:", error);
        throw error;
    }
}
