/* =========================================
   1. TAB SWITCHING LOGIC
   ========================================= */
function switchTab(tabName) {
    // Hide all sections
    document.querySelectorAll('.module-section').forEach(sec => sec.classList.remove('active-section'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

    // Show selected
    document.getElementById(`${tabName}-tab`).classList.add('active-section');
    
    // Highlight nav (Simple hack for demo)
    const navIndex = tabName === 'nutri' ? 1 : 2; // Assuming index in sidebar
    // Note: In real app, bind by ID.
}

/* =========================================
   2. NUTRI-GUARD (AI VISION SIMULATION)
   ========================================= */
const foodInput = document.getElementById('foodInput');
const dropZone = document.getElementById('dropZone');

foodInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) startScanning(file);
});

function startScanning(file) {
    // 1. Show Preview & Laser
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('scanPreview').classList.remove('hidden');
        document.querySelector('.upload-content').classList.add('hidden');
    }
    reader.readAsDataURL(file);

    // 2. Simulate AI Processing Delay (3 Seconds)
    setTimeout(() => {
        showNutriResult();
        // Hide laser after scan
        document.querySelector('.laser-scanner').style.display = 'none';
        document.querySelector('.scanning-text').innerText = "SCAN COMPLETE";
    }, 3000);
}

function showNutriResult() {
    // MOCKUP DATA: Hasil random tapi realistis untuk demo
    // Di real app, ini response dari Python/TensorFlow
    const resultHTML = `
        <div style="text-align:left; animation: slideUp 0.5s ease;">
            <h3 style="color:var(--primary); margin-bottom:1rem;">Analisa Nutrisi AI</h3>
            <div class="nutrient-row">
                <div class="nutrient-header">
                    <span>Sodium (Garam)</span> <span style="color:#EF4444;">Tinggi (850mg)</span>
                </div>
                <div class="bar-bg"><div class="bar-fill bg-danger" style="width: 85%"></div></div>
            </div>
            <div class="nutrient-row">
                <div class="nutrient-header">
                    <span>Saturated Fat (Lemak Jenuh)</span> <span style="color:#F59E0B;">Sedang (5g)</span>
                </div>
                <div class="bar-bg"><div class="bar-fill bg-warning" style="width: 50%"></div></div>
            </div>
            <div class="nutrient-row">
                <div class="nutrient-header">
                    <span>Fiber (Serat)</span> <span style="color:#10B981;">Cukup (4g)</span>
                </div>
                <div class="bar-bg"><div class="bar-fill bg-success" style="width: 60%"></div></div>
            </div>
            
            <div style="background:#F1F5F9; padding:1rem; border-radius:12px; margin-top:1.5rem;">
                <strong><i class="fa-solid fa-user-doctor"></i> Rekomendasi CardiCare:</strong>
                <p style="font-size:0.9rem; margin-top:0.5rem; color:#475569;">
                    Makanan ini mengandung natrium tinggi yang dapat memicu tekanan darah. 
                    Saran: Kurangi porsi nasi setengah atau hindari kuah santan.
                </p>
            </div>
            
            <button onclick="resetScan()" style="margin-top:1rem; background:none; border:1px solid #CBD5E1; padding:0.5rem 1rem; border-radius:20px; cursor:pointer;">Scan Ulang</button>
        </div>
    `;
    
    document.getElementById('nutriResult').innerHTML = resultHTML;
}

function resetScan() {
    document.getElementById('scanPreview').classList.add('hidden');
    document.querySelector('.upload-content').classList.remove('hidden');
    document.getElementById('nutriResult').innerHTML = `
        <div class="placeholder-state">
            <i class="fa-solid fa-utensils"></i>
            <p>Hasil analisa nutrisi akan muncul di sini.</p>
        </div>
    `;
    // Reset Laser
    document.querySelector('.laser-scanner').style.display = 'block';
    document.querySelector('.scanning-text').innerText = "AI VISION ANALYZING...";
}

