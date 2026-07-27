/* ============================================================
   Recados & Confirmações — integração com Firebase (Firestore)
   Se o Firebase não estiver configurado, funciona em modo
   demonstração salvando no navegador (localStorage).
   ============================================================ */
import { firebaseConfig, isConfigured } from "./firebase-config.js";

const muralGrid = document.getElementById("mural-grid");
const form = document.getElementById("rsvp-form");
const feedback = document.getElementById("rsvp-feedback");

/* ---------- utilidades ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarData(d) {
  if (!d) return "";
  try {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch (e) {
    return "";
  }
}

function inicial(nome) {
  const n = (nome || "").trim();
  return n ? n[0].toUpperCase() : "♥";
}

function renderMural(lista) {
  if (!muralGrid) return;
  if (!lista.length) {
    muralGrid.innerHTML =
      '<p class="mural__empty">Ainda não há recados. Seja o primeiro a deixar um carinho! 😊</p>';
    return;
  }
  muralGrid.innerHTML = lista
    .map(
      (r) => `
      <article class="mural-card">
        <div class="mural-card__top">
          <span class="mural-card__avatar">${escapeHtml(inicial(r.nome))}</span>
          <span class="mural-card__name">${escapeHtml(r.nome || "Convidado(a)")}</span>
        </div>
        <p class="mural-card__msg">${escapeHtml(r.mensagem || "")}</p>
        ${r.criadoEm ? `<span class="mural-card__date">${escapeHtml(formatarData(r.criadoEm))}</span>` : ""}
      </article>`
    )
    .join("");
}

/* ---------- camada de dados (Firebase ou demonstração) ---------- */
let enviar; // função assíncrona de envio

if (isConfigured) {
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
  );
  const {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
  } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Mural ao vivo (atualiza sozinho quando alguém deixa um recado)
  const q = query(collection(db, "recados"), orderBy("criadoEm", "desc"));
  onSnapshot(
    q,
    (snap) => {
      const lista = snap.docs.map((doc) => {
        const x = doc.data();
        return {
          nome: x.nome,
          mensagem: x.mensagem,
          criadoEm: x.criadoEm && x.criadoEm.toDate ? x.criadoEm.toDate() : null,
        };
      });
      renderMural(lista);
    },
    (err) => {
      console.error("Erro ao carregar o mural:", err);
    }
  );

  enviar = async ({ nome, presenca, acompanhantes, mensagem }) => {
    await addDoc(collection(db, "confirmacoes"), {
      nome,
      presenca,
      acompanhantes,
      mensagem,
      criadoEm: serverTimestamp(),
    });
    if (mensagem) {
      await addDoc(collection(db, "recados"), {
        nome,
        mensagem,
        criadoEm: serverTimestamp(),
      });
    }
  };
} else {
  // ----- Modo demonstração (localStorage) -----
  const KEY_R = "recados_demo";
  const KEY_C = "confirmacoes_demo";
  const load = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "[]");
    } catch (e) {
      return [];
    }
  };
  const renderLocal = () => {
    const lista = load(KEY_R)
      .map((x) => ({
        nome: x.nome,
        mensagem: x.mensagem,
        criadoEm: x.criadoEm ? new Date(x.criadoEm) : null,
      }))
      .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    renderMural(lista);
  };
  renderLocal();

  enviar = async ({ nome, presenca, acompanhantes, mensagem }) => {
    const c = load(KEY_C);
    c.push({ nome, presenca, acompanhantes, mensagem, criadoEm: new Date().toISOString() });
    localStorage.setItem(KEY_C, JSON.stringify(c));
    if (mensagem) {
      const r = load(KEY_R);
      r.push({ nome, mensagem, criadoEm: new Date().toISOString() });
      localStorage.setItem(KEY_R, JSON.stringify(r));
    }
    renderLocal();
  };
}

/* ---------- envio do formulário ---------- */
if (form) {
  const botao = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const presenca = document.getElementById("presenca").value;
    const acompanhantes = Number(document.getElementById("acompanhantes").value) || 1;
    const mensagem = document.getElementById("mensagem").value.trim();

    const mostrar = (msg, erro) => {
      feedback.hidden = false;
      feedback.style.color = erro ? "#c0392b" : "";
      feedback.textContent = msg;
    };

    if (!nome || !presenca) {
      mostrar("Por favor, preencha seu nome e confirme sua presença.", true);
      return;
    }

    botao.disabled = true;
    const textoOriginal = botao.textContent;
    botao.textContent = "Enviando...";
    try {
      await enviar({ nome, presenca, acompanhantes, mensagem });
      mostrar(
        presenca === "nao"
          ? `Obrigado pelo carinho, ${nome}! Vamos sentir sua falta ❤`
          : `Obrigado, ${nome}! Recebemos sua confirmação com muito amor ❤`
      );
      form.reset();
      document.getElementById("acompanhantes").value = 1;
    } catch (err) {
      console.error(err);
      mostrar("Ops! Não conseguimos enviar agora. Tente novamente em instantes.", true);
    } finally {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  });
}
