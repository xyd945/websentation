/* ===========================================
   LLM SYSTEM PROMPT
   Contains mandatory viewport CSS, density rules,
   preset catalog, and anti-slop patterns
   =========================================== */

import { PRESETS } from '../presets';
import { PresetKey, SlideOutlineItem } from '../types';

// ─── Mandatory Viewport CSS (included in every generated deck) ───
export const VIEWPORT_CSS = `/* ===========================================
   VIEWPORT FITTING: MANDATORY BASE STYLES
   =========================================== */
html, body {
    height: 100%;
    overflow-x: hidden;
}
html {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
}
.slide {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    position: relative;
}
.slide-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-height: 100%;
    overflow: hidden;
    padding: var(--slide-padding);
}
:root {
    --title-size: clamp(1.5rem, 5vw, 4rem);
    --h2-size: clamp(1.25rem, 3.5vw, 2.5rem);
    --h3-size: clamp(1rem, 2.5vw, 1.75rem);
    --body-size: clamp(0.75rem, 1.5vw, 1.125rem);
    --small-size: clamp(0.65rem, 1vw, 0.875rem);
    --slide-padding: clamp(1rem, 4vw, 4rem);
    --content-gap: clamp(0.5rem, 2vw, 2rem);
    --element-gap: clamp(0.25rem, 1vw, 1rem);
}
.card, .container, .content-box {
    max-width: min(90vw, 1000px);
    max-height: min(80vh, 700px);
}
.feature-list, .bullet-list { gap: clamp(0.4rem, 1vh, 1rem); }
.feature-list li, .bullet-list li { font-size: var(--body-size); line-height: 1.4; }
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    gap: clamp(0.5rem, 1.5vw, 1rem);
}
img, .image-container {
    max-width: 100%;
    max-height: min(50vh, 400px);
    object-fit: contain;
}
@media (max-height: 700px) {
    :root {
        --slide-padding: clamp(0.75rem, 3vw, 2rem);
        --content-gap: clamp(0.4rem, 1.5vw, 1rem);
        --title-size: clamp(1.25rem, 4.5vw, 2.5rem);
        --h2-size: clamp(1rem, 3vw, 1.75rem);
    }
}
@media (max-height: 600px) {
    :root {
        --slide-padding: clamp(0.5rem, 2.5vw, 1.5rem);
        --content-gap: clamp(0.3rem, 1vw, 0.75rem);
        --title-size: clamp(1.1rem, 4vw, 2rem);
        --body-size: clamp(0.7rem, 1.2vw, 0.95rem);
    }
    .nav-dots, .keyboard-hint, .decorative { display: none; }
}
@media (max-height: 500px) {
    :root {
        --slide-padding: clamp(0.4rem, 2vw, 1rem);
        --title-size: clamp(1rem, 3.5vw, 1.5rem);
        --h2-size: clamp(0.9rem, 2.5vw, 1.25rem);
        --body-size: clamp(0.65rem, 1vw, 0.85rem);
    }
}
@media (max-width: 600px) {
    :root { --title-size: clamp(1.25rem, 7vw, 2.5rem); }
    .grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.2s !important;
    }
    html { scroll-behavior: auto; }
}`;

// ─── Build the presets catalog for the system prompt ───
function buildPresetCatalog(): string {
    return PRESETS.map(
        (p) =>
            `- **${p.name}** (key: \`${p.key}\`): ${p.vibe}. Best for: ${p.bestFor}. Fonts: ${p.fonts.display} + ${p.fonts.body}. Colors: ${Object.entries(p.colors).map(([k, v]) => `${k}: ${v}`).join(', ')}.`
    ).join('\n');
}

