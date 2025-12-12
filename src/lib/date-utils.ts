/**
 * Calcule le décalage horaire en minutes entre UTC et un fuseau horaire donné
 */
export function getTimezoneOffsetInMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const utcTs = date.getTime();

  return (localAsUtc - utcTs) / (1000 * 60);
}

