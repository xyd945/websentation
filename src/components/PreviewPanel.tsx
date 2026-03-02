'use client';

/* ===========================================
   PREVIEW PANEL
   Sandboxed iframe for rendering HTML decks
   with controls: open in tab, refresh, copy
   =========================================== */

import { useRef, useCallback, useEffect, useState } from 'react';

interface PreviewPanelProps {
    html: string | undefined;
    onRefresh?: () => void;
}

export default function PreviewPanel({ html, onRefresh }: PreviewPanelProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [copied, setCopied] = useState(false);

    // Write HTML to iframe
    const updateIframe = useCallback(() => {
        if (iframeRef.current && html) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.close();
            }
        }
    }, [html]);

    useEffect(() => {
        updateIframe();
    }, [updateIframe]);

    // Open in new tab
    const handleOpenNewTab = () => {
        if (!html) return;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    // Copy HTML
    const handleCopy = async () => {
        if (!html) return;
        try {
            await navigator.clipboard.writeText(html);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = html;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Refresh iframe
    const handleRefresh = () => {
        updateIframe();
        onRefresh?.();
    };

    if (!html) {
        return (
            <div className="preview-panel">
                <div className="preview-toolbar">
                    <span className="preview-label">Preview</span>
                </div>
                <div className="preview-empty">
                    <div className="preview-empty-icon">🎨</div>
                    <h3>No presentation yet</h3>
                    <p>
                        Start a conversation to generate your presentation. It will appear
                        here in real-time.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="preview-panel">
            <div className="preview-toolbar">
                <span className="preview-label">Preview</span>
                <div className="preview-controls">
                    <button
                        className="preview-control-btn"
                        onClick={handleRefresh}
                        title="Refresh preview"
                    >
                        ↻ Refresh
                    </button>
                    <button
                        className="preview-control-btn"
                        onClick={handleCopy}
                        title="Copy HTML"
                    >
                        {copied ? '✓ Copied!' : '📋 Copy HTML'}
                    </button>
                    <button
                        className="preview-control-btn"
                        onClick={handleOpenNewTab}
                        title="Open in new tab"
                    >
                        ↗ New Tab
                    </button>
                </div>
            </div>
            <div className="preview-iframe-container">
                <iframe
                    ref={iframeRef}
                    className="preview-iframe"
                    sandbox="allow-scripts allow-same-origin"
                    title="Presentation Preview"
                />
            </div>
        </div>
    );
}
