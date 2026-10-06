export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  if (trimmed.startsWith("+")) return digits;
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function splitPhoneForInput(value: string | null | undefined) {
  const normalized = normalizePhone(value);
  if (!normalized) return { country: "+55", number: value ?? "" };
  if (normalized.startsWith("55") && (normalized.length === 12 || normalized.length === 13)) {
    return { country: "+55", number: formatBrazilianPhone(normalized.slice(2)) };
  }
  if (normalized.startsWith("1") && normalized.length === 11) {
    return { country: "+1", number: normalized.slice(1) };
  }
  return { country: "+55", number: normalized };
}

export function formatBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}

export function formatPhoneForStorage(country: string, value: string): string {
  const localDigits = value.replace(/\D/g, "");
  const countryDigits = country.replace(/\D/g, "");
  const combined = countryDigits === "55" && localDigits.startsWith("55")
    ? localDigits
    : `${countryDigits}${localDigits}`;
  if (countryDigits !== "55") return `+${combined}`;
  return normalizePhone(combined) ?? value.trim();
}

export function whatsappUrl(phone: string, firstName: string | null | undefined): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const name = firstName?.trim() || "";
  const message = `Olá${name ? `, ${name}` : ""}! Aqui é o David. Conforme conversamos por telefone, estou entrando em contato pelo WhatsApp para dar continuidade e enviar as informações sobre o ProntoGest.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(email: string, firstName: string | null | undefined): string {
  const name = firstName?.trim() || "";
  const body = `Olá${name ? `, ${name}` : ""}!\n\nConforme nosso contato, seguem as informações sobre o ProntoGest.`;
  return `mailto:${email}?subject=${encodeURIComponent("ProntoGest - conforme nosso contato")}&body=${encodeURIComponent(body)}`;
}
