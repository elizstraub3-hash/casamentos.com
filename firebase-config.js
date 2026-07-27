/* ============================================================
   CONFIGURAÇÃO DO FIREBASE — projeto dos noivos
   ============================================================ */

export const firebaseConfig = {
  apiKey: "AIzaSyAZ5nDWfvD4d83kUhBsdeuNygtOs9u6X8M",
  authDomain: "casamentofernandaealex-32976.firebaseapp.com",
  projectId: "casamentofernandaealex-32976",
  storageBucket: "casamentofernandaealex-32976.firebasestorage.app",
  messagingSenderId: "494604907442",
  appId: "1:494604907442:web:b9b4d33a9357483e532aab",
  measurementId: "G-KPF55G004E",
};

// Detecta automaticamente se a configuração já foi preenchida.
export const isConfigured = !Object.values(firebaseConfig).some((v) =>
  String(v).startsWith("COLE_AQUI")
);
