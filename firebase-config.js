/* ============================================================
   CONFIGURAÇÃO DO FIREBASE
   ------------------------------------------------------------
   COLE AQUI os dados do seu projeto Firebase.
   Onde encontrar: console.firebase.google.com  →  seu projeto
   →  ⚙ Configurações do projeto  →  aba "Geral"  →  "Seus apps"
   →  app da Web  →  "Configuração do SDK" (firebaseConfig).

   Enquanto os valores estiverem como "COLE_AQUI...", o site funciona
   em MODO DEMONSTRAÇÃO (salva só no navegador). Assim que você colar
   os dados reais, tudo passa a funcionar online automaticamente.
   ============================================================ */

export const firebaseConfig = {
  apiKey: "COLE_AQUI_API_KEY",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI_PROJECT_ID",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI_SENDER_ID",
  appId: "COLE_AQUI_APP_ID",
};

// Detecta automaticamente se você já preencheu a configuração.
export const isConfigured = !Object.values(firebaseConfig).some((v) =>
  String(v).startsWith("COLE_AQUI")
);
