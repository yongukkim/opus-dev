export const OPUS_OPERATOR_SESSION_COOKIE = "opus_operator_session";

export function hasOperatorSessionFromCookies(cookieStore: {
  get(name: string): { value: string } | undefined;
}): boolean {
  return Boolean(cookieStore.get(OPUS_OPERATOR_SESSION_COOKIE)?.value);
}

