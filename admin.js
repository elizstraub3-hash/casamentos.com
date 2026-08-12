/* ============================================================
   Painel dos Noivos — leitura das confirmações e recados
   Protegido por login (Firebase Authentication).
   Em modo demonstração, lê do localStorage deste navegador.
   ============================================================ */
import { firebaseConfig, isConfigured } from "./firebase-config.js";

/* Acesso do painel. Os noivos digitam SÓ a senha; o e-mail abaixo é usado
   automaticamente por baixo dos panos (usuário criado no Firebase).
   Senha atual: noivos  (para trocar, altere no Firebase Authentication). */
const ADMIN_EMAIL = "painel-noivos@fernandaealex.app";

const $ = (id) => document.getElementById(id);
const loginBox = $("login-box");
const dashboard = $("dashboard");
const demoNote = $("demo-note");

/* Esconde o campo de e-mail — o login é só por senha. */
function esconderEmail() {
  const emailField = $("email");
  const emailLabel = document.querySelector('label[for="email"]');
  if (emailField) { emailField.style.display = "none"; emailField.removeAttribute("required"); }
  if (emailLabel) emailLabel.style.display = "none";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fmt(d) {
  if (!d) return "—";
  try { return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  catch (e) { return "—"; }
}
const rotulo = { sim: '<span class="tag sim">Vai</span>', talvez: '<span class="tag talvez">Talvez</span>', nao: '<span class="tag nao">Não vai</span>' };

function renderConfirmacoes(lista) {
  const body = $("confirm-body");
  let sim = 0, talvez = 0, nao = 0, pessoas = 0;
  lista.forEach((c) => {
    if (c.presenca === "sim") { sim++; pessoas += Number(c.acompanhantes) || 1; }
    else if (c.presenca === "talvez") talvez++;
    else if (c.presenca === "nao") nao++;
  });
  $("s-sim").textContent = sim;
  $("s-talvez").textContent = talvez;
  $("s-nao").textContent = nao;
  $("s-pessoas").textContent = pessoas;

  if (!lista.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma confirmação ainda.</td></tr>';
    return;
  }
  body.innerHTML = lista.map((c) => {
    const outros = Array.isArray(c.familia) ? c.familia.slice(1) : [];
    const famHtml = outros.length
      ? `<div class="fam">${outros.map((n) => "• " + escapeHtml(n)).join("<br>")}</div>`
      : "";
    return `
    <tr>
      <td><strong>${escapeHtml(c.nome)}</strong>${famHtml}</td>
      <td>${rotulo[c.presenca] || escapeHtml(c.presenca || "—")}</td>
      <td>${c.presenca === "sim" ? (Number(c.acompanhantes) || 1) : "—"}</td>
      <td>${escapeHtml(c.mensagem) || "—"}</td>
      <td>${escapeHtml(fmt(c.criadoEm))}</td>
    </tr>`;
  }).join("");
}

/* ================= FIREBASE ================= */
if (isConfigured) {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const { getFirestore, collection, getDocs, deleteDoc, doc, query, orderBy } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const toDate = (t) => (t && t.toDate ? t.toDate() : null);

  async function carregar() {
    // Confirmações
    const cSnap = await getDocs(query(collection(db, "confirmacoes"), orderBy("criadoEm", "desc")));
    renderConfirmacoes(cSnap.docs.map((d) => ({ ...d.data(), criadoEm: toDate(d.data().criadoEm) })));

    // Recados (com opção de excluir)
    const rSnap = await getDocs(query(collection(db, "recados"), orderBy("criadoEm", "desc")));
    const body = $("recados-body");
    const recados = rSnap.docs.map((d) => ({ id: d.id, ...d.data(), criadoEm: toDate(d.data().criadoEm) }));
    if (!recados.length) {
      body.innerHTML = '<tr><td colspan="4" class="empty">Nenhum recado ainda.</td></tr>';
    } else {
      body.innerHTML = recados.map((r) => `
        <tr>
          <td>${escapeHtml(r.nome)}</td>
          <td>${escapeHtml(r.mensagem)}</td>
          <td>${escapeHtml(fmt(r.criadoEm))}</td>
          <td><button class="del" data-id="${r.id}">excluir</button></td>
        </tr>`).join("");
      body.querySelectorAll(".del").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Excluir este recado do mural?")) return;
          await deleteDoc(doc(db, "recados", btn.dataset.id));
          carregar();
        });
      });
    }
  }

  // Sem senha: o painel autentica sozinho (por baixo dos panos) e abre direto.
  const ADMIN_PASSWORD = "noivos";

  // Já mostra o painel (com "Carregando...") — nada de tela de senha.
  loginBox.classList.add("hidden");
  dashboard.classList.remove("hidden");

  onAuthStateChanged(auth, (user) => {
    if (user) carregar();
  });

  // Login automático silencioso
  signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD).catch((err) => {
    console.error(err);
    $("confirm-body").innerHTML =
      '<tr><td colspan="5" class="empty">Não foi possível carregar agora. Recarregue a página.</td></tr>';
  });

  $("logout").addEventListener("click", () => { location.href = "index.html"; });
  $("refresh").addEventListener("click", carregar);
} else {
  /* ================= MODO DEMONSTRAÇÃO ================= */
  // Senha temporária do painel (só enquanto o Firebase não é configurado).
  // Troque aqui pela senha que quiser. Depois do Firebase, o acesso passa a ser
  // por e-mail e senha de verdade (Authentication).
  const SENHA_DEMO = "fernanda&alex";

  demoNote.classList.remove("hidden");
  loginBox.classList.remove("hidden");
  dashboard.classList.add("hidden");

  // No modo demo pedimos apenas a senha (esconde o e-mail).
  const emailField = $("email");
  const emailLabel = document.querySelector('label[for="email"]');
  if (emailField) { emailField.style.display = "none"; emailField.removeAttribute("required"); }
  if (emailLabel) emailLabel.style.display = "none";

  const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } };

  function carregarDemo() {
    const conf = load("confirmacoes_demo")
      .map((c) => ({ ...c, criadoEm: c.criadoEm ? new Date(c.criadoEm) : null }))
      .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    renderConfirmacoes(conf);

    const body = $("recados-body");
    const recados = load("recados_demo")
      .map((r, i) => ({ id: i, ...r, criadoEm: r.criadoEm ? new Date(r.criadoEm) : null }))
      .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    body.innerHTML = recados.length
      ? recados.map((r) => `<tr><td>${escapeHtml(r.nome)}</td><td>${escapeHtml(r.mensagem)}</td><td>${escapeHtml(fmt(r.criadoEm))}</td><td>—</td></tr>`).join("")
      : '<tr><td colspan="4" class="empty">Nenhum recado ainda.</td></tr>';
  }
  $("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = $("login-msg");
    if ($("senha").value === SENHA_DEMO) {
      loginBox.classList.add("hidden");
      dashboard.classList.remove("hidden");
      carregarDemo();
    } else {
      msg.textContent = "Senha incorreta.";
      msg.classList.add("err");
    }
  });
  $("refresh").addEventListener("click", carregarDemo);
  $("logout").addEventListener("click", () => { location.href = "index.html"; });
}
