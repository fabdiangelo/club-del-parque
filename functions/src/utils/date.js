export function fmtDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
