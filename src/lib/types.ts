/* ===========================================
   CORE TYPE DEFINITIONS
   All data models for the Websentation app
   =========================================== */

// ─── Style Presets ───────────────────────────
export type PresetKey =
  | 'bold-signal'
  | 'electric-studio'
  | 'creative-voltage'
  | 'dark-botanical'
  | 'notebook-tabs'
  | 'pastel-geometry'
  | 'split-pastel'
  | 'vintage-editorial'
  | 'neon-cyber'
  | 'terminal-green'
  | 'swiss-modern'
  | 'paper-ink';

export type Preset = {
  key: PresetKey;
  name: string;
  vibe: string;
  bestFor: string;
  category: 'dark' | 'light' | 'specialty';
  fonts: {
    display: string;
    body: string;
    source: 'google' | 'fontshare' | 'jetbrains';
    weights: string;
  };
  colors: Record<string, string>;
  signature: string[];
  fontUrl: string;
};

// ─── Project ─────────────────────────────────
export type ProjectMode = 'prompt' | 'pptx';
export type Purpose = 'pitch' | 'teaching' | 'talk' | 'internal';
export type DeckLength = 'short' | 'medium' | 'long';
export type ContentReadiness = 'ready' | 'notes' | 'topic';

export type Project = {
  id: string;
  createdAt: number;
  mode: ProjectMode;
  title?: string;
  preset?: PresetKey;
  preferences: {
    purpose?: Purpose;
    length?: DeckLength;
    contentReadiness?: ContentReadiness;
    inlineEditing?: boolean;
  };
  pptx?: {
    filename: string;
    extracted: ExtractedDeck;
  };
  outline?: SlideOutlineItem[];
  html?: string;
  assets?: AssetRef[];
  history: GenerationEvent[];
};

export type SlideOutlineItem = {
  index: number;
  title: string;
  type: 'title' | 'content' | 'feature-grid' | 'code' | 'quote' | 'image' | 'closing';
  bullets?: string[];
  imageAssetId?: string;
};

export type AssetRef = {
  assetId: string;
  filename: string;
  mime: string;
  dataUrl?: string;
  size: number;
};

export type GenerationEvent = {
  timestamp: number;
  type: 'generate' | 'patch' | 'regenerate';
  html: string;
  description?: string;
};

// ─── PPTX Extraction ─────────────────────────
export type ExtractedDeck = {
  slides: ExtractedSlide[];
  assets: ExtractedAsset[];
  warnings?: string[];
};

export type ExtractedSlide = {
  index: number;
  title?: string;
  blocks: ExtractedBlock[];
  notes?: string;
};

export type ExtractedBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; assetId: string; width?: number; height?: number };

export type ExtractedAsset = {
  assetId: string;
  filename: string;
  mime: string;
  size: number;
  dataUrl: string;
};

// ─── LLM Provider ────────────────────────────
export type ProviderKey = 'openai' | 'deepseek' | 'kimi';

export type LLMRequest = {
  provider: ProviderKey;
  model: string;
  messages: LLMMessage[];
  tools?: LLMTool[];
  stream?: boolean;
  max_tokens?: number;
};

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: LLMToolCall[];
};

export type LLMTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type LLMToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

// ─── Chat & Skill Runner ─────────────────────
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  quickReplies?: QuickReply[];
  isLoading?: boolean;
  htmlPreview?: string;
};

export type QuickReply = {
  label: string;
  value: string;
  description?: string;
};

export type SkillPhase =
  | 'idle'
  | 'detect_mode'
  | 'content_discovery'
  | 'style_discovery'
  | 'generating'
  | 'validating'
  | 'iterating'
  | 'complete';

export type SkillState = {
  phase: SkillPhase;
  project: Project;
  messages: ChatMessage[];
  isStreaming: boolean;
  error?: string;
};

// ─── Export ───────────────────────────────────
export type ExportFormat = 'html' | 'zip' | 'self-contained';
