'use client';

/* ===========================================
   UPLOAD FILE MODAL
   Drag/drop zone, extraction progress
   Supports .pptx and .pdf files
   =========================================== */

import { useState, useRef, useCallback } from 'react';

interface UploadPptModalProps {
    onClose: () => void;
    onExtracted: (data: {
        slides: Array<{
            index: number;
            title?: string;
            blocks: Array<{ type: string; text?: string; assetId?: string }>;
            notes?: string;
        }>;
        assets: Array<{
            assetId: string;
            filename: string;
            mime: string;
            size: number;
            dataUrl: string;
        }>;
        warnings?: string[];
    }) => void;
}

export default function UploadPptModal({
    onClose,
    onExtracted,
}: UploadPptModalProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        async (file: File) => {
            if (!file.name.endsWith('.pptx') && !file.name.endsWith('.pdf')) {
                setError('Only .pptx and .pdf files are supported');
                return;
            }

            if (file.size > 50 * 1024 * 1024) {
                setError('File too large (max 50MB)');
                return;
            }

            setError(null);
            setUploading(true);
            setProgress(20);

            try {
                const formData = new FormData();
                formData.append('file', file);

                setProgress(50);

                const response = await fetch('/api/upload/extract', {
                    method: 'POST',
                    body: formData,
                });

                setProgress(80);

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Extraction failed');
                }

                const data = await response.json();
                setProgress(100);

                setTimeout(() => {
                    onExtracted(data);
                    onClose();
                }, 500);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
                setUploading(false);
                setProgress(0);
            }
        },
        [onClose, onExtracted]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleClick = () => fileInputRef.current?.click();

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Upload PowerPoint</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div
                        className={`upload-dropzone ${isDragOver ? 'dragover' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={handleClick}
                    >
                        <div className="upload-dropzone-icon">📎</div>
                        <h4>Drop your .pptx or .pdf file here</h4>
                        <p>or click to browse (max 50MB)</p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pptx,.pdf"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                    />

                    {uploading && (
                        <div className="upload-progress">
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {progress < 50
                                    ? 'Uploading...'
                                    : progress < 80
                                        ? 'Extracting slides...'
                                        : progress < 100
                                            ? 'Processing images...'
                                            : 'Done!'}
                            </p>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p
                            style={{
                                color: 'var(--error)',
                                fontSize: 13,
                                marginTop: 12,
                            }}
                        >
                            ⚠ {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
