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

/* O formulário de confirmação e o mural de recados são tratados em recados.js
   (integração com o Firebase). */

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
