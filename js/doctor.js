/* =========================================
   DIAGNOSTIC LAB CONTROLLER (REAL API VERSION)
   ========================================= */

// 1. TOOL SWITCHING
function switchTool(toolName) {
    document.querySelectorAll('.diagnostic-panel').forEach(p => p.classList.remove('active-tool'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`${toolName}-tool`).classList.add('active-tool');
    
    const navItems = document.querySelectorAll('.nav-item');
    if(toolName === 'ekg') navItems[1].classList.add('active');
    if(toolName === 'cxr') navItems[2].classList.add('active');
}

// 2. IMAGE UPLOAD & CONVERT TO BASE64
function handleImageUpload(input, type) {
    if (input.files && input.files[0]) {
        const file = input.files[0]; // Ambil data file lengkap
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            // Tampilkan Preview
            const imgId = type === 'ekg' ? 'ekgImage' : 'cxrImage';
            const previewAreaId = type === 'ekg' ? 'ekgPreviewArea' : 'cxrPreviewArea';

            document.getElementById(imgId).src = e.target.result;
            document.getElementById(imgId).classList.remove('hidden');
            document.getElementById(previewAreaId).classList.add('hidden');

            // Ambil string Base64 murni
            const base64String = e.target.result.split(',')[1];

            // PENTING: Ambil tipe file (misal: image/png atau image/jpeg)
            const mimeType = file.type;

            // PANGGIL AI dengan Tipe File yang benar
            await processWithGemini(base64String, type, mimeType);
        };
        reader.readAsDataURL(file);
    }
}

// 3. THE REAL BRAIN: CALLING GEMINI API
async function processWithGemini(base64Data, type, mimeType) {
    const resultBoxId = type === 'ekg' ? 'ekgResultContent' : 'cxrResultContent';
    const container = document.getElementById(resultBoxId);
    
    // STEP A: Loading State
    container.innerHTML = `
        <div style="text-align:center; margin-top:20%">
            <i class="fa-solid fa-microchip fa-spin" style="font-size:2rem; color:#60A5FA; margin-bottom:1rem;"></i>
            <p style="font-family:'JetBrains Mono'">Gemini 1.5 is analyzing image...</p>
            <p style="font-size:0.8rem; color:#64748B">Processing medical vision tokens</p>
        </div>
    `;

    try {
        // Kirim base64 DAN mimeType ke kurir
        const responseData = await askGeminiVision(base64Data, type, mimeType);

        if (responseData) {
            if (type === 'ekg') {
                renderClinicalEKG(container, responseData);
            } else {
                renderClinicalCXR(container, responseData);
                document.getElementById('heatmapOverlay').classList.remove('hidden');
            }
        } else {
            throw new Error("Respon Kosong");
        }

    } catch (error) {
        console.error("UI Error Catch:", error);
        container.innerHTML = `
            <div style="text-align:center; color:#EF4444; margin-top:20%">
                <i class="fa-solid fa-circle-xmark" style="font-size:2rem; margin-bottom:1rem;"></i>
                <p><strong>API Error</strong></p>
                <p style="font-size:0.8rem">Gunakan file JPG/PNG yang valid.<br>Cek Console (F12) untuk detail.</p>
            </div>
        `;
    }
}

/* =========================================
   4. RENDERER (CLINICAL FLOW LAYOUT)
   ========================================= */

