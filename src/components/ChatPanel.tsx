'use client';

/* ===========================================
   CHAT PANEL
   Messages, quick replies, guided flow
   =========================================== */

import { useRef, useEffect } from 'react';
import { ChatMessage, QuickReply } from '@/lib/types';

interface ChatPanelProps {
    messages: ChatMessage[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onQuickReply: (value: string) => void;
    isStreaming: boolean;
    onUploadClick: () => void;
}

export default function ChatPanel({
    messages,
    inputValue,
    onInputChange,
    onSend,
    onQuickReply,
    isStreaming,
    onUploadClick,
}: ChatPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim() && !isStreaming) onSend();
        }
    };

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onInputChange(e.target.value);
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    };

    // Render markdown-like formatting (bold, italic, newlines)
    const renderContent = (content: string) => {
        const parts = content.split(/(\*\*.*?\*\*|_.*?_|\n)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('_') && part.endsWith('_')) {
                return <em key={i}>{part.slice(1, -1)}</em>;
            }
            if (part === '\n') return <br key={i} />;
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="chat-panel">
            {/* Messages */}
            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.role}`}>
                        <div className={`message-avatar ${msg.role}`}>
                            {msg.role === 'assistant' ? '✦' : '⬤'}
                        </div>
                        <div>
                            <div className="message-bubble">
                                {msg.isLoading ? (
                                    <div className="loading-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                ) : (
                                    renderContent(msg.content)
                                )}
                            </div>

                            {/* Quick Replies */}
                            {msg.quickReplies && msg.quickReplies.length > 0 && (
                                <div className="quick-replies">
                                    {msg.quickReplies.map((qr: QuickReply) => (
                                        <button
                                            key={qr.value}
                                            className="quick-reply-btn"
                                            onClick={() => onQuickReply(qr.value)}
                                            disabled={isStreaming}
                                        >
                                            <span className="quick-reply-label">{qr.label}</span>
                                            {qr.description && (
                                                <span className="quick-reply-desc">{qr.description}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button className="upload-btn" onClick={onUploadClick}>
                        📄 Upload PPTX
                    </button>
                </div>
                <div className="chat-input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Describe your presentation or make changes..."
                        value={inputValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isStreaming}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={onSend}
                        disabled={!inputValue.trim() || isStreaming}
                        title="Send"
                    >
                        ↑
                    </button>
                </div>
            </div>
        </div>
    );
}
