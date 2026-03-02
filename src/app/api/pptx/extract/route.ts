/* ===========================================
   PPTX EXTRACTION ROUTE HANDLER
   POST /api/pptx/extract
   Node-only extraction — no python-pptx needed
   =========================================== */

import { NextRequest, NextResponse } from 'next/server';

// Simple XML text extraction (no heavy dependency)
function extractTextFromXml(xml: string): string[] {
    const texts: string[] = [];
    // Match <a:t>...</a:t> (text runs in OOXML)
    const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        if (match[1].trim()) {
            texts.push(match[1].trim());
        }
    }
    return texts;
}

function extractTitle(xml: string): string | undefined {
    // Look for title placeholder
    const titleMatch = xml.match(/<p:sp>[\s\S]*?<p:ph type="title"[\s\S]*?<\/p:sp>/i) ||
        xml.match(/<p:sp>[\s\S]*?<p:ph type="ctrTitle"[\s\S]*?<\/p:sp>/i);
    if (titleMatch) {
        const texts = extractTextFromXml(titleMatch[0]);
        return texts.join(' ');
    }
    return undefined;
}

function extractImageRels(relsXml: string): Map<string, string> {
    const imageMap = new Map<string, string>();
    const regex = /<Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]*)"[^>]*Type="[^"]*image"[^>]*\/>/g;
    let match;
    while ((match = regex.exec(relsXml)) !== null) {
        imageMap.set(match[1], match[2]);
    }
    // Also try reverse order of attributes
    const regex2 = /<Relationship[^>]*Type="[^"]*image"[^>]*Id="(rId\d+)"[^>]*Target="([^"]*)"[^>]*\/>/g;
    while ((match = regex2.exec(relsXml)) !== null) {
        imageMap.set(match[1], match[2]);
    }
    return imageMap;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!file.name.endsWith('.pptx')) {
            return NextResponse.json(
                { error: 'Only .pptx files are supported' },
                { status: 400 }
            );
        }

        // Max 50MB
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large (max 50MB)' },
                { status: 413 }
            );
        }

        // Read file as ArrayBuffer and use JSZip-like approach
        // Since we want to avoid heavy deps, use a simple approach:
        // For MVP, we'll use the built-in DecompressionStream or a minimal unzip
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use dynamic import for the unzip functionality
        // We'll parse the ZIP manually using the ZIP format spec
        const slides = await extractPptxContent(buffer);

        return NextResponse.json({
            slides: slides.slides,
            assets: slides.assets,
            warnings: slides.warnings,
        });
    } catch (error) {
        console.error('PPTX extraction error:', error);
        return NextResponse.json(
            { error: 'Failed to extract PPTX content' },
            { status: 500 }
        );
    }
}

// ─── PPTX content extraction ─────────────────
async function extractPptxContent(buffer: Buffer): Promise<{
    slides: Array<{
        index: number;
        title?: string;
        blocks: Array<{ type: 'text'; text: string } | { type: 'image'; assetId: string }>;
        notes?: string;
    }>;
    assets: Array<{
        assetId: string;
        filename: string;
        mime: string;
        size: number;
        dataUrl: string;
    }>;
    warnings: string[];
}> {
    // For MVP, we'll use a simple ZIP parsing approach
    // PPTX is just a ZIP file with XML inside
    const { unzipSync } = await import('fflate');

    const files = unzipSync(new Uint8Array(buffer));
    const warnings: string[] = [];
    const slides: Array<{
        index: number;
        title?: string;
        blocks: Array<{ type: 'text'; text: string } | { type: 'image'; assetId: string }>;
        notes?: string;
    }> = [];
    const assets: Array<{
        assetId: string;
        filename: string;
        mime: string;
        size: number;
        dataUrl: string;
    }> = [];

    // Find slide files
    const slideFiles = Object.keys(files)
        .filter((f) => f.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
            const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
            return numA - numB;
        });

    for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slideXml = new TextDecoder().decode(files[slideFile]);
        const slideNum = parseInt(slideFile.match(/slide(\d+)/)?.[1] || `${i + 1}`);

        const title = extractTitle(slideXml);
        const textBlocks = extractTextFromXml(slideXml);
        const blocks: Array<{ type: 'text'; text: string } | { type: 'image'; assetId: string }> = [];

        // Add text blocks (skip title)
        for (const text of textBlocks) {
            if (text !== title && text.trim()) {
                blocks.push({ type: 'text', text });
            }
        }

        // Check for images in relationships
        const relsPath = slideFile.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
        if (files[relsPath]) {
            const relsXml = new TextDecoder().decode(files[relsPath]);
            const imageRels = extractImageRels(relsXml);

            for (const [, target] of imageRels) {
                const imagePath = target.startsWith('../')
                    ? 'ppt/' + target.slice(3)
                    : 'ppt/slides/' + target;

                if (files[imagePath]) {
                    const imageData = files[imagePath];
                    const ext = imagePath.split('.').pop()?.toLowerCase() || 'png';
                    const mime =
                        ext === 'jpg' || ext === 'jpeg'
                            ? 'image/jpeg'
                            : ext === 'png'
                                ? 'image/png'
                                : ext === 'gif'
                                    ? 'image/gif'
                                    : ext === 'svg'
                                        ? 'image/svg+xml'
                                        : 'image/png';

                    const assetId = `slide${slideNum}_img${assets.length + 1}`;
                    const base64 = Buffer.from(imageData).toString('base64');
                    const dataUrl = `data:${mime};base64,${base64}`;

                    assets.push({
                        assetId,
                        filename: imagePath.split('/').pop() || `${assetId}.${ext}`,
                        mime,
                        size: imageData.length,
                        dataUrl,
                    });

                    blocks.push({ type: 'image', assetId });
                }
            }
        }

        // Check for notes
        const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
        let notes: string | undefined;
        if (files[notesPath]) {
            const notesXml = new TextDecoder().decode(files[notesPath]);
            const noteTexts = extractTextFromXml(notesXml);
            if (noteTexts.length > 0) {
                notes = noteTexts.join('\n');
            }
        }

        // Detect complex elements
        if (slideXml.includes('c:chart')) warnings.push(`Slide ${slideNum}: Chart detected — simplified to text`);
        if (slideXml.includes('dgm:')) warnings.push(`Slide ${slideNum}: SmartArt detected — simplified to text`);

        slides.push({
            index: slideNum,
            title: title || `Slide ${slideNum}`,
            blocks,
            notes,
        });
    }

    return { slides, assets, warnings };
}
