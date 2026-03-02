/* ===========================================
   VALIDATORS
   Static and runtime checks for viewport fitting
   =========================================== */

export type ValidationResult = {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
};

export type ValidationError = {
    type: 'overflow' | 'no-viewport-height' | 'no-overflow-hidden' | 'no-clamp' | 'no-image-constraint';
    slideIndex?: number;
    message: string;
};

// ─── Static HTML checks ─────────────────────
export function validateDeckHtml(html: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check for overflow: hidden on .slide
    if (!html.includes('overflow: hidden') && !html.includes('overflow:hidden')) {
        errors.push({
            type: 'no-overflow-hidden',
            message: 'Missing overflow: hidden on .slide class',
        });
    }

    // Check for viewport height
    if (!html.includes('100vh') && !html.includes('100dvh')) {
        errors.push({
            type: 'no-viewport-height',
            message: 'Missing height: 100vh/100dvh on slides',
        });
    }

    // Check for clamp() usage
    if (!html.includes('clamp(')) {
        warnings.push('No clamp() found — font sizes may not be responsive');
    }

    // Check for image constraints
    const imgCount = (html.match(/<img /g) || []).length;
    if (imgCount > 0 && !html.includes('max-height')) {
        errors.push({
            type: 'no-image-constraint',
            message: 'Images found without max-height constraints',
        });
    }

    // Check for forbidden patterns
    if (html.includes('-clamp(') || html.includes('-min(') || html.includes('-max(')) {
        warnings.push(
            'Found negated CSS function (-clamp/-min/-max). Use calc(-1 * ...) instead.'
        );
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ─── Runtime fit probe (runs in iframe) ──────
// This returns a script that can be injected into the iframe
// to check if any slides overflow
export const FIT_PROBE_SCRIPT = `
(function() {
  const slides = document.querySelectorAll('.slide');
  const results = [];
  slides.forEach((slide, i) => {
    const overflow = slide.scrollHeight > slide.clientHeight;
    results.push({
      index: i,
      overflow,
      scrollHeight: slide.scrollHeight,
      clientHeight: slide.clientHeight,
      delta: slide.scrollHeight - slide.clientHeight,
    });
  });
  return results;
})();
`;
