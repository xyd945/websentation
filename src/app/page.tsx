'use client';

/* ===========================================
   MAIN PAGE — WEBSENTATION
   Two-panel layout: chat + preview
   Orchestrates the skill runner state machine
   =========================================== */

import { useState, useCallback } from 'react';
import ChatPanel from '@/components/ChatPanel';
import PreviewPanel from '@/components/PreviewPanel';
import ExportModal from '@/components/ExportModal';
import UploadPptModal from '@/components/UploadPptModal';
import { SkillState, ProviderKey } from '@/lib/types';
import {
  createInitialState,
  processUserInput,
} from '@/lib/skillRunner/stateMachine';

// ─── Available models ────────────────────────
const MODELS = [
  { provider: 'deepseek' as ProviderKey, model: 'deepseek-chat', label: 'DeepSeek Chat' },
  { provider: 'openai' as ProviderKey, model: 'gpt-4o', label: 'GPT-4o' },
  { provider: 'openai' as ProviderKey, model: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { provider: 'kimi' as ProviderKey, model: 'moonshot-v1-128k', label: 'Kimi 128k' },
];

export default function Home() {
  const [state, setState] = useState<SkillState>(createInitialState);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState(0); // Index into MODELS
  const [showExport, setShowExport] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [chatWidth, setChatWidth] = useState(400); // Default chat panel width
  const [isChatVisible, setIsChatVisible] = useState(true); // Chat panel visibility

  // ─── LLM request handler ─────────────────
  const sendLLMRequest = useCallback(
    async (messages: Array<{ role: string; content: string }>): Promise<string> => {
      const modelConfig = MODELS[selectedModel];

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: modelConfig.provider,
          model: modelConfig.model,
          messages,
          stream: false,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'LLM request failed');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    },
    [selectedModel]
  );

  // ─── Show immediate loading feedback ─────
  const showLoading = useCallback((userContent: string) => {
    setState((prev) => ({
      ...prev,
      isStreaming: true,
      messages: [
        ...prev.messages,
        {
          id: `user_${Date.now()}`,
          role: 'user' as const,
          content: userContent,
          timestamp: Date.now(),
        },
        {
          id: `loading_${Date.now()}`,
          role: 'assistant' as const,
          content: '',
          timestamp: Date.now(),
          isLoading: true,
        },
      ],
    }));
  }, []);

  // ─── Send user message ───────────────────
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || state.isStreaming) return;

    const input = inputValue.trim();
    setInputValue('');

    // Show loading immediately
    showLoading(input);

    try {
      const newState = await processUserInput(state, input, sendLLMRequest);
      setState(newState);
    } catch (error) {
      console.error('Error processing input:', error);
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        messages: prev.messages.filter((m) => !m.isLoading),
        error: 'Something went wrong. Please try again.',
      }));
    }
  }, [inputValue, state, sendLLMRequest, showLoading]);

  // ─── Quick reply handler ─────────────────
  const handleQuickReply = useCallback(
    async (value: string) => {
      if (state.isStreaming) return;

      // Handle export actions directly
      if (value === 'export' || value === 'export_html' || value === 'export_zip' || value === 'export_embed') {
        if (state.project.html) {
          setShowExport(true);
        }
        return;
      }

      // Show loading immediately
      showLoading(value);

      try {
        const newState = await processUserInput(state, value, sendLLMRequest);
        setState(newState);
      } catch (error) {
        console.error('Error processing quick reply:', error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          messages: prev.messages.filter((m) => !m.isLoading),
        }));
      }
    },
    [state, sendLLMRequest, showLoading]
  );

  // ─── PPTX extraction callback ────────────
  const handlePptxExtracted = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (data: any) => {
      const slidesSummary = data.slides
        .map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) =>
            `Slide ${s.index}: ${s.title || 'Untitled'} (${s.blocks?.length || 0} blocks)`
        )
        .join('\n');

      const extractedMsg = `Extracted ${data.slides.length} slides from your PPTX:\n\n${slidesSummary}${data.warnings?.length ? '\n\n⚠️ Warnings:\n' + data.warnings.join('\n') : ''}`;

      setState((prev) => ({
        ...prev,
        project: {
          ...prev.project,
          mode: 'pptx',
          pptx: {
            filename: 'uploaded.pptx',
            extracted: data,
          },
        },
      }));

      // Process through state machine
      const newState = await processUserInput(
        {
          ...state,
          phase: 'style_discovery',
          project: {
            ...state.project,
            mode: 'pptx',
            pptx: { filename: 'uploaded.pptx', extracted: data },
          },
        },
        extractedMsg,
        sendLLMRequest
      );
      setState(newState);
    },
    [state, sendLLMRequest]
  );

  return (
    <div className="app">
      {/* ─── Header ─────────────────────────── */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">W</div>
          <span>Websentation</span>
        </div>
        <div className="header-actions">
          <select
            className="model-selector"
            value={selectedModel}
            onChange={(e) => setSelectedModel(Number(e.target.value))}
            title="Select AI model"
          >
            {MODELS.map((m, i) => (
              <option key={i} value={i}>
                {m.label}
              </option>
            ))}
          </select>
          {state.project.html && (
            <button
              className="btn btn-primary"
              onClick={() => setShowExport(true)}
            >
              📥 Export
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Content ───────────────────── */}
      <div className={`main-panels ${!isChatVisible ? 'chat-hidden' : ''}`}>
        {isChatVisible && (
          <ChatPanel
            messages={state.messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            onQuickReply={handleQuickReply}
            isStreaming={state.isStreaming}
            onUploadClick={() => setShowUpload(true)}
            width={chatWidth}
            onWidthChange={setChatWidth}
          />
        )}
        <PreviewPanel
          html={state.project.html}
          isChatVisible={isChatVisible}
          onToggleChat={() => setIsChatVisible(!isChatVisible)}
        />
      </div>

      {/* ─── Modals ─────────────────────────── */}
      {showExport && state.project.html && (
        <ExportModal
          html={state.project.html}
          title={state.project.title}
          onClose={() => setShowExport(false)}
        />
      )}

      {showUpload && (
        <UploadPptModal
          onClose={() => setShowUpload(false)}
          onExtracted={handlePptxExtracted}
        />
      )}
    </div>
  );
}
