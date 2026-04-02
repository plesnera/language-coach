const GUEST_SESSION_COUNT_KEY = "language-coach-guest-session-count";
export const GUEST_SESSION_LIMIT = 2;

function readGuestSessionCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const rawValue = window.localStorage.getItem(GUEST_SESSION_COUNT_KEY);
  if (!rawValue) {
    return 0;
  }
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

export function getGuestSessionCount(): number {
  return readGuestSessionCount();
}

export function getGuestSessionsRemaining(): number {
  return Math.max(GUEST_SESSION_LIMIT - readGuestSessionCount(), 0);
}

export function canStartGuestSession(): boolean {
  return getGuestSessionsRemaining() > 0;
}

export function recordGuestSessionStart(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const nextCount = readGuestSessionCount() + 1;
  window.localStorage.setItem(GUEST_SESSION_COUNT_KEY, String(nextCount));
  return nextCount;
}
