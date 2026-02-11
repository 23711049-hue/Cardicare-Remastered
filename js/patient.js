/* =========================================
   PATIENT PORTAL CONTROLLER
   Mengatur logika Tab, Chatbot Obat, dan Scan Makanan
   ========================================= */

// --- 1. LOGIKA PINDAH TAB (Nutri <-> Meds) ---
function switchTab(tabName) {
    // Sembunyikan semua section
    document.getElementById('nutri-tab').classList.add('hidden');
    document.getElementById('meds-tab').classList.add('hidden');
    
    // Matikan state aktif di sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));

    // Munculkan yang dipilih
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Aktifkan menu sidebar yang sesuai
    if(tabName === 'nutri') document.getElementById('nav-nutri').classList.add('active');
    if(tabName === 'meds') document.getElementById('nav-meds').classList.add('active');
}

// --- 2. LOGIKA MEDSHIELD (CHATBOT OBAT) ---

// Supaya bisa kirim pakai tombol Enter
function handleEnter(e) {
    if (e.key === 'Enter') sendDrugConsultation();
}

async function sendDrugConsultation() {
    const inputField = document.getElementById('drugInput');
    const userText = inputField.value.trim();

    if (!userText) return; // Jangan kirim kalau kosong

    // A. Tampilkan Pesan User di Layar
    appendMessage(userText, 'user');
    inputField.value = ''; // Kosongkan input
    
    // B. Tampilkan Loading Bubble
    const loadingId = appendLoading();
    scrollToBottom();

    try {
        // C. Panggil Fungsi Chat di gemini.js
        // Pastikan function askGeminiChat() sudah ada di js/gemini.js
        if (typeof askGeminiChat !== 'function') {
            throw new Error("Fungsi askGeminiChat belum ada di gemini.js");
        }

        const reply = await askGeminiChat(userText);
        
        // D. Hapus Loading, Ganti dengan Jawaban AI
        removeMessage(loadingId);
        appendMessage(reply, 'bot');

    } catch (error) {
        console.error("Chat Error:", error);
        removeMessage(loadingId);
        appendMessage("⚠️ Maaf, Apoteker AI sedang sibuk. Silakan coba lagi nanti.", 'bot');
    }
    
    scrollToBottom();
}

// Helper: Membuat Bubble Chat
function appendMessage(text, sender) {
    const chatContainer = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `message ${sender}-message animate-fade`;
    
    const icon = sender === 'bot' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>';
    
    div.innerHTML = `
        <div class="msg-avatar">${icon}</div>
        <div class="msg-content">${text}</div>
    `;
    
    chatContainer.appendChild(div);
}

// Helper: Membuat Bubble Loading
function appendLoading() {
    const chatContainer = document.getElementById('chat-container');
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot-message';
    div.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="msg-content">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Mengecek interaksi obat...
        </div>
    `;
    chatContainer.appendChild(div);
    return id;
}

// Helper: Hapus Bubble (untuk loading)
function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Helper: Scroll otomatis ke bawah
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


// --- 3. LOGIKA NUTRI-GUARD (SCAN MAKANAN) ---

function handleFoodUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = async function(e) {
            // A. Tampilkan Preview Gambar
            document.querySelector('.upload-content').classList.add('hidden'); // Sembunyikan ikon upload
            document.getElementById('scanPreview').classList.remove('hidden'); // Munculkan gambar
            document.getElementById('previewImg').src = e.target.result;

            // Ambil Base64 murni
            const base64 = e.target.result.split(',')[1];
            
            // B. Panggil AI Vision (Mode Food)
            try {
                if (typeof askGeminiVision !== 'function') {
                    throw new Error("Fungsi askGeminiVision tidak ditemukan");
                }

                const result = await askGeminiVision(base64, 'food');
                renderNutriResult(result);
                
                // Matikan animasi loading text
                document.querySelector('.scanning-text').innerHTML = '<i class="fa-solid fa-check"></i> ANALYSIS COMPLETE';
                document.querySelector('.scanning-text').style.color = '#10B981';

            } catch (err) {
                console.error("Food Scan Error:", err);
                alert("Gagal analisa makanan. Cek console.");
                document.querySelector('.scanning-text').innerHTML = '❌ ERROR';
                document.querySelector('.scanning-text').style.color = '#ef4444';
            }
        };
        reader.readAsDataURL(file);
    }
}

// Helper: Menampilkan Hasil Nutrisi ke UI
function renderNutriResult(data) {
    const container = document.getElementById('nutriResult');
    
    // Tentukan warna status (Aman/Bahaya)
    let statusColor = '#10b981'; // Default Hijau
    if (data.status === 'danger') statusColor = '#ef4444'; // Merah
    if (data.status === 'moderate') statusColor = '#f59e0b'; // Kuning
    
    container.innerHTML = `
        <div style="padding: 1.5rem; animation: fadeIn 0.5s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="color:${statusColor}; font-size:1.3rem; margin:0;">${data.food_name}</h3>
                <span style="background:${statusColor}; color:white; padding:4px 10px; border-radius:20px; font-size:0.8rem;">
                    ${data.status.toUpperCase()}
                </span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:1.5rem;">
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; text-align:center;">
                    <span style="display:block; font-size:0.8rem; color:#94a3b8;">CALORIES</span>
                    <b style="font-size:1.1rem; color:white;">${data.calories}</b>
                </div>
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; text-align:center;">
                    <span style="display:block; font-size:0.8rem; color:#94a3b8;">SODIUM</span>
                    <b style="font-size:1.1rem; color:${statusColor};">${data.sodium}</b>
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.2); padding:1rem; border-radius:8px; border-left: 3px solid ${statusColor};">
                <h4 style="margin:0 0 0.5rem 0; color:#cbd5e1; font-size:0.9rem;">Medical Advice:</h4>
                <p style="margin:0; color:#e2e8f0; line-height:1.5;">${data.advice}</p>
            </div>
        </div>
    `;
}
