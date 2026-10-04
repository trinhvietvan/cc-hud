import type { RenderData } from './types.js';

// — Catppuccin Mocha palette (ANSI 256) —
const RESET = '\x1b[0m';
const fg = (n: number) => `\x1b[38;5;${n}m`;

const GREEN  = fg(151);  // #a6e3a1 — ok
const YELLOW = fg(223);  // #f9e2af — caution
const PEACH  = fg(216);  // #fab387 — warning
const RED    = fg(211);  // #f38ba8 — critical
const TEAL   = fg(115);  // #94e2d5 — agent accent
const BLUE   = fg(111);  // #89b4fa — info accent
const MAUVE  = fg(183);  // #cba6f7 — git branch
const SAPPHIRE  = fg(117); // #74c7ec — reset time: plenty
const LAVENDER  = fg(147); // #b4befe — reset time: moderate
const FLAMINGO  = fg(224); // #f2cdcd — reset time: attention
const MAROON    = fg(217); // #eba0ac — reset time: urgent
const OVERLAY = fg(243); // #6c7086 — dim/separator
const TEXT   = fg(189);  // #cdd6f4 — primary text

const SEP = ` ${OVERLAY}|${RESET} `;
const DOT = ` ${OVERLAY}·${RESET} `;

function color(percent: number): string {
  if (percent <= 50) return GREEN;
  if (percent <= 70) return YELLOW;
  if (percent <= 85) return PEACH;
  return RED;
}

function pct(percent: number): string {
  const clamped = Math.round(Math.max(0, Math.min(100, percent)));
  return `${color(clamped)}${clamped}%${RESET}`;
}

// Reasoning effort ("思考深度") — capitalize the raw level for display.
const EFFORT_LABELS: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', xhigh: 'XHigh', max: 'Max',
};
function effortLabel(raw: string): string {
  return EFFORT_LABELS[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

// 532 → "532", 500_000 → "500k", 1_250_000 → "1.3M"
function formatTokens(n: number): string {
  const trim = (s: string) => (s.endsWith('.0') ? s.slice(0, -2) : s);
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${trim((n / 1000).toFixed(n < 10_000 ? 1 : 0))}k`;
  return `${trim((n / 1_000_000).toFixed(1))}M`;
}

function resetColor(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours >= 24) return SAPPHIRE;
  if (hours >= 3)  return LAVENDER;
  if (hours >= 0.5) return FLAMINGO;
  return MAROON;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n: number) => String(n).padStart(2, '0');

// Absolute local reset time: "21:30", or "04-Oct 21:30" when withDate.
function formatReset(resetsAt: number | null, withDate: boolean): string | null {
  if (resetsAt == null) return null;
  const ms = resetsAt - Date.now();
  if (ms <= 0) return null;
  const d = new Date(resetsAt);
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const text = withDate ? `${pad2(d.getDate())}-${MONTHS[d.getMonth()]} ${time}` : time;
  return `${OVERLAY}Rs${RESET} ${resetColor(ms)}${text}${RESET}`;
}

// `labelSep` sits between label and percent: a plain space reads as one phrase
// ("Usage 12%"), a dot sets apart a name that isn't a label ("Fable · 46%").
function rateSegment(
  icon: string,
  label: string,
  percent: number | null,
  resetsAt: number | null,
  withDate: boolean,
  labelSep = ' ',
): string | null {
  if (percent == null) return null;
  const reset = formatReset(resetsAt, withDate);
  return `${icon} ${TEXT}${label}${RESET}${labelSep}${pct(percent)}${reset ? DOT + reset : ''}`;
}

function agentSegment(agents: RenderData['agents']): string | null {
  if (agents.length === 0) return null;
  const parts = agents.slice(0, 3).map(a => {
    const model = a.model ? ` ${OVERLAY}(${a.model})${RESET}` : '';
    return `${TEAL}${a.type}${RESET}${model}`;
  });
  return `🧩 ${parts.join(`${OVERLAY},${RESET} `)}`;
}

// The top-model gauge usually resets together with the 7d window —
// suppress its reset time then, so the same time isn't printed twice.
function sameReset(a: number | null, b: number | null): boolean {
  return a != null && b != null && Math.abs(a - b) < 60_000;
}

// 🤖 Opus 5.5 · 1M | 🧠 High | ⚡ Ctx 50% · 500k tokens | 🔥 Usage 12% · Rs 21:30 | ⚙️ Weekly 40% · Rs 04-Oct 21:30 | 🌿 git main
export function render(data: RenderData): string {
  const segments: string[] = [];

  const variant = data.modelVariant ? `${DOT}${TEXT}${data.modelVariant}${RESET}` : '';
  segments.push(`🤖 ${BLUE}${data.model}${RESET}${variant}`);

  if (data.thinkingDepth) {
    segments.push(`🧠 ${TEXT}${effortLabel(data.thinkingDepth)}${RESET}`);
  }

  // null = current_usage not yet populated (start of session or just after /compact)
  // — show a dim em-dash so it doesn't look like the context just emptied.
  if (data.contextPercent === null) {
    segments.push(`⚡ ${TEXT}Ctx${RESET} ${OVERLAY}—%${RESET}`);
  } else {
    const tokens = data.contextTokens != null
      ? `${DOT}${TEXT}${formatTokens(data.contextTokens)} tokens${RESET}`
      : '';
    segments.push(`⚡ ${TEXT}Ctx${RESET} ${pct(data.contextPercent)}${tokens}`);
  }

  const agentStr = agentSegment(data.agents);
  if (agentStr) segments.push(agentStr);

  const rates = [
    rateSegment('🔥', 'Usage', data.fiveHourPercent, data.fiveHourResetsAt, false),
    rateSegment('⚙️', 'Weekly', data.sevenDayPercent, data.sevenDayResetsAt, true),
    data.topModel
      ? rateSegment(
          '🏆',
          data.topModel.name,
          data.topModel.percent,
          sameReset(data.topModel.resetsAt, data.sevenDayResetsAt) ? null : data.topModel.resetsAt,
          true,
          DOT,
        )
      : null,
  ].filter((s): s is string => s !== null);
  segments.push(...rates);

  // Extra (generic pluggable segment, e.g. balance for non-Anthropic backends)
  if (data.extra) {
    segments.push(`💰 ${TEAL}${data.extra}${RESET}`);
  }

  if (data.gitBranch) {
    segments.push(`🌿 ${OVERLAY}git${RESET} ${MAUVE}${data.gitBranch}${RESET}`);
  }

  return segments.join(SEP);
}