/* =========================================
   3. MED-SHIELD (INTERACTION CHECKER)
   ========================================= */
// Database Interaksi Obat (Simplified Mockup)
const interactions = {
    "aspirin": ["warfarin", "ibuprofen", "heparin"],
    "warfarin": ["aspirin", "vitamin k", "simvastatin"],
    "simvastatin": ["amlodipine", "grapefruit", "warfarin"],
    "amlodipine": ["simvastatin", "dantrolene"],
    "bisoprolol": ["verapamil", "diltiazem"]
};

function checkInteraction() {
    const d1 = document.getElementById('drug1').value.toLowerCase().trim();
    const d2 = document.getElementById('drug2').value.toLowerCase().trim();
    const resultPanel = document.getElementById('medsResult');

    if (!d1 || !d2) {
        alert("Mohon masukkan nama kedua obat.");
        return;
    }

    resultPanel.classList.remove('hidden');
    
    // Logika Cek Dictionary
    let conflict = false;
    
    // Cek d1 lawan d2, atau d2 lawan d1
    if (interactions[d1] && interactions[d1].includes(d2)) conflict = true;
    if (interactions[d2] && interactions[d2].includes(d1)) conflict = true;

    if (conflict) {
        // MERAH: BAHAYA
        resultPanel.innerHTML = `
            <div class="interaction-alert alert-danger">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; margin-bottom:1rem;"></i>
                <h2>INTERAKSI TERDETEKSI!</h2>
                <p>Kombinasi <strong>${d1}</strong> dan <strong>${d2}</strong> memiliki risiko kontraindikasi mayor.</p>
                <hr style="border-top:1px solid rgba(0,0,0,0.1); margin:1rem 0;">
                <p style="font-weight:600;">Potensi Risiko: Pendarahan atau Kerusakan Hati.</p>
                <button style="margin-top:1rem; padding:0.8rem 2rem; background:#991B1B; color:white; border:none; border-radius:50px; cursor:pointer;">Konsultasi Dokter</button>
            </div>
        `;
    } else {
        // HIJAU: AMAN
        resultPanel.innerHTML = `
            <div class="interaction-alert alert-safe">
                <i class="fa-solid fa-shield-check" style="font-size:3rem; margin-bottom:1rem;"></i>
                <h2>KOMBINASI AMAN</h2>
                <p>Tidak ditemukan interaksi berbahaya antara <strong>${d1}</strong> dan <strong>${d2}</strong> dalam database kami.</p>
                <p style="font-size:0.8rem; margin-top:1rem; opacity:0.8;">*Selalu konsultasikan dengan apoteker untuk kepastian 100%.</p>
            </div>
        `;
    }
}
/* =========================================
   MEDSHIELD CHAT CONTROLLER
   ========================================= */

// Kirim pesan kalau tekan Enter
function handleEnter(e) {
    if (e.key === 'Enter') sendDrugConsultation();
}

async function sendDrugConsultation() {
    const inputField = document.getElementById('drugInput');
    const chatContainer = document.getElementById('chat-container');
    const userText = inputField.value.trim();

    if (!userText) return;

    // 1. Tampilkan Pesan User
    appendMessage(userText, 'user');
    inputField.value = ''; // Kosongkan input
    
    // 2. Tampilkan Loading Bubble
    const loadingId = appendLoading();
    scrollToBottom();

    try {
        // 3. Panggil Gemini Apoteker
        // Pastikan askGeminiChat sudah ada di js/gemini.js
        const reply = await askGeminiChat(userText);
        
        // 4. Ganti Loading dengan Jawaban AI
        removeMessage(loadingId);
        appendMessage(reply, 'bot');

    } catch (error) {
        removeMessage(loadingId);
        appendMessage("Maaf, koneksi terganggu. Silakan coba lagi.", 'bot');
    }
    
    scrollToBottom();
}

