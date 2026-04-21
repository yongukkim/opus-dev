export type AppLinks = {
  ios?: string;
  android?: string;
};

function normalizeUrl(raw: string | undefined): string | undefined {
  const t = (raw ?? "").trim();
  if (!t) return undefined;
  try {
    const u = new URL(t);
    return u.toString();
  } catch {
    return undefined;
  }
}

export function getOpusAppLinksFromEnv(): AppLinks {
  return {
    ios: normalizeUrl(process.env["OPUS_IOS_APP_URL"]),
    android: normalizeUrl(process.env["OPUS_ANDROID_APP_URL"]),
  };
}

