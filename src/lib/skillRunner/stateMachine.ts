/* ===========================================
   SKILL RUNNER STATE MACHINE
   Guides users through: detect mode → content
   discovery → style → generate → validate
   =========================================== */

import {
    ChatMessage,
    QuickReply,
    SkillState,
    Project,
    PresetKey,
    SlideOutlineItem,
} from '../types';
import { PRESETS, MOOD_PRESETS } from '../presets';
import {
    getSystemPrompt,
    getGenerateDeckPrompt,
    getIteratePrompt,
} from './prompts';

// ─── Unique ID generator ─────────────────────
let idCounter = 0;
function uid(): string {
    return `msg_${Date.now()}_${++idCounter}`;
}

// ─── Default project ─────────────────────────
function createProject(): Project {
    return {
        id: `proj_${Date.now()}`,
        createdAt: Date.now(),
        mode: 'prompt',
        preferences: {},
        history: [],
    };
}

// ─── Initial state ───────────────────────────
export function createInitialState(): SkillState {
    return {
        phase: 'idle',
        project: createProject(),
        messages: [
            {
                id: uid(),
                role: 'assistant',
                content:
                    'Welcome to **Websentation**! I can help you create stunning HTML presentations.\n\nWhat would you like to do?',
                timestamp: Date.now(),
                quickReplies: [
                    {
                        label: '✨ Create from prompt',
                        value: 'create_prompt',
                        description: 'Describe your presentation and I\'ll generate it',
                    },
                    {
                        label: '📄 Convert PPTX',
                        value: 'convert_pptx',
                        description: 'Upload a PowerPoint file to convert to HTML',
                    },
                ],
            },
        ],
        isStreaming: false,
    };
}

// ─── Process user input through the state machine ───
export async function processUserInput(
    state: SkillState,
    input: string,
    sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<SkillState> {
    const newState = { ...state };

    // Add user message
    const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: input,
        timestamp: Date.now(),
    };
    newState.messages = [...newState.messages, userMsg];

    switch (newState.phase) {
        case 'idle':
            return handleIdle(newState, input, sendLLMRequest);

        case 'detect_mode':
            return handleDetectMode(newState, input, sendLLMRequest);

        case 'content_discovery':
            return handleContentDiscovery(newState, input, sendLLMRequest);

        case 'style_discovery':
            return handleStyleDiscovery(newState, input, sendLLMRequest);

        case 'generating':
            return handleGenerating(newState, input, sendLLMRequest);

        case 'validating':
            return handleValidating(newState, input);

        case 'iterating':
        case 'complete':
            return handleIteration(newState, input, sendLLMRequest);

        default:
            return newState;
    }
}

// ─── Phase Handlers ──────────────────────────

async function handleIdle(state: SkillState, input: string, sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>): Promise<SkillState> {
    if (input === 'create_prompt' || input.toLowerCase().includes('create') || input.toLowerCase().includes('prompt') || input.toLowerCase().includes('presentation')) {
        state.project.mode = 'prompt';
        state.phase = 'content_discovery';
        addAssistantMessage(state, 'Great! Let\'s create a presentation. Tell me about it:', [
            { label: '🏢 Pitch deck', value: 'pitch', description: 'Selling an idea, product, or company' },
            { label: '📚 Teaching/Tutorial', value: 'teaching', description: 'Explaining concepts, how-to guides' },
            { label: '🎤 Conference talk', value: 'talk', description: 'Speaking at an event, keynote' },
            { label: '📋 Internal update', value: 'internal', description: 'Team updates, strategy meetings' },
        ]);
        return state;
    }

    if (input === 'convert_pptx' || input.toLowerCase().includes('pptx') || input.toLowerCase().includes('powerpoint') || input.toLowerCase().includes('convert')) {
        state.project.mode = 'pptx';
        state.phase = 'content_discovery';
        addAssistantMessage(state, 'Upload your PPTX file using the upload button above the chat. I\'ll extract the content and help you restyle it into a beautiful HTML presentation.');
        return state;
    }

    // Free text — try to detect intent
    state.phase = 'content_discovery';
    state.project.mode = 'prompt';
    return handleContentDiscovery(state, input, sendLLMRequest);
}

async function handleDetectMode(state: SkillState, input: string, sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>): Promise<SkillState> {
    return handleIdle(state, input, sendLLMRequest);
}

