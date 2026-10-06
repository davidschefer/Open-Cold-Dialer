// This is a UI convenience only. The backend remains authoritative and rejects
// public registration unless ALLOW_PUBLIC_SIGNUP=true is explicitly configured.
export const publicSignupEnabled = import.meta.env.VITE_ALLOW_PUBLIC_SIGNUP === "true";
