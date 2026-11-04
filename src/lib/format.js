export function formatNaira(value) {
  const n = Number(value || 0);
  return "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export function formatCompactNaira(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(0) + "k";
  return formatNaira(n);
}

export function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name = "") {
  return name
    .replace(/[@_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}