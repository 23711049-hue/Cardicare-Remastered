/* ============================================================
   CARDICARE INTELLIGENCE ENGINE (SECURE MODULE)
   Connects to Google Gemini Vision API
   ============================================================ */

/**
 * 1. MENGAMBIL API KEY & MODEL DENGAN AMAN
 */
const API_KEY = (() => {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_KEY) {
        return CONFIG.API_KEY;
    } else {
        console.error("❌ CRITICAL: API Key Missing in js/config.js");
        return null;
    }
})();

// Mengambil Model dari Config (Default ke 2.0 Flash jika tidak ada setting)
const MODEL_NAME = (typeof CONFIG !== 'undefined' && CONFIG.MODEL_NAME) ? CONFIG.MODEL_NAME : "gemini-2.0-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

/**
 * Fungsi Utama: Mengirim gambar ke Gemini Vision
 */
async function askGeminiVision(base64Image, promptType, mimeType = "image/jpeg") {
    
    if (!API_KEY) {
        alert("⚠️ System Error: API Key not configured.");
        throw new Error("API Key Missing");
    }

    let systemInstruction = "";

    // --- 2. KONFIGURASI PROMPT (SYSTEM INSTRUCTIONS) ---
    
    // A. PROMPT EKG (JANTUNG) - MODE FORENSIK (ANTI-NORMAL BIAS)
    if (promptType === 'ekg') {
        systemInstruction = `
        CRITICAL MEDICAL ALERT: YOU ARE A FORENSIC CARDIOLOGIST ANALYZING A POTENTIALLY FATAL EKG.
        
        THE PATIENT IS SYMPTOMATIC. DO NOT ASSUME THE EKG IS NORMAL.
        YOUR JOB IS TO FIND THE "KILLER".

        Step-by-Step Analysis Required:
        1. **ST SEGMENT**: Look closely at leads V1, V2, V3, V4. Is the ST segment ELEVATED above the baseline? Does it look like a "Tombstone"? If YES -> It is STEMI.
        2. **RHYTHM**: Is the heart rate > 100bpm? Is the QRS wide (>120ms)? If YES -> It could be Ventricular Tachycardia (VT).
        3. **COMPARISON**: Compare ST segment to TP segment. Any elevation > 1mm is ABNORMAL.

        FORBIDDEN ACTIONS:
        - DO NOT diagnose "Sinus Rhythm" if ST Elevation is present.
        - DO NOT diagnose "Sinus Rhythm" if QRS is wide and rapid.
        - DO NOT ignore "Tombstone" patterns.

        Return ONLY a valid JSON object with this structure:
        {
          "rhythm": "DIAGNOSIS (e.g., Anterior STEMI, Ventricular Tachycardia, Sinus Rhythm)",
          "rate": "Heart Rate (e.g., 145 bpm)",
          "intervals": {
            "pr": "Value in ms (e.g., - )",
            "qrs": "Value in ms (e.g., 160ms)",
            "qt": "Value in ms (e.g., 320ms)"
          },
          "axis": "Left/Right/Normal/Extreme",
          "impression": "URGENT CONCLUSION (e.g., MASSIVE ANTERIOR STEMI - CRITICAL)",
          "severity": "danger", 
          "recommendation": "IMMEDIATE ACTION (e.g., ACTIVATE CATH LAB, CALL CODE BLUE)"
        }
        
        Note: If the EKG shows ST Elevation, severity MUST be 'danger'.
        `;
    } 
    
    // B. PROMPT MAKANAN (NUTRISI)
    else if (promptType === 'food') {
        systemInstruction = `
        You are a Clinical Nutritionist. Analyze this food image for Heart Failure patients.
        
        Return valid JSON:
        {
          "food_name": "Name of the dish",
          "calories": "Estimated kcal",
          "sodium": "Estimated sodium in mg",
          "status": "safe" | "moderate" | "danger",
          "advice": "Nutritional advice. Warn strictly if high sodium."
        }`;
    }

    // C. PROMPT OBAT (INTERAKSI)
    else if (promptType === 'drug') {
        systemInstruction = `
        You are a Pharmacist. Identify this pill/packaging.
        
        Return valid JSON:
        {
          "drug_name": "Name of the drug",
          "function": "Primary use",
          "safety_alert": "Warnings for heart patients",
          "status": "safe" | "warning" | "danger"
        }`;
    }

    // D. PROMPT RONTGEN (CXR)
    else if (promptType === 'cxr') {
        systemInstruction = `
        You are a Radiologist. Analyze this CXR for Heart Failure.
        
        Return valid JSON:
        {
          "finding": "Key findings (Cardiomegaly, Effusion, etc)",
          "ctr_ratio": "Estimated CTR (e.g., 55%)",
          "impression": "Diagnosis",
          "severity": "normal" | "warning" | "danger"
        }`;
    }

    // --- 3. EKSEKUSI API CALL ---
    const requestBody = {
        contents: [{
            parts: [
                { text: systemInstruction },
                { inline_data: { mime_type: mimeType, data: base64Image } }
            ]
        }]
    };

    try {
        console.log(`📡 Sending request to Gemini (${MODEL_NAME})...`);
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
        const cleanJson = textResult.replace(/```json|```/g, '').trim();
        
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("❌ Error in askGeminiVision:", error);
        throw error;
    }
}
