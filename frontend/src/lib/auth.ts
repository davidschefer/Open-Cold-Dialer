import { ApiError, api, getAuthToken, setAuthToken, type RestAuthUser } from "@/lib/apiClient";

export type AuthUser = RestAuthUser;

export async function signUp(email: string, password: string, fullName: string) {
  const { user, token } = await api.auth.signup(email, password, fullName);
  setAuthToken(token);
  return user;
}

export async function signIn(email: string, password: string) {
  const { user, token } = await api.auth.login(email, password);
  setAuthToken(token);
  return user;
}

export function signOut() {
  setAuthToken(null);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!getAuthToken()) {
    return null;
  }

  try {
    return await api.auth.me();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      setAuthToken(null);
      return null;
    }
    throw error;
  }
}
