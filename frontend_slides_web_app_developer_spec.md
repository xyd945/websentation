# Frontend Slides Web App (Websentation) — Developer Spec

## 1) Goal

Build a **clean, minimal web app** where users can **chat with an AI** to generate **zero-dependency HTML presentations** (single HTML file with inline CSS/JS) and optionally **convert PPT/PPTX → HTML slides**, following the philosophy and constraints in the uploaded skill docs.

Key inspirations / requirements:

- “Frontend Slides” skill behavior and constraints (show-don’t-tell, viewport-fit, distinctive presets, zero-deps output).
- Style presets list + “anti AI-slop” constraints.
- PPT conversion requires extracting text + images, then re-styling into the chosen preset.

**Tech preference:** TypeScript + Next.js. Python allowed if needed.

**Decision:** Use **Next.js Route Handlers** as the *minimal backend* to (1) proxy LLM calls with server-side keys (no user key required) and (2) handle PPTX extraction reliably. This still preserves a “single Next.js app” deployment (e.g., Vercel) without standing up a separate traditional backend service.

---

## 2) Product Requirements

### 2.1 Core User Stories

1. **Prompt → Slides**

- User opens the app (no signup), enters a prompt in chat.
- App guides them through a “skill-like” flow:
  - content discovery (purpose, length, content readiness, images, editing)
  - style selection (guided previews or direct preset selection)
  - generation of a full HTML deck
- User can preview, iterate with chat (“make it more cinematic”, “split slide 4 into two”), then export HTML.

2. **PPT/PPTX → HTML Slides**

- User uploads PPT/PPTX.
- App extracts slides (text, images, notes when available) into a structured intermediate format.
- User chooses a style (previews or preset name).
- LLM generates a new HTML deck preserving slide order and images.
- User previews and exports.

3. **Local Editing + Export**

- Optional in-browser inline editing mode (toggle), autosave in local storage.
- One-click export to:
  - single HTML file (optionally self-contained)
  - or HTML + assets folder as zip.

### 2.2 Non-Functional Requirements

- **Super clean UI**: minimal layout, fast, no clutter.
- **Performance**: preview renders smoothly; large PPTs handled with progress indicators.
- **Reliability**: generation should be deterministic-ish via structured steps.
- **Security**: do not expose provider keys client-side.

---

## 3) Key Constraints from Skill Docs (MUST IMPLEMENT)

### 3.1 Output format

- Output is **HTML-only** presentation:
  - single HTML file, inline CSS/JS
  - no external build system required to run
  - assets referenced by relative paths OR optionally embedded base64

### 3.2 Viewport-fitting is non-negotiable

- Every slide must be **exactly one viewport** (100vh/100dvh).
- **No scrolling inside slides**.
- If content too dense → split into multiple slides.
- Enforce density limits:
  - content slide: 4–6 bullets max
  - feature grid: max 6 cards
  - code: 8–10 lines

### 3.3 Style presets and “anti AI-slop”

- Provide curated presets as first-class choices.
- Avoid generic fonts and generic purple-on-white gradients.

---

## 4) UX / UI Spec

### 4.1 Layout

- Single-page layout with 2 panels:
  - **Left**: chat + minimal workflow cards
  - **Right**: live preview iframe of the current HTML deck
- Mobile: collapsible preview panel.

### 4.2 Primary Screens

1. **Home / Create**

- Minimal header: app name + “Export” button + preset picker icon.
- Main area: chat + preview.

2. **Upload PPT modal**

- Drag/drop zone.
- Shows extraction progress, slide count, asset count.

3. **Style chooser**

- Option A: guided discovery → generate 3 preview thumbnails.
- Option B: direct preset list.

4. **Export modal**

- Export options:
  - HTML only
  - HTML + assets zip
  - Fully self-contained HTML (base64) (advanced toggle)

### 4.3 Chat Experience (“Skill Runner”)

- Chat is not freeform only; it’s a **guided state machine**:
  - The system asks specific form-like questions when needed (purpose/length/etc.).
  - Use quick-reply buttons.
- User can always override (“skip, just do 10 slides”).

### 4.4 Preview

- Render deck inside sandboxed iframe.
- Provide minimal controls:
  - open in new tab
  - refresh
  - copy HTML
  - show slide outline (toggle)

