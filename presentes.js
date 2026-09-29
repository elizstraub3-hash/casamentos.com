/* ============================================================
   Lista de Presentes — Pix por item + registro de doação
   Uma doação só é registrada quando a pessoa escreve o NOME e
   confirma que fez o Pix (janela de confirmação). O nome vai
   para o painel dos noivos. As cotas carregam em segundo plano.
   ============================================================ */
import { firebaseConfig, isConfigured } from "./firebase-config.js";

/* ---------- Menu dropdown ---------- */
const t = document.getElementById("nav-toggle");
const l = document.getElementById("nav-links");
if (t && l) {
  const fechar = () => { l.classList.remove("open"); t.setAttribute("aria-expanded", "false"); };
  t.addEventListener("click", (e) => {
    e.stopPropagation();
    const aberto = l.classList.toggle("open");
    t.setAttribute("aria-expanded", aberto ? "true" : "false");
  });
  l.querySelectorAll("a").forEach((a) => a.addEventListener("click", fechar));
  document.addEventListener("click", (e) => { if (!l.contains(e.target) && !t.contains(e.target)) fechar(); });
}

/* ---------- Pix ---------- */
const PIX = { chave: "ff859a5b-d6c1-4051-bfa7-5c3f5e95fb0e", nome: "FERNANDA A RODRIGUES", cidade: "COLOMBO" };
function tlv(id, v) { return id + String(v.length).padStart(2, "0") + v; }
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) { crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1); crc &= 0xFFFF; }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function gerarPix(valor) {
  const mai = tlv("00", "br.gov.bcb.pix") + tlv("01", PIX.chave);
  let p = tlv("00", "01") + tlv("26", mai) + tlv("52", "0000") + tlv("53", "986");
  if (valor > 0) p += tlv("54", valor.toFixed(2));
  p += tlv("58", "BR") + tlv("59", PIX.nome) + tlv("60", PIX.cidade) + tlv("62", tlv("05", "***")) + "6304";
  return p + crc16(p);
}
function brl(v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

let toastEl;
function toast(msg) {
  if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove("show"), 4500);
}
function copiar(texto, cb) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(cb).catch(fallback);
  } else { fallback(); }
  function fallback() {
    const ta = document.createElement("textarea");
    ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); cb(); } catch (e) {}
    document.body.removeChild(ta);
  }
}

/* ---------- Estado das cotas/doações ---------- */
let db = null, _collection, _addDoc, _getDocs, _serverTimestamp;
const pendentes = [];               // doações feitas antes do Firebase carregar
const cotaCards = [];               // controladores dos vouchers

function registrarDoacao({ id, titulo, valor, nome }) {
  if (db) {
    _addDoc(_collection(db, "cotas"), {
      presente: id, presenteNome: titulo, nome, valor, criadoEm: _serverTimestamp(),
    }).catch((e) => console.error("Não foi possível registrar a doação:", e));
  } else {
    pendentes.push({ id, titulo, valor, nome });
  }
}

/* ---------- Janela de confirmação (pede o nome) ---------- */
const overlay = document.getElementById("doar-overlay");
const elTitulo = document.getElementById("doar-titulo");
const elValor = document.getElementById("doar-valor");
const elNome = document.getElementById("doar-nome");
const elErro = document.getElementById("doar-erro");
const btnConfirmar = document.getElementById("doar-confirmar");
const btnCancelar = document.getElementById("doar-cancelar");
const btnX = document.getElementById("doar-x");
const btnRecopiar = document.getElementById("doar-recopiar");

let modalConfirmar = null;   // callback ao confirmar
let modalValor = 0;          // valor do presente atual (para recopiar)

