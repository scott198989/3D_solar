// Simulation clock — an orrery that tracks a real Julian Date so the planets
// sit where they actually are on any chosen calendar day. Speed is expressed
// in simulated days per real-time second.

const UNIX_EPOCH_JD = 2440587.5;
const MS_PER_DAY = 86400000;

export function dateToJd(date) {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

export function jdToDate(jd) {
  return new Date((jd - UNIX_EPOCH_JD) * MS_PER_DAY);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatJd(jd) {
  const d = jdToDate(jd);
  const day = d.getUTCDate();
  const mon = MONTHS[d.getUTCMonth()];
  const yr = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return { date: `${day} ${mon} ${yr}`, time: `${hh}:${mm} UTC`, year: yr };
}

export function createClock(initialDate = new Date()) {
  return {
    jd: dateToJd(initialDate),
    daysPerSecond: 6, // default speed
    direction: 1,
    paused: false,

    advance(dtSeconds) {
      if (this.paused) return;
      this.jd += this.daysPerSecond * this.direction * dtSeconds;
    },
    setSpeed(daysPerSecond) {
      this.daysPerSecond = daysPerSecond;
    },
    setDirection(dir) {
      this.direction = dir < 0 ? -1 : 1;
    },
    setPaused(p) {
      this.paused = !!p;
    },
    setDate(date) {
      this.jd = dateToJd(date);
    },
    resetToNow() {
      this.jd = dateToJd(new Date());
    },
    getDate() {
      return jdToDate(this.jd);
    },
    format() {
      return formatJd(this.jd);
    },
  };
}

// Speed presets surfaced in the UI (label → simulated days per real second).
export const SPEED_PRESETS = [
  { label: "1 hr/s", days: 1 / 24 },
  { label: "6 hr/s", days: 0.25 },
  { label: "1 day/s", days: 1 },
  { label: "1 wk/s", days: 7 },
  { label: "1 mo/s", days: 30 },
  { label: "1 yr/s", days: 365 },
  { label: "10 yr/s", days: 3650 },
];
