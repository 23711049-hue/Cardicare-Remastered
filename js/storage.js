/* =========================================
   CARDI-CARE STORAGE ENGINE (PHASE 3)
   ========================================= */

const STORAGE_KEY = 'cardicare_history';

/**
 * Menyimpan hasil analisis ke localStorage
 */
function saveToHistory(type, data) {
    // 1. Ambil data lama
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // 2. Tambahkan data baru dengan Timestamp
    const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleString('id-ID'),
        type: type, // 'ekg', 'cxr', atau 'food'
        result: data
    };

    history.unshift(newEntry); // Taruh di paling atas

    // 3. Batasi hanya 10 riwayat terakhir agar tidak penuh
    const limitedHistory = history.slice(0, 10);

    // 4. Simpan kembali
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    console.log(`✅ Saved ${type} to history.`);
}

/**
 * Mengambil semua riwayat
 */
function getHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}