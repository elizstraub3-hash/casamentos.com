/* ============================================================
   Casamento Fernanda & Alex
   Data do casamento: 31 de outubro de 2026, 15h00 (horário local)
   ➜ Para alterar a data, mude a linha abaixo.
   ============================================================ */
const WEDDING_DATE = new Date("2026-10-31T15:00:00");

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

/* ----- Formulário de recado / RSVP ----- */
const form = document.getElementById("rsvp-form");
const feedback = document.getElementById("rsvp-feedback");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const presenca = document.getElementById("presenca").value;

  if (!nome || !presenca) {
    feedback.hidden = false;
    feedback.style.color = "#c0392b";
    feedback.textContent = "Por favor, preencha seu nome e confirme sua presença.";
    return;
  }

  // Guarda o recado localmente no navegador (demonstração — sem servidor).
  try {
    const recados = JSON.parse(localStorage.getItem("recados") || "[]");
    recados.push({
      nome: nome,
      presenca: presenca,
      mensagem: document.getElementById("mensagem").value.trim(),
      data: new Date().toISOString(),
    });
    localStorage.setItem("recados", JSON.stringify(recados));
  } catch (err) {
    /* ignora se o localStorage não estiver disponível */
  }

  feedback.hidden = false;
  feedback.style.color = "";
  feedback.textContent =
    presenca === "nao"
      ? "Obrigado pelo carinho, " + nome + "! Vamos sentir sua falta ❤"
      : "Obrigado, " + nome + "! Recebemos seu recado com muito amor ❤";
  form.reset();
});

/* ----- Animação de revelação ao rolar ----- */
const revealTargets = document.querySelectorAll(
  ".timeline__item, .detail-card, .story__intro, .rsvp__intro"
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