// A. RENDER EKG
function renderClinicalEKG(container, data) {
    const statusColor = data.severity === 'danger' ? '#EF4444' : (data.severity === 'warning' ? '#F59E0B' : '#10B981');

    container.innerHTML = `
        <div class="gemini-response animate-fade" style="padding: 1.5rem;">
            <div style="border-bottom: 1px solid #334155; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin:0; color:#94A3B8; font-size:0.85rem; letter-spacing:1px;">ELECTROCARDIOGRAM REPORT</h4>
                <div style="font-size:1.2rem; font-weight:700; color:white; margin-top:0.5rem;">${data.rhythm}</div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                <div class="stat-box">
                    <span style="color:#64748B; font-size:0.8rem;">HEART RATE</span>
                    <div style="font-size:1.2rem; font-weight:600; color:#60A5FA;">${data.rate}</div>
                </div>
                <div class="stat-box">
                    <span style="color:#64748B; font-size:0.8rem;">AXIS</span>
                    <div style="font-size:1.1rem; font-weight:500;">${data.axis}</div>
                </div>
                <div class="stat-box" style="grid-column: span 2; background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px;">
                    <span style="color:#64748B; font-size:0.8rem; display:block; margin-bottom:0.5rem;">INTERVALS</span>
                    <div style="display:flex; justify-content: space-between; font-family:'JetBrains Mono'; font-size:0.9rem;">
                        <span>PR: <b style="color:white">${data.intervals.pr}</b></span>
                        <span>QRS: <b style="color:white">${data.intervals.qrs}</b></span>
                        <span>QTc: <b style="color:white">${data.intervals.qtc}</b></span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h5 style="color:#94A3B8; margin-bottom:0.5rem; font-size:0.85rem;">WAVEFORM ANALYSIS</h5>
                <p style="font-size:0.95rem; line-height:1.6; color:#CBD5E1; background:rgba(0,0,0,0.2); padding:1rem; border-radius:8px; border-left: 3px solid #60A5FA;">
                    ${data.morphology}
                </p>
            </div>

            <div style="background: ${statusColor}15; border: 1px solid ${statusColor}; padding: 1.5rem; border-radius: 12px; text-align: center;">
                <span style="color:${statusColor}; font-weight:700; font-size:0.8rem; letter-spacing:1px;">CONCLUSION</span>
                <h2 style="margin: 0.5rem 0 0 0; color:${statusColor}; font-size:1.4rem;">${data.conclusion}</h2>
            </div>
        </div>
    `;
}

// B. RENDER CXR
function renderClinicalCXR(container, data) {
    const statusColor = data.severity === 'danger' ? '#EF4444' : (data.severity === 'warning' ? '#F59E0B' : '#10B981');

    container.innerHTML = `
        <div class="gemini-response animate-fade" style="padding: 1.5rem;">
            <div style="border-bottom: 1px solid #334155; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin:0; color:#94A3B8; font-size:0.85rem; letter-spacing:1px;">RADIOLOGY REPORT</h4>
                <div style="font-size:1rem; color:#CBD5E1; margin-top:0.3rem;">Quality: ${data.quality}</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:1.2rem; margin-bottom: 2rem;">
                <div><span style="color:#60A5FA; font-weight:600; font-size:0.9rem;">LUNGS & PLEURA</span><p style="margin:0.2rem 0 0 0; color:#E2E8F0; font-size:0.95rem;">${data.airway_lungs}</p></div>
                <div><span style="color:#60A5FA; font-weight:600; font-size:0.9rem;">HEART & MEDIASTINUM</span><p style="margin:0.2rem 0 0 0; color:#E2E8F0; font-size:0.95rem;">${data.heart_mediastinum}</p></div>
                <div><span style="color:#60A5FA; font-weight:600; font-size:0.9rem;">BONES & OTHERS</span><p style="margin:0.2rem 0 0 0; color:#E2E8F0; font-size:0.95rem;">${data.bones_others}</p></div>
            </div>

            <div style="background: ${statusColor}15; border: 1px solid ${statusColor}; padding: 1.5rem; border-radius: 12px; text-align: center;">
                <span style="color:${statusColor}; font-weight:700; font-size:0.8rem; letter-spacing:1px;">IMPRESSION</span>
                <h2 style="margin: 0.5rem 0 0 0; color:${statusColor}; font-size:1.4rem;">${data.impression}</h2>
            </div>
        </div>
    `;
}