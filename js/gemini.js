/* ============================================================
   CARDICARE INTELLIGENCE ENGINE (SECURE MODULE)
   Connects to Google Gemini Vision API
   ============================================================ */

/**
 * 1. MENGAMBIL API KEY & MODEL DENGAN AMAN
 * Mengambil konfigurasi dari js/config.js
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
    
    // Guard Clause: Cek Key
    if (!API_KEY) {
        alert("⚠️ System Error: API Key not configured.");
        throw new Error("API Key Missing");
    }

    let systemInstruction = "";

    // --- 2. KONFIGURASI PROMPT (SYSTEM INSTRUCTIONS) ---
    
    // A. PROMPT EKG (JANTUNG) - MODE DETEKTIF (SANGAT SENSITIF)
    if (promptType === 'ekg') {
        systemInstruction = `
        ACT AS A SENIOR CARDIOLOGIST SPECIALIZING IN ARRHYTHMIA AND ISCHEMIA.
        YOUR TASK IS TO DETECT PATHOLOGY. DO NOT DEFAULT TO "NORMAL" UNLESS THE TRACING IS PRISTINE.

        Analyze the EKG image pixel-by-pixel for:
        1. RHYTHM: Is it TRULY Sinus? Look for Irregularly Irregular (Afib), Sawtooth (Flutter), or absence of P-waves (SVT/Junctional).
        2. ISCHEMIA: Scrutinize ST segments. Even 1mm elevation/depression is significant. Look at V1-V6, II, III, aVF.
        3. CONDUCTION: Is QRS wide (>120ms)? Is PR prolonged (>200ms)? Look for Bundle Branch Blocks.

        STRICT DIAGNOSTIC RULES:
        - If R-R intervals are variable -> Diagnose "Atrial Fibrillation".
        - If P-waves are absent/inverted -> Diagnose "Junctional Rhythm" or "SVT".
        - If ST Elevation present -> Diagnose "STEMI" (specify location).
        - If ST Depression present -> Diagnose "Ischemia".
        - Only if ALL criteria are strictly normal, diagnose "Sinus Rhythm".

        Return ONLY a valid JSON object with this EXACT structure:
        {
          "rhythm": "Precise Rhythm Name (e.g., Atrial Fibrillation, Sinus Tachycardia)",
          "rate": "Numeric value (e.g., 115 bpm)",
          "intervals": {
            "pr": "Value in ms (e.g., 160ms or -)",
            "qrs": "Value in ms (e.g., 90ms)",
            "qt": "Value in ms (e.g., 380ms)"
          },
          "axis": "Normal/Left/Right/Extreme",
          "impression": "Detailed clinical conclusion (e.g., Atrial Fibrillation with Rapid Ventricular Response)",
          "severity": "normal" | "warning" | "danger",
          "recommendation": "Specific actionable medical advice (e.g., Administer Beta-Blockers, Immediate Cardioversion)"
        }`;
    } 
    
    // B. PROMPT MAKANAN (NUTRISI)
    else if (promptType === 'food') {
        systemInstruction = `
        You are a Clinical Nutritionist for heart failure patients. Analyze this food image.
        Identify the main dish and estimate 1) Calories (kcal) and 2) Sodium (mg).
        
        Risk Rules (<2000mg Sodium/day):
        - SAFE: <400mg Sodium/serving.
        - MODERATE: 400-800mg Sodium/serving.
        - DANGEROUS: >800mg Sodium/serving.

        Return valid JSON:
        {
          "food_name": "Name of the dish",
          "calories": "Estimated kcal",
          "sodium": "Estimated sodium in mg",
          "status": "safe" | "moderate" | "danger",
          "advice": "Short nutritional advice. Warn strictly if high sodium."
        }`;
    }

    // C. PROMPT OBAT (INTERAKSI)
    else if (promptType === 'drug') {
        systemInstruction = `
        You are a Clinical Pharmacist. Identify the medication (pill/box).
        Check for interactions with heart meds (Blood thinners, Beta-blockers).

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
        You are a Radiologist. Analyze this Chest X-Ray (CXR) for Heart Failure signs.
        Check: Cardiomegaly (CTR>50%), Pleural Effusion, Pulmonary Edema.

        Return valid JSON:
        {
          "finding": "Key radiological findings summary",
          "ctr_ratio": "Estimated CTR (e.g., 55%)",
          "impression": "Diagnosis (e.g., Cardiomegaly with mild congestion)",
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
        
        // Membersihkan format Markdown
        const cleanJson = textResult.replace(/```json|```/g, '').trim();
        
        console.log("✅ Gemini Response Received");
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("❌ Error in askGeminiVision:", error);
        throw error;
    }
}
