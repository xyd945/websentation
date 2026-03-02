/* ===========================================
   STYLE PRESETS CATALOG
   12 curated visual styles — no generic AI slop
   Each preset matches STYLE_PRESETS.md verbatim
   =========================================== */

import { Preset, PresetKey } from './types';

export const PRESETS: Preset[] = [
    // ─── Dark Themes ───────────────────────────
    {
        key: 'bold-signal',
        name: 'Bold Signal',
        vibe: 'Confident, bold, modern, high-impact',
        bestFor: 'Pitch decks, keynotes',
        category: 'dark',
        fonts: {
            display: 'Archivo Black',
            body: 'Space Grotesk',
            source: 'google',
            weights: '400;500;900',
        },
        colors: {
            '--bg-primary': '#1a1a1a',
            '--bg-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            '--card-bg': '#FF5722',
            '--text-primary': '#ffffff',
            '--text-on-card': '#1a1a1a',
        },
        signature: [
            'Bold colored card as focal point',
            'Large section numbers (01, 02)',
            'Navigation breadcrumbs',
            'Grid-based layout',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500&display=swap',
    },
    {
        key: 'electric-studio',
        name: 'Electric Studio',
        vibe: 'Bold, clean, professional, high contrast',
        bestFor: 'Agency presentations',
        category: 'dark',
        fonts: {
            display: 'Manrope',
            body: 'Manrope',
            source: 'google',
            weights: '400;500;800',
        },
        colors: {
            '--bg-dark': '#0a0a0a',
            '--bg-white': '#ffffff',
            '--accent-blue': '#4361ee',
            '--text-dark': '#0a0a0a',
            '--text-light': '#ffffff',
        },
        signature: [
            'Two-panel vertical split',
            'Accent bar on panel edge',
            'Quote typography as hero',
            'Minimal confident spacing',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;800&display=swap',
    },
    {
        key: 'creative-voltage',
        name: 'Creative Voltage',
        vibe: 'Bold, creative, energetic, retro-modern',
        bestFor: 'Creative pitches',
        category: 'dark',
        fonts: {
            display: 'Syne',
            body: 'Space Mono',
            source: 'google',
            weights: '400;700;800',
        },
        colors: {
            '--bg-primary': '#0066ff',
            '--bg-dark': '#1a1a2e',
            '--accent-neon': '#d4ff00',
            '--text-light': '#ffffff',
        },
        signature: [
            'Electric blue + neon yellow contrast',
            'Halftone texture patterns',
            'Neon badges/callouts',
            'Script typography for creative flair',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap',
    },
    {
        key: 'dark-botanical',
        name: 'Dark Botanical',
        vibe: 'Elegant, sophisticated, artistic, premium',
        bestFor: 'Premium brands',
        category: 'dark',
        fonts: {
            display: 'Cormorant',
            body: 'IBM Plex Sans',
            source: 'google',
            weights: '300;400;600',
        },
        colors: {
            '--bg-primary': '#0f0f0f',
            '--text-primary': '#e8e4df',
            '--text-secondary': '#9a9590',
            '--accent-warm': '#d4a574',
            '--accent-pink': '#e8b4b8',
            '--accent-gold': '#c9b896',
        },
        signature: [
            'Abstract soft gradient circles',
            'Warm color accents (pink, gold, terracotta)',
            'Thin vertical accent lines',
            'Italic signature typography',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:wght@300;400&display=swap',
    },

    // ─── Light Themes ──────────────────────────
    {
        key: 'notebook-tabs',
        name: 'Notebook Tabs',
        vibe: 'Editorial, organized, elegant, tactile',
        bestFor: 'Reports, reviews',
        category: 'light',
        fonts: {
            display: 'Bodoni Moda',
            body: 'DM Sans',
            source: 'google',
            weights: '400;500;700',
        },
        colors: {
            '--bg-outer': '#2d2d2d',
            '--bg-page': '#f8f6f1',
            '--text-primary': '#1a1a1a',
            '--tab-1': '#98d4bb',
            '--tab-2': '#c7b8ea',
            '--tab-3': '#f4b8c5',
            '--tab-4': '#a8d8ea',
            '--tab-5': '#ffe6a7',
        },
        signature: [
            'Paper container with subtle shadow',
            'Colorful section tabs on right edge',
            'Binder hole decorations on left',
            'Tab text scales with viewport',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500&display=swap',
    },
    {
        key: 'pastel-geometry',
        name: 'Pastel Geometry',
        vibe: 'Friendly, organized, modern, approachable',
        bestFor: 'Product overviews',
        category: 'light',
        fonts: {
            display: 'Plus Jakarta Sans',
            body: 'Plus Jakarta Sans',
            source: 'google',
            weights: '400;500;700;800',
        },
        colors: {
            '--bg-primary': '#c8d9e6',
            '--card-bg': '#faf9f7',
            '--pill-pink': '#f0b4d4',
            '--pill-mint': '#a8d4c4',
            '--pill-sage': '#5a7c6a',
            '--pill-lavender': '#9b8dc4',
            '--pill-violet': '#7c6aad',
        },
        signature: [
            'Rounded card with soft shadow',
            'Vertical pills on right edge',
            'Consistent pill width',
            'Download/action icon in corner',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap',
    },
    {
        key: 'split-pastel',
        name: 'Split Pastel',
        vibe: 'Playful, modern, friendly, creative',
        bestFor: 'Creative agencies',
        category: 'light',
        fonts: {
            display: 'Outfit',
            body: 'Outfit',
            source: 'google',
            weights: '400;500;700;800',
        },
        colors: {
            '--bg-peach': '#f5e6dc',
            '--bg-lavender': '#e4dff0',
            '--text-dark': '#1a1a1a',
            '--badge-mint': '#c8f0d8',
            '--badge-yellow': '#f0f0c8',
            '--badge-pink': '#f0d4e0',
        },
        signature: [
            'Split background colors',
            'Playful badge pills with icons',
            'Grid pattern overlay on right panel',
            'Rounded CTA buttons',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap',
    },
    {
        key: 'vintage-editorial',
        name: 'Vintage Editorial',
        vibe: 'Witty, confident, editorial, personality-driven',
        bestFor: 'Personal brands',
        category: 'light',
        fonts: {
            display: 'Fraunces',
            body: 'Work Sans',
            source: 'google',
            weights: '400;500;700;900',
        },
        colors: {
            '--bg-cream': '#f5f3ee',
            '--text-primary': '#1a1a1a',
            '--text-secondary': '#555',
            '--accent-warm': '#e8d4c0',
        },
        signature: [
            'Abstract geometric shapes',
            'Bold bordered CTA boxes',
            'Witty conversational copy style',
            'Only geometric CSS shapes',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,400&family=Work+Sans:wght@400;500&display=swap',
    },

    // ─── Specialty Themes ──────────────────────
    {
        key: 'neon-cyber',
        name: 'Neon Cyber',
        vibe: 'Futuristic, techy, confident',
        bestFor: 'Tech startups',
        category: 'specialty',
        fonts: {
            display: 'Clash Display',
            body: 'Satoshi',
            source: 'fontshare',
            weights: '400;500;700',
        },
        colors: {
            '--bg-primary': '#0a0f1c',
            '--bg-secondary': '#111827',
            '--text-primary': '#ffffff',
            '--text-secondary': '#9ca3af',
            '--accent': '#00ffcc',
            '--accent-glow': 'rgba(0, 255, 204, 0.3)',
            '--accent-magenta': '#ff00aa',
        },
        signature: [
            'Particle backgrounds',
            'Neon glow effects',
            'Grid patterns',
            'Cyan + magenta palette',
        ],
        fontUrl:
            'https://api.fontshare.com/v2/css?f[]=clash-display@400,500,700&f[]=satoshi@400,500,700&display=swap',
    },
    {
        key: 'terminal-green',
        name: 'Terminal Green',
        vibe: 'Developer-focused, hacker aesthetic',
        bestFor: 'Dev tools, APIs',
        category: 'specialty',
        fonts: {
            display: 'JetBrains Mono',
            body: 'JetBrains Mono',
            source: 'jetbrains',
            weights: '400;700',
        },
        colors: {
            '--bg-primary': '#0d1117',
            '--text-primary': '#c9d1d9',
            '--accent-green': '#39d353',
            '--accent-dim': '#238636',
        },
        signature: [
            'Scan lines effect',
            'Blinking cursor',
            'Code syntax styling',
            'Monospace-only typography',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
    },
    {
        key: 'swiss-modern',
        name: 'Swiss Modern',
        vibe: 'Clean, precise, Bauhaus-inspired',
        bestFor: 'Corporate, data',
        category: 'specialty',
        fonts: {
            display: 'Archivo',
            body: 'Nunito',
            source: 'google',
            weights: '400;800',
        },
        colors: {
            '--bg-primary': '#ffffff',
            '--text-primary': '#000000',
            '--accent-red': '#ff3300',
        },
        signature: [
            'Visible grid',
            'Asymmetric layouts',
            'Geometric shapes',
            'Red accent only',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=Nunito:wght@400&display=swap',
    },
    {
        key: 'paper-ink',
        name: 'Paper & Ink',
        vibe: 'Editorial, literary, thoughtful',
        bestFor: 'Storytelling',
        category: 'specialty',
        fonts: {
            display: 'Cormorant Garamond',
            body: 'Source Serif 4',
            source: 'google',
            weights: '400;600;700',
        },
        colors: {
            '--bg-primary': '#faf9f7',
            '--text-primary': '#1a1a1a',
            '--accent-crimson': '#c41e3a',
        },
        signature: [
            'Drop caps',
            'Pull quotes',
            'Elegant horizontal rules',
            'Serif elegance',
        ],
        fontUrl:
            'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Source+Serif+4:wght@400;600&display=swap',
    },
];

export const PRESET_MAP = Object.fromEntries(
    PRESETS.map((p) => [p.key, p])
) as Record<string, Preset>;

// Mood → preset suggestions (for guided discovery)
export const MOOD_PRESETS: Record<string, PresetKey[]> = {
    'impressed': ['bold-signal', 'electric-studio', 'dark-botanical'],
    'excited': ['creative-voltage', 'neon-cyber', 'split-pastel'],
    'calm': ['notebook-tabs', 'paper-ink', 'swiss-modern'],
    'inspired': ['dark-botanical', 'vintage-editorial', 'pastel-geometry'],
};
