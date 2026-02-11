/* =========================================
   CARDICARE INTELLIGENCE ENGINE
   Connects to Google Gemini 2.5 Flash Lite (Comprehensive Mode)
   ========================================= */

// API KEY ANDA (Pastikan pakai key yang ada kuotanya/Lite)
const API_KEY = 'AIzaSyCr17O371ytM7vEUPN7XTG1whk2ZEQa73s'; 

// Menggunakan Gemini 2.5 Flash Lite
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

async function askGeminiVision(base64Image, promptType, mimeType = "image/jpeg") {
    let systemInstruction = "";
    
    // --- 1. PROMPT EKG: PENDEKATAN KLINIS MENYELURUH ---
    if (promptType === 'ekg') {
        systemInstruction = `
            You are a Senior Cardiologist. Perform a systematic diagnostic interpretation of this EKG image.
            
            DIAGNOSTIC PROTOCOL:
            1. RHYTHM: Check P-waves. Is it Sinus? Is it Atrial Fibrillation (irregularly irregular)? Flutter? SVT?
            2. RATE: Calculate Heart Rate. Tachycardia (>100)? Bradycardia (<60)?
            3. CONDUCTION: Check intervals. PR prolonged (AV Block)? QRS wide (Bundle Branch Block)?
            4. AXIS/HYPERTROPHY: Check for LVH or RVH criteria.
            5. ISCHEMIA/INFARCTION: *Then* look for ST Elevation, Depression, or T-Wave inversions.
            
            CRITICAL RULES:
            - Do not hallucinate ST Elevation if the baseline is wandering.
            - If Rhythm is abnormal (e.g., Afib), prioritize that in the diagnosis.
            - Only classify as "Normal" if Rhythm, Rate, Axis, and Morphology are all within normal limits.

            Return ONLY a valid JSON object (no markdown) with this structure:
            {
                "rhythm": "Specific rhythm (e.g., Sinus Rhythm, Atrial Fibrillation, Sinus Tachycardia)",
                "rate": "Estimated BPM (e.g., 85 BPM)",
                "intervals": { 
                    "pr": "e.g., 0.16s (or 'Unable to measure')", 
                    "qrs": "e.g., 0.08s", 
                    "qtc": "e.g., 400ms" 
                },
                "axis": "Normal / LAD / RAD / Indeterminate",
                "morphology": "Concise technical findings: 'No ST-T changes', 'ST elevation in V1-V4', 'Deep S in V1 (LVH)', etc.",
                "conclusion": "Final medical impression. (e.g., 'Atrial Fibrillation with Rapid Ventricular Response' or 'Normal Sinus Rhythm')",
                "severity": "Use 'danger' for acute ischemia/severe arrhythmia. 'warning' for chronic issues/minor abnormalities. 'normal' for healthy."
            }
        `;
    } 
    // --- 2. PROMPT CXR ---
    else if (promptType === 'cxr') {
        systemInstruction = `
            You are a Senior Radiologist. Systematically analyze this Chest X-Ray.
            Focus on:
            1. Lungs: Pneumonia, Infiltrates, Pneumothorax, Masses.
            2. Heart: Cardiomegaly (CTR > 0.5), Aortic knob.
            3. Pleura: Effusion, CP angle blunting.
            4. Bones: Fractures, deformities.

            Return ONLY a valid JSON object (no markdown):
            {
                "quality": "Technical quality (Rotation/Inspiration)",
                "airway_lungs": "Clear/Infiltrates/Nodules descriptions",
                "heart_mediastinum": "Heart size description & Mediastinal contour",
                "bones_others": "Ribs/Clavicles/Soft tissue",
                "impression": "Final Diagnosis",
                "severity": "normal/warning/danger"
            }
        `;
    }

    const requestBody = {
        contents: [{
            parts: [
                { text: systemInstruction },
                { 
                    inline_data: { 
                        mime_type: mimeType, 
                        data: base64Image 
                    } 
                }
            ]
        }]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("GOOGLE API ERROR:", errorDetails);
            
            if (response.status === 429) {
                alert("KUOTA HABIS! (Rate Limit). Coba lagi besok atau ganti akun.");
            }
            
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("AI tidak memberikan jawaban.");
        }

        const textResponse = data.candidates[0].content.parts[0].text;
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("Gemini Brain Error:", error);
        return null;
    }
}