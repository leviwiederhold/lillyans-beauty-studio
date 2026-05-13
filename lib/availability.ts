type Rule = { day_of_week: number; start_time: string; end_time: string };
type Busy = { starts_at: string; ends_at: string };

function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function atMinutes(date: string, minuteOfDay: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setMinutes(minuteOfDay, 0, 0);
  return d;
}

function overlaps(start: Date, end: Date, busy: Busy) {
  const bStart = new Date(busy.starts_at);
  const bEnd = new Date(busy.ends_at);
  return start < bEnd && end > bStart;
}

export function generateSlots({ date, durationMinutes, rules, bookings, blockedTimes }: { date: string; durationMinutes: number; rules: Rule[]; bookings: Busy[]; blockedTimes: Busy[] }) {
  const day = new Date(`${date}T12:00:00`).getDay();
  const activeRules = rules.filter((r) => r.day_of_week === day);
  const busy = [...bookings, ...blockedTimes];
  const slots: string[] = [];

  for (const rule of activeRules) {
    const start = minutes(rule.start_time);
    const end = minutes(rule.end_time);
    for (let cursor = start; cursor + durationMinutes <= end; cursor += 15) {
      const slotStart = atMinutes(date, cursor);
      const slotEnd = atMinutes(date, cursor + durationMinutes);
      if (slotStart <= new Date()) continue;
      if (!busy.some((b) => overlaps(slotStart, slotEnd, b))) {
        slots.push(slotStart.toISOString());
      }
    }
  }

  return slots;
}
