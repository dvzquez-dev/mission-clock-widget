const TIME_ZONE = "Europe/Madrid";
const $ = (selector) => document.querySelector(selector);
const pad2 = (n) => String(n).padStart(2, "0");

const widget = $("#widget");
const els = {
  hours: $("#hours"),
  minutes: $("#minutes"),
  seconds: $("#seconds"),
  utcOffset: $("#utcOffset"),
  dateText: $("#dateText"),
  seasonLabel: $("#seasonLabel"),
  seasonPercent: $("#seasonPercent"),
  monthPercent: $("#monthPercent"),
  weekPercent: $("#weekPercent"),
  dayPercent: $("#dayPercent"),
};

function applyLayout() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  const ratio = w / h;

  let layout = "wide";

  if (w < 320 || h < 150) {
    layout = "micro";
  } else if (h <= 215 && w >= 380) {
    layout = "low";
  } else if (h <= 230 && w < 380) {
    layout = "micro";
  } else if (h <= 235) {
    layout = "low";
  } else if (w < 520) {
    layout = "compact";
  } else if (ratio < 1.15 && h >= 320) {
    layout = "tall";
  } else {
    layout = "wide";
  }

  widget.className = `mission-card layout-${layout}`;
}

window.addEventListener("resize", applyLayout, { passive: true });
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
    timeZoneName: "shortOffset",
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
  const weekday = parts.weekday.replace(".", "").replace(/^./, (c) => c.toUpperCase());
  const month = parts.month.replace(".", "").replace(/^./, (c) => c.toUpperCase());
  return `${weekday} · ${Number(parts.day)} ${month} ${parts.year}`;
}

function madridWallMs(local) {
  return Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
}

function update() {
  const now = new Date();
  const local = madridNumericParts(now);
  const parts = madridParts(now);

  els.hours.textContent = pad2(local.hour);
  els.minutes.textContent = pad2(local.minute);
  els.seconds.textContent = pad2(local.second);
  els.utcOffset.textContent = parts.timeZoneName?.replace("GMT", "UTC") ?? "Europe/Madrid";
  els.dateText.textContent = formatDateText(parts);

  const secondsElapsed = local.hour * 3600 + local.minute * 60 + local.second;
  setPercent("day", (secondsElapsed / 86400) * 100);

  const weekdayFromMonday = (new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay() + 6) % 7;
  setPercent("week", ((weekdayFromMonday * 86400 + secondsElapsed) / (7 * 86400)) * 100);

  const daysInMonth = new Date(local.year, local.month, 0).getDate();
  setPercent("month", (((local.day - 1) * 86400 + secondsElapsed) / (daysInMonth * 86400)) * 100);

  const season = getSeason(local);
  els.seasonLabel.textContent = season.label;
  setPercent("season", ((madridWallMs(local) - season.startMs) / (season.endMs - season.startMs)) * 100);
}

update();
setTimeout(() => {
  update();
  setInterval(update, 1000);
}, 1000 - new Date().getMilliseconds());
