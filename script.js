/* ============================================================
   Casamento Fernanda & Alex
   Data do casamento: 31 de outubro de 2026, 15h00 (horário local)
   ➜ Para alterar a data, mude a linha abaixo.
   ============================================================ */
const WEDDING_DATE = new Date("2026-10-31T15:00:00");

/* ----- Menu dropdown do cabeçalho ----- */
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
if (navToggle && navLinks) {
  const fecharMenu = () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };
  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const aberto = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", aberto ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", fecharMenu));
  document.addEventListener("click", (e) => {
    if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) fecharMenu();
  });
}

/* ----- Nossa música (player só de áudio via YouTube) ----- */
const playerBtn = document.getElementById("player-btn");
if (playerBtn) {
  let ytPlayer = null;
  let tocando = false;
  const PLAY = "▶";      // ▶
  const PAUSE = "⏸";     // ⏸

  const atualizar = () => {
    playerBtn.innerHTML = tocando ? PAUSE : PLAY;
    playerBtn.setAttribute("aria-label", tocando ? "Pausar música" : "Tocar música");
  };

  // Carrega a API do YouTube uma vez
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player("yt-audio", {
      videoId: "51lOFuCR7dE",
      playerVars: { playsinline: 1 },
      events: {
        onStateChange: (e) => {
          tocando = e.data === YT.PlayerState.PLAYING;
          atualizar();
        },
      },
    });
  };

  playerBtn.addEventListener("click", () => {
    if (!ytPlayer || typeof ytPlayer.playVideo !== "function") return;
    if (tocando) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
  });
}

/* ----- Galeria do casal (visualizador) ----- */
const galeriaImgs = Array.from(document.querySelectorAll(".galeria__item img"));
const lightbox = document.getElementById("lightbox");
if (galeriaImgs.length && lightbox) {
  const lbImg = document.getElementById("lb-img");
  const fontes = galeriaImgs.map((i) => i.getAttribute("src"));
  let atual = 0;
  const mostrar = (i) => {
    atual = (i + fontes.length) % fontes.length;
    lbImg.src = fontes[atual];
  };
  const abrir = (i) => { mostrar(i); lightbox.classList.add("open"); lightbox.setAttribute("aria-hidden", "false"); };
  const fechar = () => { lightbox.classList.remove("open"); lightbox.setAttribute("aria-hidden", "true"); };
  galeriaImgs.forEach((img, i) => img.parentElement.addEventListener("click", () => abrir(i)));
  document.getElementById("lb-close").addEventListener("click", fechar);
  document.getElementById("lb-prev").addEventListener("click", (e) => { e.stopPropagation(); mostrar(atual - 1); });
  document.getElementById("lb-next").addEventListener("click", (e) => { e.stopPropagation(); mostrar(atual + 1); });
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) fechar(); });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") fechar();
    else if (e.key === "ArrowLeft") mostrar(atual - 1);
    else if (e.key === "ArrowRight") mostrar(atual + 1);
  });
}

/* ----- Contagem regressiva ----- */
const el = {
  days: document.getElementById("cd-days"),
  hours: document.getElementById("cd-hours"),
  mins: document.getElementById("cd-mins"),
  secs: document.getElementById("cd-secs"),
  msg: document.getElementById("countdown-msg"),
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = WEDDING_DATE - now;

  if (diff <= 0) {
    el.days.textContent = "00";
    el.hours.textContent = "00";
    el.mins.textContent = "00";
    el.secs.textContent = "00";
    el.msg.textContent = "Hoje é o grande dia! ❤";
    clearInterval(timer);
    return;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  el.days.textContent = pad(days);
  el.hours.textContent = pad(hours);
  el.mins.textContent = pad(mins);
  el.secs.textContent = pad(secs);
}

updateCountdown();
const timer = setInterval(updateCountdown, 1000);

/* O envio do formulário e a renderização do mural são tratados em recados.js
   (integração com o Firebase). Aqui ficam só a navegação por setas e o contador. */

/* ----- Carrossel do mural (setas) ----- */
const muralTrack = document.getElementById("mural-grid");
const muralPrev = document.getElementById("mural-prev");
const muralNext = document.getElementById("mural-next");
if (muralTrack && muralPrev && muralNext) {
  const passo = () => {
    const card = muralTrack.querySelector(".mural-card");
    return card ? card.getBoundingClientRect().width + 22 : muralTrack.clientWidth * 0.85;
  };
  muralPrev.addEventListener("click", () => muralTrack.scrollBy({ left: -passo(), behavior: "smooth" }));
  muralNext.addEventListener("click", () => muralTrack.scrollBy({ left: passo(), behavior: "smooth" }));
}


/* ----- Presente via Pix: botões de copiar ----- */
const pixFeedback = document.getElementById("pix-feedback");

function showPixFeedback(msg) {
  if (!pixFeedback) return;
  pixFeedback.hidden = false;
  pixFeedback.textContent = msg;
  clearTimeout(showPixFeedback._t);
  showPixFeedback._t = setTimeout(() => {
    pixFeedback.hidden = true;
  }, 3500);
}

function copyText(text, successMsg) {
  const done = () => showPixFeedback(successMsg);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
  function fallbackCopy() {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {
      showPixFeedback("Não foi possível copiar. Copie manualmente, por favor.");
    }
    document.body.removeChild(ta);
  }
}

const btnCopyKey = document.getElementById("pix-copy-key");
if (btnCopyKey) {
  btnCopyKey.addEventListener("click", () => {
    const keyEl = document.getElementById("pix-key");
    const key = keyEl.getAttribute("data-key") || keyEl.textContent.trim();
    copyText(key, "Chave Pix copiada! 💙");
  });
}

const btnCopyBr = document.getElementById("pix-copy-brcode");
if (btnCopyBr) {
  btnCopyBr.addEventListener("click", () => {
    const brcode = document.getElementById("pix-brcode").textContent.trim();
    copyText(brcode, "Código Pix copiado! Cole no app do seu banco 💙");
  });
}

/* ----- Animação de revelação ao rolar ----- */
const revealTargets = document.querySelectorAll(
  ".timeline__item, .detail-card, .story__intro, .rsvp__intro, .gift__intro, .gift__card"
);
revealTargets.forEach((t) => t.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((t) => observer.observe(t));
} else {
  revealTargets.forEach((t) => t.classList.add("is-visible"));
}
