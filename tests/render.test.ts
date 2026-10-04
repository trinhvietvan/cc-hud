import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../dist/render.js';
import type { RenderData } from '../dist/types.js';

// Strip ANSI escape codes for content assertions
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

function makeData(overrides: Partial<RenderData> = {}): RenderData {
  return {
    model: 'Opus',
    modelVariant: null,
    contextPercent: 0,
    contextTokens: null,
    agents: [],
    fiveHourPercent: null,
    sevenDayPercent: null,
    fiveHourResetsAt: null,
    sevenDayResetsAt: null,
    thinkingDepth: null,
    topModel: null,
    extra: null,
    gitBranch: null,
    ...overrides,
  };
}

// Local wall-clock instant at least `minAheadMs` in the future, for exact reset-time assertions.
function futureAt(minAheadMs: number, hh: number, mm: number): Date {
  const d = new Date(Date.now() + minAheadMs);
  d.setHours(hh, mm, 0, 0);
  if (d.getTime() <= Date.now() + minAheadMs) d.setDate(d.getDate() + 1);
  return d;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

describe('render', () => {
  it('renders the full layout in order', () => {
    const now = Date.now();
    const out = strip(render(makeData({
      model: 'Opus 5.5',
      modelVariant: '1M',
      thinkingDepth: 'high',
      contextPercent: 50,
      contextTokens: 500_000,
      fiveHourPercent: 12,
      fiveHourResetsAt: now + 3 * 3_600_000,
      sevenDayPercent: 40,
      sevenDayResetsAt: now + 2 * 86_400_000,
    })));
    assert.match(
      out,
      /^🤖 Opus 5\.5 · 1M \| 🧠 High \| ⚡ Ctx 50% · 500k tokens \| 🔥 Usage 12% · Rs \d\d:\d\d \| ⚙️ Weekly 40% · Rs \d\d-[A-Z][a-z]{2} \d\d:\d\d$/,
    );
  });

  it('shows model name and 0% with no data', () => {
    const out = strip(render(makeData()));
    assert.equal(out, '🤖 Opus | ⚡ Ctx 0%');
  });

  it('clamps percentage to 0-100', () => {
    assert.match(strip(render(makeData({ contextPercent: -5 }))), /⚡ Ctx 0%/);
    assert.match(strip(render(makeData({ contextPercent: 150 }))), /⚡ Ctx 100%/);
  });

  it('omits variant when modelVariant is null', () => {
    const out = strip(render(makeData({ model: 'Opus 5.5' })));
    assert.match(out, /^🤖 Opus 5\.5 \|/);
  });

  it('formats token counts', () => {
    const tok = (n: number) => strip(render(makeData({ contextPercent: 1, contextTokens: n })));
    assert.match(tok(532), /· 532 tokens/);
    assert.match(tok(8_400), /· 8\.4k tokens/);
    assert.match(tok(500_000), /· 500k tokens/);
    assert.match(tok(1_000_000), /· 1M tokens/);
    assert.match(tok(1_250_000), /· 1\.3M tokens/);
  });

  it('omits token count when contextTokens is null', () => {
    const out = strip(render(makeData({ contextPercent: 30 })));
    assert.ok(!out.includes('tokens'));
  });

  it('shows em-dash when contextPercent is null (no current_usage yet)', () => {
    const out = strip(render(makeData({ contextPercent: null, contextTokens: null })));
    assert.match(out, /⚡ Ctx —%/);
    assert.ok(!out.includes('0%'));
  });

  it('shows thinking depth as its own segment', () => {
    assert.match(strip(render(makeData({ thinkingDepth: 'high' }))), /🤖 Opus \| 🧠 High \|/);
    assert.match(strip(render(makeData({ thinkingDepth: 'xhigh' }))), /🧠 XHigh/);
  });

  it('omits depth segment when thinkingDepth is null', () => {
    assert.ok(!strip(render(makeData())).includes('🧠'));
  });

  it('shows rate limits when provided', () => {
    const out = strip(render(makeData({ fiveHourPercent: 25, sevenDayPercent: 10 })));
    assert.match(out, /🔥 Usage 25% \| ⚙️ Weekly 10%$/);
  });

  it('omits rate limits when null', () => {
    const out = strip(render(makeData()));
    assert.ok(!out.includes('Usage'));
    assert.ok(!out.includes('Weekly'));
  });

  it('shows only Usage when Weekly is null', () => {
    const out = strip(render(makeData({ fiveHourPercent: 50 })));
    assert.match(out, /Usage 50%/);
    assert.ok(!out.includes('Weekly'));
  });

  it('shows Usage reset as local HH:MM', () => {
    const at = futureAt(60_000, 21, 30);
    const out = strip(render(makeData({ fiveHourPercent: 12, fiveHourResetsAt: at.getTime() })));
    assert.match(out, /Usage 12% · Rs 21:30$/);
  });

  it('shows Weekly reset as local DD-Mon HH:MM', () => {
    const at = futureAt(60_000, 9, 5);
    const date = `${String(at.getDate()).padStart(2, '0')}-${MONTHS[at.getMonth()]}`;
    const out = strip(render(makeData({ sevenDayPercent: 40, sevenDayResetsAt: at.getTime() })));
    assert.ok(out.endsWith(`Weekly 40% · Rs ${date} 09:05`), out);
  });

  it('omits reset when resets_at is null or in the past', () => {
    assert.ok(!strip(render(makeData({ fiveHourPercent: 25 }))).includes('Rs '));
    const past = strip(render(makeData({ fiveHourPercent: 25, fiveHourResetsAt: Date.now() - 60_000 })));
    assert.ok(!past.includes('Rs '));
  });

  it('shows agent segment when agents exist', () => {
    const out = strip(render(makeData({
      agents: [{ id: '1', type: 'explore', model: 'haiku', status: 'running' }],
    })));
    assert.match(out, /🧩 explore \(haiku\)/);
  });

  it('limits agents to 3', () => {
    const agents = Array.from({ length: 5 }, (_, i) => ({
      id: String(i), type: `agent${i}`, status: 'running' as const,
    }));
    const out = strip(render(makeData({ agents })));
    assert.ok(out.includes('agent0, agent1, agent2'));
    assert.ok(!out.includes('agent3'));
  });

  it('contains ANSI color codes in raw output', () => {
    assert.match(render(makeData({ contextPercent: 90 })), /\x1b\[38;5;211m/); // RED
    assert.match(render(makeData({ contextPercent: 30 })), /\x1b\[38;5;151m/); // GREEN
    assert.match(render(makeData({ contextPercent: 60 })), /\x1b\[38;5;223m/); // YELLOW
    assert.match(render(makeData({ contextPercent: 80 })), /\x1b\[38;5;216m/); // PEACH
  });

  it('shows extra segment when provided', () => {
    const out = strip(render(makeData({ fiveHourPercent: 50, extra: '¥3.77' })));
    assert.match(out, /Usage 50% \| 💰 ¥3\.77$/);
  });

  it('omits extra segment when null', () => {
    assert.ok(!strip(render(makeData())).includes('💰'));
  });

  it('renders DeepSeek model name', () => {
    assert.match(strip(render(makeData({ model: 'DeepSeek V4 Pro' }))), /^🤖 DeepSeek V4 Pro/);
  });

  it('shows top-model gauge after Weekly', () => {
    const out = strip(render(makeData({
      fiveHourPercent: 1,
      sevenDayPercent: 35,
      topModel: { name: 'Fable', percent: 46, resetsAt: null },
    })));
    assert.match(out, /Usage 1% \| ⚙️ Weekly 35% \| 🏆 Fable · 46%$/);
  });

  it('suppresses top-model reset when it matches the Weekly reset', () => {
    const resetsAt = Date.now() + 2.5 * 86_400_000;
    const out = strip(render(makeData({
      sevenDayPercent: 35,
      sevenDayResetsAt: resetsAt,
      topModel: { name: 'Fable', percent: 46, resetsAt: resetsAt + 500 },
    })));
    assert.match(out, /Weekly 35% · Rs .* \| 🏆 Fable · 46%$/);
  });

  it('shows top-model reset when it differs from the Weekly reset', () => {
    const now = Date.now();
    const out = strip(render(makeData({
      sevenDayPercent: 35,
      sevenDayResetsAt: now + 2 * 86_400_000,
      topModel: { name: 'Fable', percent: 46, resetsAt: now + 4 * 86_400_000 },
    })));
    assert.match(out, /🏆 Fable · 46% · Rs \d\d-[A-Z][a-z]{2} \d\d:\d\d$/);
  });

  it('colors top-model gauge by usage threshold', () => {
    const raw = render(makeData({ topModel: { name: 'Fable', percent: 90, resetsAt: null } }));
    assert.match(raw, /\x1b\[38;5;211m/); // RED for 90%
  });

  it('shows git branch as the last segment', () => {
    const out = strip(render(makeData({ fiveHourPercent: 5, extra: '¥3.77', gitBranch: 'main' })));
    assert.match(out, /💰 ¥3\.77 \| 🌿 git main$/);
  });

  it('omits git segment outside a repo', () => {
    assert.ok(!strip(render(makeData())).includes('🌿'));
  });
});
