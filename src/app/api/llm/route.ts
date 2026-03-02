/* ===========================================
   LLM PROXY ROUTE HANDLER
   POST /api/llm
   Provider-agnostic proxy — keys in env vars,
   not exposed to client
   =========================================== */

import { NextRequest, NextResponse } from 'next/server';

// Provider configurations
const PROVIDERS: Record<string, { baseUrl: string; envKey: string }> = {
    openai: {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        envKey: 'OPENAI_API_KEY',
    },
    deepseek: {
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        envKey: 'DEEPSEEK_API_KEY',
    },
    kimi: {
        baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
        envKey: 'KIMI_API_KEY',
    },
};

// Default provider + model
const DEFAULT_PROVIDER = process.env.DEFAULT_LLM_PROVIDER || 'openai';
const DEFAULT_MODEL = process.env.DEFAULT_LLM_MODEL || 'gpt-4o';

// ─── Simple in-memory rate limiter ───────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait a moment.' },
                { status: 429 }
            );
        }

        // Parse and validate request
        const body = await req.json();
        const {
            provider = DEFAULT_PROVIDER,
            model = DEFAULT_MODEL,
            messages,
            stream = false,
            max_tokens = 8192,
        } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
        }

        // Validate payload size (rough check)
        const payloadSize = JSON.stringify(body).length;
        if (payloadSize > 500_000) {
            return NextResponse.json(
                { error: 'Request too large (max 500KB)' },
                { status: 413 }
            );
        }

        // Get provider config
        const providerConfig = PROVIDERS[provider];
        if (!providerConfig) {
            return NextResponse.json(
                { error: `Unknown provider: ${provider}` },
                { status: 400 }
            );
        }

        const apiKey = process.env[providerConfig.envKey];
        if (!apiKey) {
            return NextResponse.json(
                { error: `API key not configured for provider: ${provider}. Set ${providerConfig.envKey} env var.` },
                { status: 500 }
            );
        }

        // Build the request to forward
        const llmPayload = {
            model,
            messages,
            max_tokens: Math.min(max_tokens, 8192),
            stream,
        };

        const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(llmPayload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`LLM API error (${provider}):`, response.status, errorBody);
            return NextResponse.json(
                { error: `Provider error: ${response.status}`, details: errorBody },
                { status: response.status }
            );
        }

        // Streaming response
        if (stream && response.body) {
            return new NextResponse(response.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            });
        }

        // Non-streaming response
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('LLM proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
