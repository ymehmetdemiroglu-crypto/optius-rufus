export function safeJsonParse<T>(str: unknown, fallback: T): T {
  if (str === null || str === undefined) return fallback;
  if (typeof str !== "string") {
    return str as T;
  }
  const trimmed = str.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}
