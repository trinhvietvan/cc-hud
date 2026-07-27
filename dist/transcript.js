import { open, stat } from 'node:fs/promises';
const EMPTY = { agents: [], effort: null };
const TAIL_BYTES = 64 * 1024; // 64 KB — agent entries & the latest effort are near the end
async function readTail(filePath) {
    const info = await stat(filePath);
    if (!info.isFile() || info.size === 0)
        return '';
    const fd = await open(filePath, 'r');
    try {
        const start = Math.max(0, info.size - TAIL_BYTES);
        const len = info.size - start;
        const buf = Buffer.alloc(len);
        await fd.read(buf, 0, len, start);
        const text = buf.toString('utf8');
        if (start > 0) {
            const nl = text.indexOf('\n');
            return nl >= 0 ? text.slice(nl + 1) : '';
        }
        return text;
    }
    finally {
        await fd.close();
    }
}
// Single tail read → active subagents + current thinking depth.
export async function parseTranscript(transcriptPath) {
    if (!transcriptPath)
        return EMPTY;
    let text;
    try {
        text = await readTail(transcriptPath);
    }
    catch {
        return EMPTY;
    }
    if (!text)
        return EMPTY;
    const agents = new Map();
    const completed = new Set();
    let effort = null; // last (= most recent) main-chain assistant effort wins
    const lines = text.split('\n');
    for (const line of lines) {
        // Fast pre-filter: skip lines that carry neither agent data nor an effort field
        const maybeAgent = line.includes('"Agent"') || line.includes('"tool_result"');
        const maybeEffort = line.includes('"effort"');
        if (!maybeAgent && !maybeEffort)
            continue;
        let entry;
        try {
            entry = JSON.parse(line);
        }
        catch {
            continue;
        }
        // Thinking depth = the effort of the newest main-chain assistant turn.
        // Ignore sidechain (subagent) turns — they carry their own effort.
        if (entry.type === 'assistant' && entry.isSidechain !== true && typeof entry.effort === 'string') {
            effort = entry.effort;
        }
        const blocks = entry.message?.content;
        if (!Array.isArray(blocks))
            continue;
        for (const block of blocks) {
            if (block.type === 'tool_use' && block.name === 'Agent' && block.id) {
                const input = block.input ?? {};
                agents.set(block.id, {
                    id: block.id,
                    type: input.subagent_type ?? 'general-purpose',
                    model: input.model,
                    description: input.description,
                    status: 'running',
                });
            }
            if (block.type === 'tool_result' && block.tool_use_id) {
                completed.add(block.tool_use_id);
            }
        }
    }
    for (const id of completed) {
        const agent = agents.get(id);
        if (agent)
            agent.status = 'completed';
    }
    return {
        agents: [...agents.values()].filter(a => a.status === 'running'),
        effort,
    };
}