async function handleContentDiscovery(
    state: SkillState,
    input: string,
    sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<SkillState> {
    const prefs = state.project.preferences;

    // Purpose selection
    if (!prefs.purpose) {
        const purposes: Record<string, 'pitch' | 'teaching' | 'talk' | 'internal'> = {
            pitch: 'pitch',
            teaching: 'teaching',
            talk: 'talk',
            internal: 'internal',
        };
        if (purposes[input]) {
            prefs.purpose = purposes[input];
        } else {
            // Try to infer from free text
            if (input.toLowerCase().includes('pitch') || input.toLowerCase().includes('investor')) prefs.purpose = 'pitch';
            else if (input.toLowerCase().includes('teach') || input.toLowerCase().includes('tutorial')) prefs.purpose = 'teaching';
            else if (input.toLowerCase().includes('talk') || input.toLowerCase().includes('conference')) prefs.purpose = 'talk';
            else prefs.purpose = 'internal';
        }

        addAssistantMessage(state, `Got it — ${prefs.purpose} presentation. How many slides?`, [
            { label: '📊 Short (5-10)', value: 'short', description: 'Quick pitch, lightning talk' },
            { label: '📋 Medium (10-20)', value: 'medium', description: 'Standard presentation' },
            { label: '📚 Long (20+)', value: 'long', description: 'Deep dive, comprehensive' },
        ]);
        return state;
    }

    // Length selection
    if (!prefs.length) {
        const lengths: Record<string, 'short' | 'medium' | 'long'> = {
            short: 'short',
            medium: 'medium',
            long: 'long',
        };
        prefs.length = lengths[input] || 'medium';

        addAssistantMessage(state, 'Do you have the content ready?', [
            { label: '✅ Content ready', value: 'ready', description: 'Just need to design' },
            { label: '📝 Rough notes', value: 'notes', description: 'Need help organizing' },
            { label: '💡 Topic only', value: 'topic', description: 'Need full outline' },
        ]);
        return state;
    }

    // Content readiness
    if (!prefs.contentReadiness) {
        const readiness: Record<string, 'ready' | 'notes' | 'topic'> = {
            ready: 'ready',
            notes: 'notes',
            topic: 'topic',
        };
        prefs.contentReadiness = readiness[input] || 'topic';

        if (prefs.contentReadiness === 'topic') {
            addAssistantMessage(
                state,
                'Tell me the topic or theme for your presentation. I\'ll create an outline for you.'
            );
        } else {
            addAssistantMessage(
                state,
                'Share your content (bullet points, notes, key messages). I\'ll structure it into slides.'
            );
        }
        return state;
    }

    // User has provided content / topic — generate outline and move to style
    if (!state.project.outline) {
        state.isStreaming = true;

        try {
            const slideCount =
                prefs.length === 'short' ? 7 : prefs.length === 'medium' ? 14 : 22;

            const outlineRequest = [
                {
                    role: 'system',
                    content: `You are an expert presentation architect. Generate a JSON array of slide outlines. Each slide should have: index (number), title (string), type (one of: title, content, feature-grid, quote, closing), bullets (array of strings, max 5 per slide). Generate exactly ${slideCount} slides for a ${prefs.purpose} presentation. Return ONLY valid JSON, no markdown fences.`,
                },
                {
                    role: 'user',
                    content: `Create a presentation outline about: ${input}`,
                },
            ];

            const outlineJson = await sendLLMRequest(outlineRequest);
            let outline: SlideOutlineItem[];
            try {
                // Try to extract JSON from the response
                const jsonMatch = outlineJson.match(/\[[\s\S]*\]/);
                outline = JSON.parse(jsonMatch ? jsonMatch[0] : outlineJson);
            } catch {
                // Fallback outline
                outline = [
                    { index: 1, title: 'Title Slide', type: 'title' },
                    { index: 2, title: 'Overview', type: 'content', bullets: ['Key point 1', 'Key point 2', 'Key point 3'] },
                    { index: 3, title: 'Details', type: 'content', bullets: ['Detail 1', 'Detail 2', 'Detail 3'] },
                    { index: 4, title: 'Thank You', type: 'closing' },
                ];
            }

            state.project.outline = outline;
            state.project.title = input;
            state.isStreaming = false;

            // Show outline and move to style
            const outlineSummary = outline
                .map((s) => `**Slide ${s.index}:** ${s.title} _(${s.type})_`)
                .join('\n');

            state.phase = 'style_discovery';
            addAssistantMessage(
                state,
                `Here's the outline:\n\n${outlineSummary}\n\nNow let's pick a style! How would you like to choose?`,
                [
                    { label: '🎨 Show me options', value: 'show_options', description: 'Generate previews based on your vibe' },
                    { label: '📋 I know what I want', value: 'pick_direct', description: 'Choose from the preset list' },
                ]
            );
        } catch (error) {
            state.isStreaming = false;
            state.error = 'Failed to generate outline. Please try again.';
            addAssistantMessage(state, 'Sorry, I had trouble generating the outline. Could you try describing your topic again?');
        }

        return state;
    }

    return state;
}

async function handleStyleDiscovery(
    state: SkillState,
    input: string,
    sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<SkillState> {
    // Direct preset selection
    if (input === 'pick_direct') {
        const darkPresets = PRESETS.filter((p) => p.category === 'dark');
        const lightPresets = PRESETS.filter((p) => p.category === 'light');
        const specialtyPresets = PRESETS.filter((p) => p.category === 'specialty');

        const allReplies: QuickReply[] = [
            ...darkPresets.map((p) => ({
                label: `🌙 ${p.name}`,
                value: p.key,
                description: p.vibe,
            })),
            ...lightPresets.map((p) => ({
                label: `☀️ ${p.name}`,
                value: p.key,
                description: p.vibe,
            })),
            ...specialtyPresets.map((p) => ({
                label: `✨ ${p.name}`,
                value: p.key,
                description: p.vibe,
            })),
        ];

        addAssistantMessage(state, 'Choose a style preset:', allReplies);
        return state;
    }

    // Guided discovery — mood selection
    if (input === 'show_options') {
        addAssistantMessage(
            state,
            'What feeling should your audience have?',
            [
                { label: '💪 Impressed/Confident', value: 'impressed', description: 'Professional, trustworthy' },
                { label: '🚀 Excited/Energized', value: 'excited', description: 'Innovative, bold' },
                { label: '🧘 Calm/Focused', value: 'calm', description: 'Clear, thoughtful' },
                { label: '✨ Inspired/Moved', value: 'inspired', description: 'Emotional, memorable' },
            ]
        );
        return state;
    }

    // Mood selected → suggest 3 presets
    if (MOOD_PRESETS[input]) {
        const suggested = MOOD_PRESETS[input];
        const replies = suggested.map((key) => {
            const p = PRESETS.find((pr) => pr.key === key)!;
            return {
                label: p.name,
                value: p.key,
                description: `${p.vibe} — ${p.fonts.display} + ${p.fonts.body}`,
            };
        });
        addAssistantMessage(
            state,
            `Based on your vibe, I recommend these 3 styles. Pick one:`,
            replies
        );
        return state;
    }

    // Preset selected → generate deck
    const selectedPreset = PRESETS.find((p) => p.key === input);
    if (selectedPreset) {
        state.project.preset = input as PresetKey;
        state.phase = 'generating';

        addAssistantMessage(
            state,
            `Excellent choice — **${selectedPreset.name}**! ✨\n\n_${selectedPreset.vibe}_\n\nGenerating your presentation now...`
        );

        // Generate the deck
        return generateDeck(state, sendLLMRequest);
    }

    // If user typed a preset name
    const matchedPreset = PRESETS.find(
        (p) => p.name.toLowerCase() === input.toLowerCase() || p.key === input.toLowerCase()
    );
    if (matchedPreset) {
        state.project.preset = matchedPreset.key;
        state.phase = 'generating';

        addAssistantMessage(
            state,
            `Going with **${matchedPreset.name}**! Generating your presentation...`
        );

        return generateDeck(state, sendLLMRequest);
    }

    addAssistantMessage(
        state,
        'Now let\'s pick a style! How would you like to choose?',
        [
            { label: '🎨 Show me options', value: 'show_options', description: 'Generate previews based on your vibe' },
            { label: '📋 I know what I want', value: 'pick_direct', description: 'Choose from the preset list' },
        ]
    );
    return state;
}

async function generateDeck(
    state: SkillState,
    sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<SkillState> {
    state.isStreaming = true;

    try {
        const prompt = getGenerateDeckPrompt(
            state.project.preset!,
            state.project.outline || [],
            state.project.title || '',
            {
                purpose: state.project.preferences.purpose,
                length: state.project.preferences.length,
            }
        );

        const systemPrompt = getSystemPrompt();

        const html = await sendLLMRequest([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ]);

        // Clean the response — extract HTML if wrapped in code fences
        let cleanHtml = html;
        const htmlMatch = html.match(/```html?\s*([\s\S]*?)```/);
        if (htmlMatch) {
            cleanHtml = htmlMatch[1].trim();
        } else if (!html.trim().startsWith('<!DOCTYPE') && !html.trim().startsWith('<html')) {
            // If it doesn't look like HTML, wrap it
            cleanHtml = html;
        }

        state.project.html = cleanHtml;
        state.project.history.push({
            timestamp: Date.now(),
            type: 'generate',
            html: cleanHtml,
            description: 'Initial generation',
        });

        state.isStreaming = false;
        state.phase = 'complete';

        addAssistantMessage(
            state,
            `Your presentation is ready! 🎉\n\nCheck the preview panel on the right. You can:\n- Navigate with arrow keys or dots\n- Export as HTML or ZIP\n\nWant any changes?`,
            [
                { label: '📥 Export', value: 'export', description: 'Download your presentation' },
                { label: '🔄 Try different style', value: 'restyle', description: 'Pick another preset' },
                { label: '✏️ Edit slides', value: 'edit', description: 'Make specific changes' },
            ]
        );

        // Set html preview on the message
        const lastMsg = state.messages[state.messages.length - 1];
        lastMsg.htmlPreview = cleanHtml;
    } catch (error) {
        state.isStreaming = false;
        state.error = 'Failed to generate presentation';
        addAssistantMessage(
            state,
            'Sorry, I encountered an error generating the presentation. Please try again.',
            [{ label: '🔄 Retry', value: 'retry', description: 'Try generating again' }]
        );
    }

    return state;
}

async function handleGenerating(
    state: SkillState,
    input: string,
    sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<SkillState> {
    if (input === 'retry') {
        return generateDeck(state, sendLLMRequest);
    }
    return state;
}

function handleValidating(state: SkillState, _input: string): SkillState {
    // Validation is handled automatically in generateDeck
    return state;
}

async function handleIteration(
    state: SkillState,
    input: string,
    sendLLMRequest: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<SkillState> {
    if (input === 'export') {
        addAssistantMessage(state, 'Use the Export button in the top-right to download your presentation.', [
            { label: '📄 HTML only', value: 'export_html', description: 'Single HTML file' },
            { label: '📦 HTML + Assets ZIP', value: 'export_zip', description: 'HTML + images in ZIP' },
            { label: '🔒 Self-contained', value: 'export_embed', description: 'Single file with embedded images' },
        ]);
        return state;
    }

    if (input === 'restyle') {
        state.phase = 'style_discovery';
        addAssistantMessage(state, 'Pick a new style:', PRESETS.map((p) => ({
            label: `${p.category === 'dark' ? '🌙' : p.category === 'light' ? '☀️' : '✨'} ${p.name}`,
            value: p.key,
            description: p.vibe,
        })));
        return state;
    }

    // Handle free-form iteration requests
    if (state.project.html && input !== 'export_html' && input !== 'export_zip' && input !== 'export_embed') {
        state.isStreaming = true;
        state.phase = 'iterating';

        try {
            const systemPrompt = getSystemPrompt();
            const iteratePromptText = getIteratePrompt(state.project.html, input);

            const updatedHtml = await sendLLMRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: iteratePromptText },
            ]);

            let cleanHtml = updatedHtml;
            const htmlMatch = updatedHtml.match(/```html?\s*([\s\S]*?)```/);
            if (htmlMatch) {
                cleanHtml = htmlMatch[1].trim();
            }

            state.project.html = cleanHtml;
            state.project.history.push({
                timestamp: Date.now(),
                type: 'patch',
                html: cleanHtml,
                description: input,
            });

            state.isStreaming = false;
            state.phase = 'complete';

            addAssistantMessage(
                state,
                'Done! The preview has been updated. Want any more changes?',
                [
                    { label: '📥 Export', value: 'export', description: 'Download your presentation' },
                    { label: '✏️ More changes', value: 'edit', description: 'Make more edits' },
                ]
            );

            const lastMsg = state.messages[state.messages.length - 1];
            lastMsg.htmlPreview = cleanHtml;
        } catch {
            state.isStreaming = false;
            addAssistantMessage(state, 'Sorry, failed to apply changes. Please try again.');
        }
    }

    return state;
}

// ─── Helper ──────────────────────────────────
function addAssistantMessage(
    state: SkillState,
    content: string,
    quickReplies?: QuickReply[]
): void {
    state.messages.push({
        id: uid(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        quickReplies,
    });
}
