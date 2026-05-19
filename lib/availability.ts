type Rule = { day_of_week: number; start_time: string; end_time: string };
type Busy = { starts_at: string; ends_at: string };

const BUSINESS_TZ = "America/New_York";

function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert a minute-of-day in Eastern time to a UTC Date.
 * Correctly handles EDT/EST transitions by deriving the actual offset
 * for the given date using Intl.DateTimeFormat.
 */
export function easternToUTC(dateStr: string, minuteOfDay: number): Date {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr = `${pad(h)}:${pad(m)}:00`;
  // Treat the time as UTC first, then find what that UTC time looks like in NY
  const asUTC = new Date(`${dateStr}T${timeStr}Z`);
  const nyStr = asUTC.toLocaleString("en-US", {
    timeZone: BUSINESS_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  // nyStr is like "05/18/2026, 09:00:00" (or "05/18/2026, 24:00:00" for midnight edge)
  const [datePart, timePart] = nyStr.split(", ");
  const [mo, dy, yr] = datePart.split("/");
  const fixedTimePart = timePart.replace(/^24/, "00");
  const nyAsUTC = new Date(`${yr}-${mo}-${dy}T${fixedTimePart}Z`);
  // offsetMs is how much UTC is ahead of NY (e.g. 4*60*60*1000 in EDT)
  const offsetMs = asUTC.getTime() - nyAsUTC.getTime();
  // So "minuteOfDay in NY" as UTC = naive UTC time + offset
  return new Date(asUTC.getTime() + offsetMs);
}

/**
 * Returns ISO strings for the Eastern-timezone boundaries of a given date
 * (midnight → 23:59 Eastern), expressed as UTC.
 */
export function easternDayBounds(dateStr: string): { dayStart: string; dayEnd: string } {
  return {
    dayStart: easternToUTC(dateStr, 0).toISOString(),
    dayEnd: easternToUTC(dateStr, 23 * 60 + 59).toISOString(),
  };
}

function overlaps(start: Date, end: Date, busy: Busy) {
  const bStart = new Date(busy.starts_at);
  const bEnd = new Date(busy.ends_at);
  return start < bEnd && end > bStart;
}

export function generateSlots({ date, durationMinutes, rules, bookings, blockedTimes }: { date: string; durationMinutes: number; rules: Rule[]; bookings: Busy[]; blockedTimes: Busy[] }) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const activeRules = rules.filter((r) => r.day_of_week === day);
  const busy = [...bookings, ...blockedTimes];
  const slots: string[] = [];

  for (const rule of activeRules) {
    const start = minutes(rule.start_time);
    const end = minutes(rule.end_time);
    for (let cursor = start; cursor + durationMinutes <= end; cursor += 15) {
      const slotStart = easternToUTC(date, cursor);
      const slotEnd = easternToUTC(date, cursor + durationMinutes);
      if (slotStart <= new Date()) continue;
      if (!busy.some((b) => overlaps(slotStart, slotEnd, b))) {
        slots.push(slotStart.toISOString());
      }
    }
  }

  return slots;
}