// Helper: Tambah Bubble Chat
function appendMessage(text, sender) {
    const chatContainer = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `message ${sender}-message animate-fade`;
    
    // Icon Avatar
    const icon = sender === 'bot' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>';
    
    div.innerHTML = `
        <div class="msg-avatar">${icon}</div>
        <div class="msg-content">${text}</div>
    `;
    
    chatContainer.appendChild(div);
}

// Helper: Bubble Loading Animasi
function appendLoading() {
    const chatContainer = document.getElementById('chat-container');
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot-message';
    div.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="msg-content">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Sedang mengecek interaksi obat...
        </div>
    `;
    chatContainer.appendChild(div);
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
/* =========================================
   PATIENT PORTAL CONTROLLER
   ========================================= */

// 1. LOGIKA PINDAH TAB (Nutri <-> Meds)
function switchTab(tabName) {
    // Sembunyikan semua section
    document.getElementById('nutri-tab').classList.add('hidden');
    document.getElementById('meds-tab').classList.add('hidden');
    
    // Matikan state aktif di sidebar
    document.getElementById('nav-nutri').classList.remove('active');
    document.getElementById('nav-meds').classList.remove('active');

    // Munculkan yang dipilih
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    document.getElementById(`nav-${tabName}`).classList.add('active');
}

// 2. CHATBOT MEDSHIELD
function handleEnter(e) {
    if (e.key === 'Enter') sendDrugConsultation();
}

async function sendDrugConsultation() {
    const inputField = document.getElementById('drugInput');
    const userText = inputField.value.trim();

    if (!userText) return;

    // Tampilkan Pesan User
    appendMessage(userText, 'user');
    inputField.value = ''; 
    
    // Loading State
    const loadingId = appendLoading();
    scrollToBottom();

    try {
        // Panggil AI (Pastikan askGeminiChat ada di gemini.js)
        const reply = await askGeminiChat(userText);
        removeMessage(loadingId);
        appendMessage(reply, 'bot');
    } catch (error) {
        removeMessage(loadingId);
        appendMessage("Maaf, koneksi ke Apoteker AI terputus. Coba lagi.", 'bot');
    }
    
    scrollToBottom();
}

// Helper Chat
function appendMessage(text, sender) {
    const chatContainer = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    div.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid ${sender === 'bot' ? 'fa-robot' : 'fa-user'}"></i></div>
        <div class="msg-content">${text}</div>
    `;
    chatContainer.appendChild(div);
}

function appendLoading() {
    const chatContainer = document.getElementById('chat-container');
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot-message';
    div.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="msg-content"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengecek interaksi obat...</div>
    `;
    chatContainer.appendChild(div);
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 3. LOGIKA NUTRI-GUARD (Upload Makanan)
function handleFoodUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = async function(e) {
            // Preview
            document.querySelector('.upload-content').classList.add('hidden');
            document.getElementById('scanPreview').classList.remove('hidden');
            document.getElementById('previewImg').src = e.target.result;

            const base64 = e.target.result.split(',')[1];
            
            // Panggil AI Vision (Food Mode)
            try {
                const result = await askGeminiVision(base64, 'food');
                renderNutriResult(result);
            } catch (err) {
                alert("Gagal analisa makanan: " + err.message);
            }
        };
        reader.readAsDataURL(file);
    }
}

function renderNutriResult(data) {
    const container = document.getElementById('nutriResult');
    const statusColor = data.status === 'danger' ? '#ef4444' : (data.status === 'moderate' ? '#f59e0b' : '#10b981');
    
    container.innerHTML = `
        <div style="padding: 1.5rem;">
            <h3 style="color:${statusColor}; margin-bottom:1rem;">${data.food_name}</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:1rem;">
                <div class="stat-box">Calories: <b>${data.calories}</b></div>
                <div class="stat-box">Sodium: <b style="color:${statusColor}">${data.sodium}</b></div>
            </div>
            <p style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px;">${data.advice}</p>
        </div>
    `;
}
