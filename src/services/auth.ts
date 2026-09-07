import { useSyncExternalStore } from "react";
import { getDB } from "./db";
import type { Role, User } from "@/types";

const KEY = "globitrans.session";

export interface Session {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatar: string;
  declarantId?: string | undefined;
  loggedAt: string;
}

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let session: Session | null = typeof window === "undefined" ? null : read();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => session;
const serverSnapshot = () => null;

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function login(email: string, password: string, remember: boolean): { ok: boolean; error?: string } {
  const user = getDB().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return { ok: false, error: "Aucun compte ne correspond à cette adresse email." };
  if (user.password !== password) return { ok: false, error: "Mot de passe incorrect." };
  if (!user.active) return { ok: false, error: "Ce compte est désactivé." };
  session = toSession(user);
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
    localStorage.setItem("globitrans.remember", remember ? "1" : "0");
  } catch {
    /* ignore */
  }
  emit();
  return { ok: true };
}

function toSession(user: User): Session {
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    declarantId: user.declarantId,
    loggedAt: new Date().toISOString(),
  };
}

export function logout() {
  session = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export const fullName = (s: Session) => `${s.firstName} ${s.lastName}`;
