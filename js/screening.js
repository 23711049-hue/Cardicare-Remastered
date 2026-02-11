/* =========================================
   CLINICAL SCREENING ENGINE
   ========================================= */

let currentStep = 1;
const totalSteps = 4;
const formData = {};

// Navigasi Wizard
function changeStep(n) {
    // Validasi input sebelum lanjut
    if (n === 1 && !validateStep(currentStep)) return;

    const steps = document.querySelectorAll(".form-step");
    steps[currentStep - 1].classList.remove("active");
    
    currentStep += n;
    
    // Update UI Progress
    document.getElementById("progressFill").style.width = `${(currentStep / totalSteps) * 100}%`;
    document.getElementById("currentStepNum").innerText = currentStep;
    
    // Tampilkan Step Baru
    steps[currentStep - 1].classList.add("active");
    
    // Atur Tombol
    document.getElementById("prevBtn").disabled = currentStep === 1;
    document.getElementById("nextBtn").innerText = currentStep === totalSteps ? "Selesai" : "Lanjut";
    
    // Jika Step 4, Jalankan Analisa
    if (currentStep === 4) {
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("prevBtn").style.display = "none";
        analyzeRisk();
    }
}

// Logic Tampilkan/Sembunyikan Pertanyaan Tambahan
function toggleSubQuestion(id, show) {
    const el = document.getElementById(id);
    if (show) {
        el.style.display = "block";
        // Animasi slide down simple
        el.style.opacity = 0;
        setTimeout(() => el.style.opacity = 1, 50);
    } else {
        el.style.display = "none";
        // Reset nilai input di dalamnya agar tidak merusak skor
        const inputs = el.querySelectorAll('input');
        inputs.forEach(input => input.checked = false);
    }
}

// Validasi Input Sederhana
function validateStep(step) {
    const activeStep = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = activeStep.querySelectorAll("input[type='radio']:checked, input[type='number']");
    
    // Logic validasi kasar (minimal ada yang diisi)
    // Di aplikasi nyata, validasi harus per field
    if (step === 1) {
        const age = document.getElementById("age").value;
        if (!age) { alert("Mohon isi usia Anda."); return false; }
    }
    
    // Simpan data step ini ke object formData
    const allInputs = activeStep.querySelectorAll("input");
    allInputs.forEach(input => {
        if(input.type === 'radio' && input.checked) formData[input.name] = input.value;
        if(input.type === 'number') formData[input.id] = input.value;
    });

    return true;
}

/* =========================================
   THE "ZERO MISS" ALGORITHM
   ========================================= */
function analyzeRisk() {
    let score = 0;
    let redFlags = [];
    let yellowFlags = [];
    let riskLevel = "LOW";
    
    // --- 1. BASELINE RISK (Framingham simplified) ---
    if (formData.age > 50) score += 2;
    if (formData.smoker === 'yes') score += 2;
    if (formData.comorbid === 'yes') score += 3;

    // --- 2. ISCHEMIC / CORONARY CHECKS ---
    if (formData.chest_pain === 'yes') {
        // Cek Karakteristik Nyeri (Typical vs Atypical)
        if (formData.pain_radiating === 'yes') {
            score += 10; 
            redFlags.push("Nyeri menjalar (Indikasi Angina Pektoris)");
        }
        if (formData.pain_trigger === 'exertion') {
            score += 5;
            yellowFlags.push("Nyeri dada saat aktivitas (Stable Angina)");
        } else if (formData.pain_trigger === 'rest') {
            score += 10;
            redFlags.push("Nyeri dada saat istirahat (Unstable Angina - BAHAYA)");
        }
    }

    // --- 3. HEART FAILURE CHECKS (NYHA Criteria) ---
    if (formData.breath === 'yes') {
        score += 3;
        if (formData.orthopnea === 'yes') {
            score += 5;
            redFlags.push("Orthopnea (Sesak saat berbaring - Indikasi Gagal Jantung)");
        }
        if (formData.edema === 'yes') {
            score += 4;
            yellowFlags.push("Edema Kaki (Retensi Cairan)");
        }
    }

    // --- 4. ARRHYTHMIA CHECKS ---
    if (formData.syncope === 'yes') {
        score += 10;
        redFlags.push("Riwayat Pingsan / Syncope (Risiko Henti Jantung Mendadak)");
    }

    // --- HITUNG HASIL AKHIR ---
    setTimeout(() => {
        const resultContainer = document.getElementById("resultContainer");
        let htmlContent = "";

        if (score >= 10 || redFlags.length > 0) {
            // KONDISI BAHAYA (MERAH)
            riskLevel = "HIGH";
            htmlContent = `
                <i class="fa-solid fa-triangle-exclamation result-icon result-danger"></i>
                <h2 class="result-danger">RISIKO TINGGI DETEKSI</h2>
                <p>Terdeteksi tanda klinis yang memerlukan perhatian medis segera.</p>
                
                <div class="recommendation-box" style="border-left: 4px solid var(--danger);">
                    <h3>⚠️ Tanda Bahaya Ditemukan:</h3>
                    <ul>${redFlags.map(f => `<li>${f}</li>`).join('')}</ul>
                    <hr>
                    <strong>REKOMENDASI:</strong>
                    <p>Segera kunjungi Dokter Jantung atau IGD terdekat untuk pemeriksaan EKG dan Enzim Jantung. Jangan tunda.</p>
                </div>
            `;
        } else if (score >= 5) {
            // KONDISI WASPADA (KUNING)
            riskLevel = "MODERATE";
            htmlContent = `
                <i class="fa-solid fa-circle-exclamation result-icon result-warning"></i>
                <h2 class="result-warning">RISIKO SEDANG - WASPADA</h2>
                <p>Ada beberapa indikasi gangguan fungsi jantung, namun belum darurat.</p>
                
                <div class="recommendation-box" style="border-left: 4px solid var(--warning);">
                    <h3>⚠️ Perhatian:</h3>
                    <ul>${yellowFlags.map(f => `<li>${f}</li>`).join('')}</ul>
                    <hr>
                    <strong>REKOMENDASI:</strong>
                    <p>Jadwalkan pemeriksaan ke Poli Jantung dalam 1 minggu ke depan. Lakukan observasi tekanan darah harian.</p>
                </div>
            `;
        } else {
            // KONDISI AMAN (HIJAU)
            riskLevel = "LOW";
            htmlContent = `
                <i class="fa-solid fa-heart-circle-check result-icon result-safe"></i>
                <h2 class="result-safe">RISIKO RENDAH</h2>
                <p>Tidak ditemukan tanda klinis spesifik penyakit jantung mayor.</p>
                
                <div class="recommendation-box" style="border-left: 4px solid var(--success);">
                    <strong>REKOMENDASI:</strong>
                    <p>Pertahankan pola hidup sehat. Lakukan Medical Checkup rutin 1 tahun sekali untuk pemantauan.</p>
                </div>
            `;
        }
        
        // Tambahkan tombol kembali
        htmlContent += `<button onclick="window.location.href='index.html'" class="btn-primary" style="margin-top:2rem">Kembali ke Portal</button>`;
        
        resultContainer.innerHTML = htmlContent;
        resultContainer.classList.remove("loading");
    }, 1500); // Simulasi delay analisa AI
}