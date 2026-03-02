'use client';

/* ===========================================
   EXPORT MODAL
   HTML only / HTML+ZIP / Self-contained options
   =========================================== */

import { useState } from 'react';
import { ExportFormat } from '@/lib/types';

interface ExportModalProps {
    html: string;
    title?: string;
    onClose: () => void;
}

export default function ExportModal({ html, title, onClose }: ExportModalProps) {
    const [format, setFormat] = useState<ExportFormat>('html');
    const [exporting, setExporting] = useState(false);

    const filename = (title || 'presentation').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();

    const handleExport = async () => {
        setExporting(true);

        try {
            switch (format) {
                case 'html': {
                    // Download as single HTML file
                    const blob = new Blob([html], { type: 'text/html' });
                    downloadBlob(blob, `${filename}.html`);
                    break;
                }

                case 'zip': {
                    // HTML + assets in ZIP
                    const JSZip = (await import('jszip')).default;
                    const zip = new JSZip();
                    zip.file(`${filename}.html`, html);

                    // Extract images from HTML and add to zip
                    const imgRegex = /src="data:([^;]+);base64,([^"]+)"/g;
                    let match;
                    let imgIndex = 0;
                    let modifiedHtml = html;
                    while ((match = imgRegex.exec(html)) !== null) {
                        imgIndex++;
                        const mime = match[1];
                        const base64 = match[2];
                        const ext = mime.split('/')[1] || 'png';
                        const imgFilename = `assets/image${imgIndex}.${ext}`;
                        zip.file(imgFilename, base64, { base64: true });
                        modifiedHtml = modifiedHtml.replace(match[0], `src="${imgFilename}"`);
                    }

                    if (imgIndex > 0) {
                        zip.file(`${filename}.html`, modifiedHtml);
                    }

                    const content = await zip.generateAsync({ type: 'blob' });
                    downloadBlob(content, `${filename}.zip`);
                    break;
                }

                case 'self-contained': {
                    // Already self-contained with base64 images
                    const blob = new Blob([html], { type: 'text/html' });
                    downloadBlob(blob, `${filename}-standalone.html`);
                    break;
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Export Presentation</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <button
                        className={`export-option ${format === 'html' ? 'active' : ''}`}
                        onClick={() => setFormat('html')}
                    >
                        <h4>📄 HTML Only</h4>
                        <p>Single HTML file — best for text-only decks</p>
                    </button>

                    <button
                        className={`export-option ${format === 'zip' ? 'active' : ''}`}
                        onClick={() => setFormat('zip')}
                    >
                        <h4>📦 HTML + Assets ZIP</h4>
                        <p>HTML file with images in a separate folder — recommended</p>
                    </button>

                    <button
                        className={`export-option ${format === 'self-contained' ? 'active' : ''}`}
                        onClick={() => setFormat('self-contained')}
                    >
                        <h4>🔒 Self-Contained HTML</h4>
                        <p>All images embedded as base64 — single file, larger size</p>
                    </button>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? 'Exporting...' : 'Download'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