---

## 5) Architecture

### 5.1 Overview

We need a **skill-orchestration layer** that mimics Claude Skills, but using **OpenAI-compatible LLMs** (OpenAI / DeepSeek / Kimi / etc.).

Because the requirement is **“users don’t need to register their LLM tools / bring API keys”**, we must keep provider secrets **off the client**. The cleanest implementation is a **minimal backend** implemented as **Next.js Route Handlers** (serverless/edge) within the same repo.

**Core server routes (MVP):**

- `POST /api/llm` — provider-agnostic LLM proxy (keys stored in env vars)
- `POST /api/pptx/extract` — PPTX extraction (text + images → structured JSON)

This is still “low-backend”: no database, no auth required for MVP.

### 5.2 Route Handlers vs “No Backend”

- **Pure frontend is not sufficient** because provider API keys would be exposed to the browser.
- Route Handlers provide:
  - secret management (env vars)
  - rate limiting & abuse controls
  - streaming responses
  - file handling for PPTX extraction

### 5.3 Frontend Modules (Next.js, App Router)

- `ChatPanel`
  - messages, quick replies
  - calls Skill Runner actions
- `SkillRunner`
  - state machine + tool invocation
- `PreviewPanel`
  - iframe sandbox + hot reload
- `AssetStore`
  - manages extracted images in memory/IndexedDB
- `Exporter`
  - HTML + assets zip, base64 embed option

### 5.4 Backend Modules (Route Handlers)

#### 5.4.1 `/api/llm` — LLM Proxy

Responsibilities:

- Accept client payload `{ provider, model, messages, tools, stream }`
- Attach provider credentials from env vars:
  - `OPENAI_API_KEY`
  - `DEEPSEEK_API_KEY`
  - `KIMI_API_KEY`
  - (and optional `*_BASE_URL`)
- Forward request to selected provider (OpenAI-compatible schema)
- Stream response back to client (SSE or fetch streaming)
- Enforce:
  - max request size
  - max tokens
  - rate limit per IP

#### 5.4.2 `/api/pptx/extract` — PPTX Extraction

Responsibilities:

- Accept multipart upload (`.pptx` only)
- Extract slide text, notes, and images
- Return `ExtractedDeck` JSON + asset URLs

**Implementation options:**

- **Option A (preferred for Vercel simplicity): Node-only extraction in Route Handler**
  - Unzip pptx → parse relevant XML (`ppt/slides/slide*.xml`, relationships) → extract text runs + image rels → write images to memory
  - Return assets as signed temporary URLs (or stream back as base64 in JSON for MVP)
- **Option B (if Python needed): small external microservice for extraction**
  - Use `python-pptx` to extract content and images
  - Host on Cloud Run/Fly.io
  - Next.js Route Handler forwards uploads and returns normalized JSON

**MVP recommendation:** start with Option A to keep “single deployment” on Vercel.

### 5.5 Storage Strategy

- MVP: no auth, no server persistence.
- Client keeps:
  - current project state in `localStorage` / `IndexedDB`
  - optional “Export project JSON”
- Server stores nothing long-term (except temp file during extraction).

---

## 6) Data Model

### 6.1 Project

```ts
type Project = {
  id: string;
  createdAt: number;
  mode: 'prompt' | 'pptx';
  title?: string;
  preset?: PresetKey;
  preferences: {
    purpose?: 'pitch' | 'teaching' | 'talk' | 'internal';
    length?: 'short' | 'medium' | 'long';
    contentReadiness?: 'ready' | 'notes' | 'topic';
    inlineEditing?: boolean;
  };
  pptx?: {
    filename: string;
    extracted: ExtractedDeck;
  };
  outline?: SlideOutlineItem[];
  html?: string;              // current generated deck
  assets?: AssetRef[];        // images used by deck
  history: GenerationEvent[]; // for undo/compare
};
```

### 6.2 Extracted PPTX format

```ts
type ExtractedDeck = {
  slides: Array<{
    index: number;
    title?: string;
    blocks: Array<{ type: 'text'; text: string } | { type: 'image'; assetId: string; width?: number; height?: number }>;
    notes?: string;
  }>;
  assets: Array<{ assetId: string; filename: string; mime: string; size: number; url: string }>;
};
```

