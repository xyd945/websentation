/* ===========================================
   UNIFIED FILE EXTRACTION ROUTE HANDLER
   POST /api/upload/extract
   Supports .pptx and .pdf files
   =========================================== */

import { NextRequest, NextResponse } from 'next/server';

// ─── XML helpers (for PPTX) ──────────────────
function extractTextFromXml(xml: string): string[] {
    const texts: string[] = [];
    const regex = /<a:t[^>]?>([\s\S]*?)<\/a:t>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        if (match[1].trim()) {
            texts.push(match[1].trim());
        }
    }
    return texts;
}

function extractTitle(xml: string): string | undefined {
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
    const regex2 = /<Relationship[^>]*Type="[^"]*image"[^>]*Id="(rId\d+)"[^>]*Target="([^"]*)"[^>]*\/>/g;
    while ((match = regex2.exec(relsXml)) !== null) {
        imageMap.set(match[1], match[2]);
    }
    return imageMap;
}

// ─── Shared types ────────────────────────────
type ExtractedSlide = {
    index: number;
    title?: string;
    blocks: Array<{ type: 'text'; text: string } | { type: 'image'; assetId: string }>;
    notes?: string;
};

type ExtractedAsset = {
    assetId: string;
    filename: string;
    mime: string;
    size: number;
    dataUrl: string;
};

type ExtractionResult = {
    slides: ExtractedSlide[];
    assets: ExtractedAsset[];
    warnings: string[];
    fileType: 'pptx' | 'pdf';
};

// ─── Route handler ───────────────────────────
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const fileName = file.name.toLowerCase();
        const isPptx = fileName.endsWith('.pptx');
        const isPdf = fileName.endsWith('.pdf');

        if (!isPptx && !isPdf) {
            return NextResponse.json(
                { error: 'Only .pptx and .pdf files are supported' },
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

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let result: ExtractionResult;

        if (isPptx) {
            result = await extractPptxContent(buffer);
        } else {
            result = await extractPdfContent(buffer);
        }

        return NextResponse.json({
            slides: result.slides,
            assets: result.assets,
            warnings: result.warnings,
            fileType: result.fileType,
        });
    } catch (error) {
        console.error('File extraction error:', error);
        return NextResponse.json(
            { error: 'Failed to extract file content' },
            { status: 500 }
        );
    }
}

// ─── PDF content extraction ──────────────────
async function extractPdfContent(buffer: Buffer): Promise<ExtractionResult> {
    const { extractText, getDocumentProxy } = await import('unpdf');

    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { totalPages, text: fullText } = await extractText(pdf, { mergePages: false });
    const warnings: string[] = [];
    const slides: ExtractedSlide[] = [];

    if (totalPages === 0 || !fullText || fullText.length === 0) {
        warnings.push('No text content found in PDF');
        return { slides: [], assets: [], warnings, fileType: 'pdf' };
    }

    // fullText is an array of strings, one per page
    const pages = Array.isArray(fullText) ? fullText : [fullText];

    for (let i = 0; i < pages.length; i++) {
        const pageText = (pages[i] as string).trim();
        if (!pageText) continue;

        const lines = pageText.split('\n').filter((l: string) => l.trim());

        // Use the first line as the title
        const title = lines[0] || `Page ${i + 1}`;
        const blocks: Array<{ type: 'text'; text: string }> = [];

        // Group remaining lines into paragraphs
        let currentParagraph = '';
        for (let j = 1; j < lines.length; j++) {
            const line = lines[j].trim();
            if (!line) {
                if (currentParagraph) {
                    blocks.push({ type: 'text', text: currentParagraph });
                    currentParagraph = '';
                }
            } else {
                currentParagraph += (currentParagraph ? ' ' : '') + line;
            }
        }
        if (currentParagraph) {
            blocks.push({ type: 'text', text: currentParagraph });
        }

        slides.push({
            index: i + 1,
            title,
            blocks,
        });
    }

    return { slides, assets: [], warnings, fileType: 'pdf' };
}

// ─── PPTX content extraction ─────────────────
async function extractPptxContent(buffer: Buffer): Promise<ExtractionResult> {
    const { unzipSync } = await import('fflate');

    const files = unzipSync(new Uint8Array(buffer));
    const warnings: string[] = [];
    const slides: ExtractedSlide[] = [];
    const assets: ExtractedAsset[] = [];

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

    return { slides, assets, warnings, fileType: 'pptx' };
}
