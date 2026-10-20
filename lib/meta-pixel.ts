type MetaParamValue = string | number | boolean;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Dispara evento personalizado do Meta Pixel (fbq trackCustom). */
export function trackMetaCustom(
  eventName: string,
  params?: Record<string, MetaParamValue | undefined | null>
): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

  const clean: Record<string, MetaParamValue> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      clean[key] = value;
    }
  }

  window.fbq('trackCustom', eventName, Object.keys(clean).length ? clean : undefined);
}
