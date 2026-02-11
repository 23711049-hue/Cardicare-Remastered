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