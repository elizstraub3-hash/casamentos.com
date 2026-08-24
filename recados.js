/* ============================================================
   Recados & Confirmações — integração com Firebase (Firestore)
   O formulário responde na hora; o Firebase carrega em segundo
   plano (não trava o envio). Sem Firebase, cai no modo local.
   ============================================================ */
import { firebaseConfig, isConfigured } from "./firebase-config.js";

const muralGrid = document.getElementById("mural-grid");
const form = document.getElementById("rsvp-form");
const feedback = document.getElementById("rsvp-feedback");

/* ---------- utilidades ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function formatarData(d) {
  if (!d) return "";
  try { return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch (e) { return ""; }
}
function inicial(nome) {
  const n = (nome || "").trim();
  return n ? n[0].toUpperCase() : "♥";
}
function renderMural(lista) {
  if (!muralGrid) return;
  if (!lista.length) {
    muralGrid.innerHTML = '<p class="mural__empty">Ainda não há recados. Seja o primeiro a deixar um carinho! 😊</p>';
    return;
  }
  muralGrid.innerHTML = lista.map((r) => `
      <article class="mural-card">
        <div class="mural-card__top">
          <span class="mural-card__avatar">${escapeHtml(inicial(r.nome))}</span>
          <span class="mural-card__name">${escapeHtml(r.nome || "Convidado(a)")}</span>
        </div>
        <p class="mural-card__msg">${escapeHtml(r.mensagem || "")}</p>
        ${r.criadoEm ? `<span class="mural-card__date">${escapeHtml(formatarData(r.criadoEm))}</span>` : ""}
      </article>`).join("");
}

/* ---------- camada de dados (carrega em segundo plano) ---------- */
// backendPronto resolve para a função de envio assim que estiver pronta.
let resolverBackend;
const backendPronto = new Promise((r) => { resolverBackend = r; });

if (isConfigured) {
  (async () => {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const db = getFirestore(initializeApp(firebaseConfig));

    // Mural ao vivo
    onSnapshot(
      query(collection(db, "recados"), orderBy("criadoEm", "desc")),
      (snap) => renderMural(snap.docs.map((doc) => {
        const x = doc.data();
        return { nome: x.nome, mensagem: x.mensagem, criadoEm: x.criadoEm && x.criadoEm.toDate ? x.criadoEm.toDate() : null };
      })),
      (err) => console.error("Erro ao carregar o mural:", err)
    );

    resolverBackend(async ({ nome, presenca, acompanhantes, mensagem, familia }) => {
      await addDoc(collection(db, "confirmacoes"), {
        nome, presenca, acompanhantes, familia: familia || [nome], mensagem, criadoEm: serverTimestamp(),
      });
      if (mensagem) {
        await addDoc(collection(db, "recados"), { nome, mensagem, criadoEm: serverTimestamp() });
      }
    });
  })().catch((e) => {
    console.error("Firebase indisponível:", e);
    // Se o Firebase falhar, o envio avisa o erro (não salva silenciosamente).
    resolverBackend(async () => { throw new Error("firebase-indisponivel"); });
  });
} else {
  // ----- Modo demonstração (localStorage) -----
  const KEY_R = "recados_demo";
  const KEY_C = "confirmacoes_demo";
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } };
  const renderLocal = () => {
    const lista = load(KEY_R)
      .map((x) => ({ nome: x.nome, mensagem: x.mensagem, criadoEm: x.criadoEm ? new Date(x.criadoEm) : null }))
      .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    renderMural(lista);
  };
  renderLocal();
  resolverBackend(async ({ nome, presenca, acompanhantes, mensagem, familia }) => {
    const c = load(KEY_C);
    c.push({ nome, presenca, acompanhantes, familia: familia || [nome], mensagem, criadoEm: new Date().toISOString() });
    localStorage.setItem(KEY_C, JSON.stringify(c));
    if (mensagem) {
      const r = load(KEY_R);
      r.push({ nome, mensagem, criadoEm: new Date().toISOString() });
      localStorage.setItem(KEY_R, JSON.stringify(r));
    }
    renderLocal();
  });
}

async function enviar(dados) {
  const fn = await backendPronto;
  return fn(dados);
}

/* ---------- formulário (ligado IMEDIATAMENTE) ---------- */
if (form) {
  const botao = form.querySelector('button[type="submit"]');
  const acompInput = document.getElementById("acompanhantes");
  const presencaSel = document.getElementById("presenca");
  const familiaWrap = document.getElementById("familia-wrap");
  const familiaLista = document.getElementById("familia-lista");

  function renderFamilia() {
    if (!familiaWrap || !familiaLista) return;
    const n = Number(acompInput.value) || 1;
    const extra = presencaSel.value === "nao" ? 0 : Math.max(0, n - 1);
    if (extra <= 0) { familiaWrap.hidden = true; familiaLista.innerHTML = ""; return; }
    familiaWrap.hidden = false;
    const antigos = Array.from(familiaLista.querySelectorAll("input")).map((i) => i.value);
    let html = "";
    for (let i = 0; i < extra; i++) {
      const v = antigos[i] ? ` value="${antigos[i].replace(/"/g, "&quot;")}"` : "";
      html += `<input type="text" placeholder="Nome da ${i + 2}ª pessoa"${v} />`;
    }
    familiaLista.innerHTML = html;
  }
  if (acompInput) acompInput.addEventListener("input", renderFamilia);
  if (presencaSel) presencaSel.addEventListener("change", renderFamilia);

  const mostrar = (msg, erro) => {
    feedback.hidden = false;
    feedback.style.color = erro ? "#c0392b" : "";
    feedback.textContent = msg;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const presenca = document.getElementById("presenca").value;
    const acompanhantes = Number(document.getElementById("acompanhantes").value) || 1;
    const mensagem = document.getElementById("mensagem").value.trim();

    if (!nome || !presenca) {
      mostrar("Por favor, preencha seu nome e confirme sua presença.", true);
      return;
    }

    // Nome de cada pessoa da família (quando vai comparecer com mais gente)
    let familia = [nome];
    if (presenca !== "nao" && acompanhantes > 1) {
      const nomes = Array.from(document.querySelectorAll("#familia-lista input")).map((i) => i.value.trim());
      if (nomes.some((v) => !v)) {
        mostrar("Por favor, informe o nome de cada pessoa da sua família.", true);
        return;
      }
      familia = [nome, ...nomes];
    }

    botao.disabled = true;
    const textoOriginal = botao.textContent;
    botao.textContent = "Enviando...";
    try {
      await enviar({ nome, presenca, acompanhantes, mensagem, familia });
      mostrar(
        presenca === "nao"
          ? `Obrigado pelo carinho, ${nome}! Vamos sentir sua falta ❤`
          : `Confirmação recebida, ${nome}! Obrigado com muito amor ❤`
      );
      form.reset();
      document.getElementById("acompanhantes").value = 1;
      renderFamilia();
    } catch (err) {
      console.error(err);
      mostrar("Ops! Não conseguimos enviar agora. Confira sua internet e tente de novo.", true);
    } finally {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  });
}
