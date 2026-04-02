export const OPUS_DEMO_SESSION_COOKIE = "opus_demo_session";

export function hasDemoSessionFromCookies(cookieStore: {
  get(name: string): { value: string } | undefined;
}): boolean {
  return Boolean(cookieStore.get(OPUS_DEMO_SESSION_COOKIE)?.value);
}