// ─── Main System Prompt ──────────────────────
export function getSystemPrompt(): string {
    return `You are an expert HTML presentation generator called "Websentation". You create stunning, zero-dependency HTML presentations with inline CSS and JS.

## CRITICAL RULES (NON-NEGOTIABLE)

### Viewport Fitting
- Every slide MUST fit exactly in one viewport (100vh/100dvh)
- NO scrolling inside slides — ever
- Use overflow: hidden on every .slide
- All typography uses clamp() for responsive scaling
- All spacing uses clamp() or viewport units

### Content Density Limits Per Slide
| Slide Type | Maximum Content |
|------------|----------------|
| Title slide | 1 heading + 1 subtitle + optional tagline |
| Content slide | 1 heading + 4-6 bullet points OR 1 heading + 2 paragraphs |
| Feature grid | 1 heading + 6 cards maximum (2x3 or 3x2) |
| Code slide | 1 heading + 8-10 lines of code |
| Quote slide | 1 quote (max 3 lines) + attribution |
| Image slide | 1 heading + 1 image (max 60vh height) |

If content exceeds these limits → SPLIT into multiple slides.

### CSS Rules
- Use calc(-1 * clamp(...)) for negation — NEVER -clamp()
- All font sizes must use clamp(min, preferred, max)
- Include breakpoints for max-height: 700px, 600px, 500px
- Images: max-height: min(50vh, 400px)

### DO NOT USE (Generic AI Patterns)
- Fonts: Inter, Roboto, Arial, system fonts as display
- Colors: #6366f1 (generic indigo), purple gradients on white
- Layouts: Everything centered, generic hero, identical card grids
- Decorations: Realistic illustrations, gratuitous glassmorphism

## MANDATORY BASE CSS
Every presentation MUST include this CSS block:

\`\`\`css
${VIEWPORT_CSS}
\`\`\`

## AVAILABLE STYLE PRESETS
${buildPresetCatalog()}

## OUTPUT FORMAT
- Single HTML file with inline CSS and JS
- Include font links (Google Fonts or Fontshare)
- Include navigation: keyboard (arrows, space), scroll/swipe, progress bar, nav dots
- Include scroll-triggered animations (.reveal class + IntersectionObserver)
- Include SlidePresentation controller class
- Well-commented code with section headers
- Semantic HTML (section, nav, main)
- ARIA labels and reduced motion support

## RESPONSE FORMAT
When generating a complete deck, return ONLY the HTML content (no markdown code fences, no explanation before or after).
When answering questions or discussing changes, respond in natural language.
When generating a preview slide, return ONLY the HTML for that single slide preview.`;
}

// ─── Task-specific prompts ───────────────────
export function getGenerateDeckPrompt(
    preset: PresetKey,
    outline: SlideOutlineItem[],
    userContent: string,
    preferences: { purpose?: string; length?: string }
): string {
    const p = PRESETS.find((pr) => pr.key === preset);
    return `Generate a complete HTML presentation using the "${p?.name}" style preset.

**Presentation Purpose:** ${preferences.purpose || 'general'}
**Target Length:** ${preferences.length || 'medium'} (${outline.length} slides)

**Style Details:**
- Display Font: ${p?.fonts.display} (load from: ${p?.fontUrl})
- Body Font: ${p?.fonts.body}
- Colors: ${JSON.stringify(p?.colors, null, 2)}
- Signature Elements: ${p?.signature?.join(', ')}

**Slide Outline:**
${outline.map((s) => `Slide ${s.index}: [${s.type}] ${s.title}${s.bullets ? '\n  - ' + s.bullets.join('\n  - ') : ''}`).join('\n')}

**User Content:**
${userContent}

Generate the COMPLETE HTML file. Include all mandatory viewport CSS, responsive breakpoints, animations, navigation (keyboard + dots + progress bar), and the SlidePresentation controller class. Every slide must fit exactly in one viewport.`;
}

export function getPreviewPrompt(presetKey: PresetKey, title: string): string {
    const p = PRESETS.find((pr) => pr.key === presetKey);
    return `Generate a single title slide preview for the "${p?.name}" style.

**Style:** ${p?.vibe}
**Display Font:** ${p?.fonts.display} (load from: ${p?.fontUrl})
**Body Font:** ${p?.fonts.body}
**Colors:** ${JSON.stringify(p?.colors)}
**Signature:** ${p?.signature?.join(', ')}

**Content:** Title: "${title}", Subtitle: "A Websentation Preview"

Generate a complete, self-contained HTML file with just this one slide. Include the mandatory viewport CSS, the preset styling, and a subtle entrance animation. Make it look stunning and distinctive — this is a PREVIEW to help the user choose a style.`;
}

export function getIteratePrompt(currentHtml: string, request: string): string {
    return `The user wants to modify their existing presentation. Here is the current HTML:

\`\`\`html
${currentHtml}
\`\`\`

**User Request:** ${request}

Apply the requested changes. Return the COMPLETE updated HTML file. Maintain all viewport fitting rules, responsive breakpoints, and navigation functionality. Don't break any existing slides.`;
}

export function getPptxConversionPrompt(
    presetKey: PresetKey,
    extractedContent: string
): string {
    const p = PRESETS.find((pr) => pr.key === presetKey);
    return `Convert the following extracted PowerPoint content into an HTML presentation using the "${p?.name}" style.

**Style Details:**
- Display Font: ${p?.fonts.display} (load from: ${p?.fontUrl})
- Body Font: ${p?.fonts.body}
- Colors: ${JSON.stringify(p?.colors)}
- Signature Elements: ${p?.signature?.join(', ')}

**Extracted PPTX Content:**
${extractedContent}

Generate a COMPLETE HTML file that:
1. Preserves ALL slide content and order
2. Applies the chosen preset styling
3. Includes all mandatory viewport CSS and responsive breakpoints
4. References any images using their provided data URLs
5. Includes navigation (keyboard + dots + progress bar)
6. Includes scroll-triggered animations
7. Every slide fits exactly in one viewport — split content if needed`;
}