### 6.3 Presets

- Parse from STYLE\_PRESETS.md and maintain a structured JSON in repo:

```ts
type Preset = {
  key: string;
  name: string;
  vibe: string;
  fonts: { display: string; body: string; source: 'google' | 'fontshare' };
  colors: Record<string,string>;
  signature: string[];
  constraints: { allowIllustrations: false };
};
```

---

## 7) LLM Orchestration (“Skill Runner”)

### 7.1 Concept

Implement a deterministic pipeline with phases similar to the skill docs:

- Detect mode
- Content discovery
- Style discovery
- Generate deck
- Validate viewport fit
- Iterate

### 7.2 Tool-like Functions exposed to the LLM

The Skill Runner should provide the model a **toolbox** (function calling) so it can:

- `setProjectPreferences()`
- `setOutline()`
- `selectPreset()`
- `generatePreviewVariants(3)`
- `generateDeckHtml()`
- `requestSlideSplit(slideIndex, reason)`
- `applyPatchToHtml(patch)`
- `validateDeck()`

### 7.3 Prompting Strategy

Use a **system prompt** that includes:

- Mandatory viewport CSS block
- Density limits
- Preset list
- “DO NOT USE” generic patterns
- Output contract: return HTML only (or patches)
- Use `calc(-1 * clamp(...))` rule

Use a separate **developer prompt** per task:

- “Generate 3 preview title slides for presets A/B/C”
- “Generate full deck based on outline and preset, ensure fit”
- “Convert extracted PPTX to HTML deck, preserve assets”

### 7.4 Structured outputs

- Previews: `{ htmlA, htmlB, htmlC, descriptions }`
- Full deck: `{ html, assetsUsed, outline, warnings }`
- Patches: JSON Patch-like operations or “replace section” blocks.

### 7.5 Validation Loop (must exist)

After generation:

1. Run **static checks**:

- `.slide` includes `height: 100vh; height: 100dvh; overflow: hidden;`
- font sizes use `clamp()` (basic regex check)
- images have `max-height` constraint

2. Run **runtime fit probe** (client-side):

- Load deck in iframe
- For each slide, measure `scrollHeight` vs `clientHeight` and flag overflow.

3. If any overflow:

- Automatically ask LLM to split/shorten content for those slide(s).

---

## 8) PPTX → HTML Conversion

### 8.1 MVP Approach (Node-only extraction via Route Handler)

**Decision (MVP):** Implement PPTX extraction **in Node.js** inside the Next.js Route Handler `POST /api/pptx/extract`.

**Goal of extraction:** capture **content + assets** (text, notes when possible, images) for **LLM re-layout** into the chosen HTML preset. We are **not** attempting pixel-perfect PPT rendering.

**Steps:**

1. **Upload**

- Client uploads `.pptx` (multipart) to `/api/pptx/extract`.
- Enforce limits: file type `.pptx`, max size (e.g. 25–50 MB for MVP).

2. **Unzip & Parse (server-side, Node)**

- Unzip PPTX (ZIP) in memory.
- Enumerate slides: `ppt/slides/slide*.xml`.
- For each slide:
  - Extract text runs: read XML nodes for text (`a:t`) and join into paragraphs/blocks.
  - Extract speaker notes (best effort): parse `ppt/notesSlides/notesSlide*.xml` when present.
  - Extract images:
    - Parse relationships: `ppt/slides/_rels/slideN.xml.rels`.
    - Resolve `rId` → target in `/ppt/media/*`.
    - Copy binary image data + infer mime.

3. **Normalize to ExtractedDeck**

- Build `ExtractedDeck`:
  - `slides[]` with ordered `blocks[]`:
    - `{ type: 'text', text }`
    - `{ type: 'image', assetId }`
  - `assets[]` containing extracted images.

4. **Return assets to client (MVP choice)** Choose one for MVP:

- **A) Base64 in JSON (simplest):** return `assets[]` with `dataUrl` (`data:image/png;base64,...`).
- **B) Zip-like response:** return JSON + a single binary bundle. (More complex; defer.)

