const STORAGE_KEY = 'voicechat_usage';

interface UsageData {
  date: string; // YYYY-MM-DD
  minutesUsed: number;
  totalMinutesAllTime: number;
  monthlyMinutes: Record<string, number>; // YYYY-MM -> minutes
  isPremium: boolean;
}

const TODAY = () => new Date().toISOString().slice(0, 10);
const MONTH = () => new Date().toISOString().slice(0, 7);

function load(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as UsageData;
      // Reset daily if date changed
      if (data.date !== TODAY()) {
        data.date = TODAY();
        data.minutesUsed = 0;
        save(data);
      }
      return data;
    }
  } catch {}
  return { date: TODAY(), minutesUsed: 0, totalMinutesAllTime: 0, monthlyMinutes: {}, isPremium: false };
}

function save(data: UsageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addMinutes(minutes: number): void {
  const data = load();
  data.minutesUsed += minutes;
  data.totalMinutesAllTime += minutes;
  const month = MONTH();
  data.monthlyMinutes[month] = (data.monthlyMinutes[month] || 0) + minutes;
  save(data);
}

export function getTodayUsage(): number {
  return load().minutesUsed;
}

export function getMonthUsage(): number {
  const data = load();
  return data.monthlyMinutes[MONTH()] || 0;
}

export function getTotalUsage(): number {
  return load().totalMinutesAllTime;
}

export function getDailyLimit(): number {
  return 5; // minutes
}

export function isLimitReached(): boolean {
  const data = load();
  if (data.isPremium) return false;
  return data.minutesUsed >= getDailyLimit();
}

export function isPremium(): boolean {
  return load().isPremium;
}

export function setPremium(value: boolean): void {
  const data = load();
  data.isPremium = value;
  save(data);
}

export function formatMinutes(totalMinutes: number): string {
  const m = Math.floor(totalMinutes);
  const s = Math.round((totalMinutes - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
