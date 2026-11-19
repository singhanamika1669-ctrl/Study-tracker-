/**
 * Safe browser environment & optional API key utilities.
 * Ensures the app boots cleanly on Vercel or offline static hosts
 * even when optional AI or server API keys are not configured.
 */

export function getOptionalEnv(key: string): string | undefined {
  try {
    const metaEnv = (import.meta as unknown as {env?: Record<string, string | undefined>}).env;
    if (metaEnv && typeof metaEnv[key] === 'string' && metaEnv[key]!.trim().length > 0) {
      return metaEnv[key]!.trim();
    }
  } catch {
    // Ignore read errors
  }

  try {
    const proc = (globalThis as unknown as {process?: {env?: Record<string, string | undefined>}})
      .process;
    const val = proc?.env?.[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  } catch {
    // Ignore read errors
  }

  return undefined;
}

export function getGeminiApiKey(): string | null {
  return (
    getOptionalEnv('VITE_GEMINI_API_KEY') ||
    getOptionalEnv('GEMINI_API_KEY') ||
    null
  );
}

export function isAiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getAppBaseUrl(fallbackUrl: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return fallbackUrl;
}
