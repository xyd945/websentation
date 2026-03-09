# Websentation 🎨

> AI-powered HTML presentation generator with a focus on stunning visuals and zero dependencies.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Generation** — Create beautiful presentations from natural language descriptions
- **PPTX Conversion** — Import and convert existing PowerPoint files to web presentations
- **Visual Style Discovery** — "Show, don't tell" approach with AI-generated style previews
- **Zero Dependencies** — Output is pure HTML/CSS/JS with no external dependencies

### 🎨 Design & Styling
- **10+ Curated Visual Styles** — From Neon Cyber to Swiss Modern
- **Dark & Light Themes** — Premium dark modes and clean light themes
- **Anti-AI-Slop** — Distinctive styles that avoid generic AI aesthetics
- **Production-Quality** — Accessible, responsive, well-commented code

### 💻 User Experience
- **Resizable Chat Panel** — Drag to adjust chat width (280px - 600px)
- **Toggle Chat Visibility** — Show/hide chat to maximize preview space
- **Real-time Preview** — See changes as you chat with AI
- **Export Options** — Copy HTML, open in new tab, or refresh preview

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys for LLM providers (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/xyd945/websentation.git
cd websentation

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file with the following optional variables:

```env
# LLM Provider API Keys (at least one required for AI features)
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key
KIMI_API_KEY=your_kimi_key

# Optional: Custom API endpoints
OPENAI_BASE_URL=https://api.openai.com/v1
```

## 📖 Usage Guide

### Creating a New Presentation

1. **Start a conversation** — Describe your presentation topic and audience
2. **Choose your style** — The AI will generate 3 visual style previews for you to compare
3. **Iterate and refine** — Ask for changes, new slides, or style adjustments
4. **Export your presentation** — Copy the HTML or open in a new tab to save

### Converting PowerPoint Files

1. **Upload your .pptx file** — Click "📄 Upload PPTX" in the chat panel
2. **Review extracted content** — The AI will show you the extracted slides and content
3. **Choose a visual style** — Pick from the generated style previews
4. **Get your web presentation** — The AI converts your PPT to beautiful HTML

### Available AI Models

The app supports any LLM provider that uses the **OpenAI standard API format**. Configure your preferred models in the `.env` file:

#### Configuration

Add your API keys to `.env`:

```env
# OpenAI-compatible providers
OPENAI_API_KEY=your_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# Or other OpenAI-standard providers
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

KIMI_API_KEY=your_key_here
KIMI_BASE_URL=https://api.moonshot.cn/v1
```

#### Supported Providers

Any provider with OpenAI-compatible API:

| Provider | Example Models | Base URL |
|----------|----------------|----------|
| **OpenAI** | GPT-4o, GPT-4o Mini | `https://api.openai.com/v1` |
| **DeepSeek** | DeepSeek Chat | `https://api.deepseek.com/v1` |
| **Kimi** | Moonshot-v1-128k | `https://api.moonshot.cn/v1` |
| **Azure OpenAI** | GPT-4, GPT-3.5 | `https://{resource}.openai.azure.com/openai/deployments/{deployment}` |
| **Local/Custom** | Any | Your custom endpoint |

Select your configured model from the dropdown in the header.

## 🎨 Visual Styles Reference

### Dark Themes

| Style | Description | Best For |
|-------|-------------|----------|
| **Neon Cyber** | Futuristic, techy, particle effects | Tech startups, AI products |
| **Midnight Executive** | Premium, corporate, trustworthy | B2B sales, enterprise |
| **Deep Space** | Cinematic, inspiring, vast | Creative pitches, storytelling |
| **Terminal Green** | Developer-focused, hacker aesthetic | Engineering, dev tools |

### Light Themes

| Style | Description | Best For |
|-------|-------------|----------|
| **Paper & Ink** | Editorial, literary, refined | Publishing, academia |
| **Swiss Modern** | Clean, Bauhaus-inspired, geometric | Design agencies, portfolios |
| **Soft Pastel** | Friendly, playful, creative | Consumer apps, lifestyle |
| **Warm Editorial** | Magazine-style, photographic | Fashion, luxury, food |

### Specialty

| Style | Description | Best For |
|-------|-------------|----------|
| **Brutalist** | Raw, bold, attention-grabbing | Activism, counter-culture |
| **Gradient Wave** | Modern SaaS aesthetic | B2B SaaS, productivity tools |

## 🛠️ Development

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: CSS Modules + CSS Variables
- **PPTX Parsing**: [JSZip](https://stuk.github.io/jszip/) + [fflate](https://101arrowz.github.io/fflate/)

### Project Structure

```
websentation/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── llm/route.ts    # LLM API proxy
│   │   │   └── pptx/extract/route.ts  # PPTX parsing
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main app page
│   ├── components/             # React components
│   │   ├── ChatPanel.tsx       # Chat interface
│   │   ├── PreviewPanel.tsx    # HTML preview
│   │   ├── ExportModal.tsx     # Export options
│   │   └── UploadPptModal.tsx  # PPTX upload
│   └── lib/                    # Utilities
│       ├── types.ts            # TypeScript types
│       ├── presets.ts          # Style presets
│       └── skillRunner/        # State machine
│           ├── stateMachine.ts
│           ├── prompts.ts
│           └── validators.ts
├── SKILL.md                    # Claude Code skill
├── STYLE_PRESETS.md           # Visual style reference
├── instruction.md             # Original instructions
└── README.md                  # This file
```

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Adding New Features

1. **New Visual Styles**: Add to `STYLE_PRESETS.md` and `src/lib/presets.ts`
2. **New LLM Providers**: Add to `MODELS` array in `src/app/page.tsx`
3. **New Export Formats**: Extend `ExportModal.tsx` and API routes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- Inspired by [Reveal.js](https://revealjs.com/) and [Spectacle](https://formidable.com/open-source/spectacle/)
- Style presets influenced by [Open Props](https://open-props.style/) and [Radix UI](https://www.radix-ui.com/)

---

<p align="center">
  Made with ❤️ by the Websentation Team
</p>