**Recommendation (MVP):** use **A) base64 data URLs** to avoid storage and URL hosting complexity. Later optimize to blob storage / presigned URLs if needed.

5. **LLM re-layout**

- Client sends `ExtractedDeck` + selected preset to `/api/llm`.
- LLM generates a fresh HTML deck:
  - preserves slide order and meaning
  - reuses images from `assets[]`
  - applies viewport-fit rules and preset styling

### 8.2 Quality Expectations (explicit)

- **Reliable:** extraction of embedded images from `/ppt/media/*` and plain text from text boxes/placeholders.
- **Best-effort:** tables, charts, SmartArt, grouped objects; these may be simplified to text summaries or omitted.
- If complex elements are detected (e.g., chart/SmartArt XML namespaces), return `warnings[]` so UI can inform the user.

### 8.3 Future Enhancements

- Better block ordering (reading order heuristics).
- Table extraction into structured blocks.
- Optional geometry hints (EMU→px) to help layout.
- Fallback “high-fidelity render” path (out of MVP scope).

### 8.4 Asset handling

- For preview: use returned base64 data URLs directly.
- For export:
  - Default: write extracted images into `assets/` and reference `assets/...`.
  - Optional: embed as base64 for single-file export.

## 9) Export

### 9.1 Export targets

- **HTML only** (no images) – for text-only decks.
- **HTML + assets zip** – default when images exist.
- **Single self-contained HTML** – optional; embed images as base64 data URIs.

### 9.2 Implementation

- Use `JSZip` on client to zip.
- Ensure relative references (e.g., `assets/slide1_img1.png`).

---

## 10) Provider Support

### 10.1 Provider abstraction

Support “OpenAI-compatible” by default:

- OpenAI
- DeepSeek
- Kimi

Implementation:

- `ProviderAdapter` interface:

```ts
type LLMRequest = { model: string; messages: any[]; tools?: any[]; stream?: boolean };
interface ProviderAdapter {
  id: string;
  displayName: string;
  baseUrl: string;
  headers(): Record<string,string>;
  call(req: LLMRequest): Promise<Response>;
}
```

### 10.2 Model selection UI

- Minimal dropdown in header.
- Defaults to a sensible model.

### 10.3 Rate limiting

- Simple IP-based limiter (serverless friendly).

---

## 11) Security & Privacy

- Do not ship provider keys to browser.
- `/api/llm` must:
  - validate payload size
  - enforce max tokens / max message length
  - strip dangerous headers
  - optionally add abuse protection
- PPTX extraction:
  - virus scan is optional for MVP; at least restrict file size and extension.
  - delete temp files after request.

---

## 12) Project Structure (suggested)

```
/app
  /page.tsx
  /api
    /llm/route.ts
    /pptx
      /extract/route.ts
/components
  ChatPanel.tsx
  PreviewPanel.tsx
  StyleChooser.tsx
  ExportModal.tsx
  UploadPptModal.tsx
/lib
  skillRunner/
    stateMachine.ts
    prompts.ts
    validators.ts
  providers/
    openai.ts
    deepseek.ts
    kimi.ts
  pptx/
    types.ts
  export/
    zip.ts
    embed.ts
/public
  presets.json
```

---

## 13) MVP Scope vs Next

### MVP (ship first)

- Prompt → deck
- Preset picker + guided 3 previews
- Preview iframe
- Export (HTML, zip)
- PPTX extraction via Node-only Route Handler (serverless)
- LLM proxy via serverless

### Next

- Project gallery (local)
- Version compare diff
- “Regenerate slide X only”
- Collaboration/auth
- Template marketplace

---

## 14) Acceptance Criteria

1. From a prompt, user can generate a deck that:

- uses viewport fitting base CSS
- has navigation (keyboard + dots)
- looks like a curated preset (distinctive)

2. PPTX upload produces a deck that:

- preserves slide order
- includes extracted images
- is re-styled into a chosen preset

3. No user API key is required.

4. Validation loop detects and fixes slide overflow in common cases.

---

## 15) Appendix: Mandatory CSS + Rules

- Include the exact viewport-fitting CSS block from the skill docs as a baseline in every generated deck.
- Enforce clamp() typography and spacing.
- No scrolling inside slides.
- Use `calc(-1 * clamp(...))` for negation.

