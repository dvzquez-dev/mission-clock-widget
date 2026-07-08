const TIME_ZONE = "Europe/Madrid";
const MOTTO = "BORN TO RISE";

const $ = (selector) => document.querySelector(selector);
const pad2 = (n) => String(n).padStart(2, "0");

const widget = $("#widget");
const orbitMotion = document.querySelector(".orbit-motion");

const els = {
  hours: $("#hours"),
  minutes: $("#minutes"),
  seconds: $("#seconds"),
  motto: $("#motto"),
  dateText: $("#dateText"),
  seasonLabel: $("#seasonLabel"),
  seasonPercent: $("#seasonPercent"),
  monthPercent: $("#monthPercent"),
  weekPercent: $("#weekPercent"),
  dayPercent: $("#dayPercent"),
};

renderMotto();

function renderMotto() {
  if (!els.motto) return;

  els.motto.innerHTML = "";

  for (const char of MOTTO) {
    const span = document.createElement("span");

    if (char === " ") {
      span.className = "motto-space";
      span.innerHTML = "&nbsp;";
    } else {
      span.textContent = char;
    }

    els.motto.appendChild(span);
  }
}

function applyLayout() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  const ratio = w / h;

  let layout = "focus";

  /*
    Layout predeterminado:
    - focus: el bonito, vertical centrado.
    Solo baja a otros layouts si el iframe no da espacio.
  */
  if (w < 320 || h < 150) {
    layout = "micro";
  } else if (h <= 230) {
    layout = w >= 360 ? "low" : "micro";
  } else if (w >= 390 && h >= 330) {
    layout = "focus";
  } else if (w >= 650 && h >= 231) {
    layout = "wide";
  } else if (w >= 520 && h >= 280 && ratio > 1.55) {
    layout = "wide";
  } else {
    layout = "compact";
  }

  widget.className = `mission-card layout-${layout}`;
  fitMotto();
}

function fitMotto() {
  if (!els.motto) return;

  const chars = Array.from(els.motto.querySelectorAll("span"));
  if (chars.length < 2) return;

  els.motto.style.setProperty("--motto-gap", "0px");

  const box = els.motto.parentElement?.getBoundingClientRect();
  const targetWidth = Math.max(40, (box?.width ?? els.motto.clientWidth) * 0.92);

  const charsWidth = chars.reduce((sum, char) => {
    return sum + char.getBoundingClientRect().width;
  }, 0);

  const availableGap = targetWidth - charsWidth;
  const gap = availableGap / Math.max(1, chars.length - 1);
  const clamped = Math.max(1.2, Math.min(30, gap));

  els.motto.style.setProperty("--motto-gap", `${clamped}px`);
}

window.addEventListener("resize", applyLayout, { passive: true });

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    applyLayout();
    fitMotto();
  });
}

applyLayout();

function madridParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function madridNumericParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const obj = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(obj.year),
    month: Number(obj.month),
    day: Number(obj.day),
    hour: Number(obj.hour),
    minute: Number(obj.minute),
    second: Number(obj.second),
  };
}

/*
  Temporada automática:
  - empieza el 1 de septiembre
  - termina el 31 de agosto
  - cambia sola: 2025/26 -> 2026/27 -> 2027/28
*/
function getSeason(local) {
  const startYear = local.month >= 9 ? local.year : local.year - 1;
  const endYear = startYear + 1;

  return {
    label: `TEMPORADA ${startYear}/${String(endYear).slice(-2)}`,
    startMs: Date.UTC(startYear, 8, 1, 0, 0, 0),
    endMs: Date.UTC(endYear, 8, 1, 0, 0, 0),
  };
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function setPercent(name, value) {
  const percent = clampPercent(value);

  document.documentElement.style.setProperty(`--${name}`, `${percent}%`);

  const el = els[`${name}Percent`];
  if (el) el.textContent = `${Math.round(percent)}%`;
}

function formatDateText(parts) {
  const weekday = parts.weekday
    .replace(".", "")
    .replace(/^./, (c) => c.toUpperCase());

  const month = parts.month
    .replace(".", "")
    .replace(/^./, (c) => c.toUpperCase());

  return `${weekday} · ${Number(parts.day)} ${month} ${parts.year}`;
}

function madridWallMs(local) {
  return Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second
  );
}

/*
  Orbitador:
  - 1 revolución por minuto
  - segundo 0 => nave arriba
  - avanza a velocidad constante como segundero real
*/
function updateOrbit() {
  if (!orbitMotion) return;

  const now = new Date();
  const secondsInMinute = now.getSeconds() + now.getMilliseconds() / 1000;
  const angle = secondsInMinute * 6;

  orbitMotion.style.transform = `rotate(${angle}deg)`;

  requestAnimationFrame(updateOrbit);
}

function update() {
  const now = new Date();
  const local = madridNumericParts(now);
  const parts = madridParts(now);

  els.hours.textContent = pad2(local.hour);
  els.minutes.textContent = pad2(local.minute);
  els.seconds.textContent = pad2(local.second);
  els.dateText.textContent = formatDateText(parts);

  const secondsElapsed = local.hour * 3600 + local.minute * 60 + local.second;

  setPercent("day", (secondsElapsed / 86400) * 100);

  const weekdayFromMonday =
    (new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay() + 6) % 7;

  setPercent(
    "week",
    ((weekdayFromMonday * 86400 + secondsElapsed) / (7 * 86400)) * 100
  );

  const daysInMonth = new Date(local.year, local.month, 0).getDate();

  setPercent(
    "month",
    (((local.day - 1) * 86400 + secondsElapsed) / (daysInMonth * 86400)) * 100
  );

  const season = getSeason(local);

  els.seasonLabel.textContent = season.label;

  setPercent(
    "season",
    ((madridWallMs(local) - season.startMs) / (season.endMs - season.startMs)) * 100
  );

  fitMotto();
}

update();
updateOrbit();

setTimeout(() => {
  update();
  setInterval(update, 1000);
}, 1000 - new Date().getMilliseconds());
