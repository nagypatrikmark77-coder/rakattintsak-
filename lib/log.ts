// Az egyetlen megengedett naplózás: hibakód és a hiba osztályneve. Tartalom, üzenet, stack SOHA.

export function logError(code: string, err?: unknown) {
  const kind = err instanceof Error ? err.name : typeof err;
  const detail = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : undefined;
  console.error(JSON.stringify({ code, kind, detail }));
}
