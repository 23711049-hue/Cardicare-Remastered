/* ============================================================
   CARDICARE CONFIGURATION
   Centralized Configuration File
   ============================================================ */

const CONFIG = {
    // API Key kamu (Ini yang akan dipakai oleh gemini.js)
    API_KEY: "AIzaSyASHOwJFjqPW60Vz8whv6wxiOZCB3opmjc",
    
    // Model Version (Bisa diganti kalau mau upgrade)
    MODEL_NAME: "gemini-2.5-flash-lite"
};

// Mencegah perubahan tak sengaja pada konfigurasi
Object.freeze(CONFIG);