function abrirModal({ titulo, valor, onConfirm }) {
  if (!overlay) { // fallback: sem modal no HTML, usa confirm simples
    const nome = (prompt("Qual o seu nome? (para os noivos saberem quem presenteou)") || "").trim();
    if (nome) onConfirm(nome);
    return;
  }
  modalConfirmar = onConfirm;
  modalValor = valor;
  elTitulo.textContent = titulo;
  elValor.textContent = valor > 0 ? brl(valor) : "";
  elNome.value = "";
  if (elErro) elErro.hidden = true;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => elNome && elNome.focus(), 60);
}
function fecharModal() {
  if (!overlay) return;
  overlay.hidden = true;
  modalConfirmar = null;
  document.body.style.overflow = "";
}
if (overlay) {
  btnConfirmar.addEventListener("click", () => {
    const nome = elNome.value.trim();
    if (nome.length < 2) { if (elErro) elErro.hidden = false; elNome.focus(); return; }
    const fn = modalConfirmar;
    fecharModal();
    if (fn) fn(nome);
  });
  elNome.addEventListener("keydown", (e) => { if (e.key === "Enter") btnConfirmar.click(); });
  btnCancelar.addEventListener("click", fecharModal);
  btnX.addEventListener("click", fecharModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) fecharModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) fecharModal(); });
  if (btnRecopiar) {
    btnRecopiar.addEventListener("click", () => {
      copiar(gerarPix(modalValor), () => toast("Pix copiado de novo! ❤"));
    });
  }
}

/* ---------- Renderiza os cards NA HORA ---------- */
document.querySelectorAll(".presente-card[data-valor]").forEach((card) => {
  const valor = parseFloat(card.dataset.valor) || 0;
  const qtd = parseInt(card.dataset.qtd) || 1;   // quantas pessoas podem presentear (>1 só no voucher)
  const id = card.dataset.id;
  const titulo = (card.querySelector("h3")?.textContent || id || "Presente").trim();
  const precoEl = card.querySelector(".presente-card__preco");
  const btn = card.querySelector(".btn-pix");
  if (!btn || !precoEl) return;

  if (qtd > 1 && id) {
    // Voucher: até "qtd" pessoas podem presentear, cada uma paga o valor cheio
    let pegas = 0;
    const render = () => {
      const restam = Math.max(0, qtd - pegas);
      precoEl.innerHTML = `${brl(valor)}<span class="cota-info">restam ${restam} de ${qtd}</span>`;
      if (restam <= 0) { btn.disabled = true; btn.innerHTML = "Já presenteado &#128153;"; }
      else { btn.disabled = false; btn.innerHTML = "&#128153; Presentear"; }
    };
    render();
    btn.addEventListener("click", () => {
      if (pegas >= qtd) return;
      copiar(gerarPix(valor), () => {});
      abrirModal({
        titulo, valor,
        onConfirm: (nome) => {
          pegas++; render();
          registrarDoacao({ id, titulo, valor, nome });
          toast(`Presente reservado, ${nome}! Muito obrigado pelo carinho ❤`);
        },
      });
    });
    cotaCards.push({ id, setPegas: (n) => { pegas = n; render(); } });
  } else {
    // Presente comum (sem limite de quantidade)
    precoEl.textContent = valor > 0 ? brl(valor) : "Ver preço na loja";
    btn.addEventListener("click", () => {
      copiar(gerarPix(valor), () => {});
      abrirModal({
        titulo, valor,
        onConfirm: (nome) => {
          registrarDoacao({ id, titulo, valor, nome });
          toast(`Obrigado, ${nome}! Seu presente foi registrado com carinho ❤`);
        },
      });
    });
  }
});

/* ---------- Carrega as cotas do Firebase em segundo plano ---------- */
(async () => {
  if (!isConfigured) return;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, addDoc, getDocs, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    db = getFirestore(initializeApp(firebaseConfig));
    _collection = collection; _addDoc = addDoc; _getDocs = getDocs; _serverTimestamp = serverTimestamp;

    // grava doações que aconteceram antes do Firebase carregar
    pendentes.splice(0).forEach((c) => registrarDoacao(c));

    // conta as doações já feitas e atualiza os vouchers
    const map = {};
    const snap = await _getDocs(_collection(db, "cotas"));
    snap.forEach((d) => { const p = d.data().presente; map[p] = (map[p] || 0) + 1; });
    cotaCards.forEach((c) => { if (map[c.id]) c.setPegas(map[c.id]); });
  } catch (e) {
    console.error("Cotas em modo simples (Firebase indisponível):", e);
  }
})();
