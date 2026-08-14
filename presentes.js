/* ============================================================
   Lista de Presentes — Pix por item e sistema de cotas
   Os cards aparecem na hora; as cotas (coleção "cotas" do Firestore)
   carregam em segundo plano, sem travar a página.
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

/* ---------- Estado das cotas ---------- */
let db = null, _collection, _addDoc, _getDocs, _serverTimestamp;
const pendentes = [];               // cotas dadas antes do Firebase carregar
const cotaCards = [];               // controladores por card

function registrarCota(id, valor) {
  if (db) {
    _addDoc(_collection(db, "cotas"), { presente: id, valor, criadoEm: _serverTimestamp() }).catch((e) => console.error(e));
  } else {
    pendentes.push({ presente: id, valor });
  }
}

/* ---------- Renderiza os cards NA HORA ---------- */
document.querySelectorAll(".presente-card[data-valor]").forEach((card) => {
  const valor = parseFloat(card.dataset.valor) || 0;
  const cotas = parseInt(card.dataset.cotas) || 0;
  const id = card.dataset.id;
  const precoEl = card.querySelector(".presente-card__preco");
  const btn = card.querySelector(".btn-pix");
  if (!btn || !precoEl) return;

  if (cotas > 0 && id) {
    const cotaValor = Math.round(valor / cotas);
    let pegas = 0;
    const render = () => {
      const restam = Math.max(0, cotas - pegas);
      precoEl.innerHTML = `${brl(valor)}<span class="cota-info">${brl(cotaValor)} por cota &middot; restam ${restam} de ${cotas}</span>`;
      if (restam <= 0) { btn.disabled = true; btn.innerHTML = "Cotas esgotadas &#128153;"; }
      else { btn.disabled = false; btn.innerHTML = `&#128153; Dar 1 cota (${brl(cotaValor)})`; }
    };
    render();
    btn.addEventListener("click", () => {
      if (pegas >= cotas) return;
      copiar(gerarPix(cotaValor), () => {});
      const ok = confirm(
        `Copiamos o Pix desta cota (${brl(cotaValor)}). Faça o pagamento no app do seu banco.\n\n` +
        `Já concluiu o Pix? Clique OK para reservar a sua cota. ❤`
      );
      if (!ok) return;
      pegas++;
      render();
      toast("Cota reservada! Muito obrigado pelo carinho ❤");
      registrarCota(id, cotaValor);
    });
    cotaCards.push({ id, setPegas: (n) => { pegas = n; render(); } });
  } else {
    precoEl.textContent = valor > 0 ? brl(valor) : "Ver preço na loja";
    btn.addEventListener("click", () => {
      copiar(gerarPix(valor), () => toast(`Pix de ${brl(valor)} copiado! Cole no app do seu banco ❤`));
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

    // grava cotas que foram dadas antes do Firebase carregar
    pendentes.splice(0).forEach((c) => registrarCota(c.presente, c.valor));

    // conta as cotas já presenteadas e atualiza os cards
    const map = {};
    const snap = await _getDocs(_collection(db, "cotas"));
    snap.forEach((d) => { const p = d.data().presente; map[p] = (map[p] || 0) + 1; });
    cotaCards.forEach((c) => { if (map[c.id]) c.setPegas(map[c.id]); });
  } catch (e) {
    console.error("Cotas em modo simples (Firebase indisponível):", e);
  }
})();
