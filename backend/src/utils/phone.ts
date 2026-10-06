export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;

  // An explicit + already identifies an international number. This keeps
  // previously stored +1 leads compatible while Brazil is the default.
  if (trimmed.startsWith("+")) return digits;

  // Brazilian numbers may be entered with or without the country code. Store
  // them in E.164 digits so DNC, calling, and WhatsApp share one identity.
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}
