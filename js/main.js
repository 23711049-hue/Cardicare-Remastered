/* =========================================
   CARDI-CARE MAIN PORTAL LOGIC
   ========================================= */

console.log("CardiCare Portal Loaded");

// Fungsi untuk membuka Kuesioner Screening
function openScreening() {
    // Kita arahkan ke file screening.html yang akan kita buat
    window.location.href = 'screening.html';
}

// Fungsi untuk masuk ke Portal (Dokter/Pasien)
function enterPortal(role) {
    if (role === 'doctor') {
        window.location.href = 'doctor.html';
    } else if (role === 'patient') {
        window.location.href = 'patient.html';
    }
}

// Tambahan: Inisialisasi Dashboard Riwayat jika ada di index.html
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
});
// Fungsi Menampilkan Loading
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    overlay.classList.remove('d-none');
    
    // Efek Ganti-ganti Teks biar keren
    const messages = ["Membaca pola EKG...", "Mendeteksi anomali...", "Menyusun diagnosa..."];
    let i = 0;
    window.loadingInterval = setInterval(() => {
        text.innerText = messages[i % messages.length];
        i++;
    }, 1500); // Ganti teks tiap 1.5 detik
}

// Fungsi Menyembunyikan Loading
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('d-none');
    clearInterval(window.loadingInterval); // Stop ganti teks
}
