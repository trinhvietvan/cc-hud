<!--
  cc-hud — Claude Code statusline plugin
  Shows: model name, thinking depth (reasoning effort), context window usage (percent + token count), active subagents, rate limits (5h/7d) with local reset time, top-model weekly gauge (Opus/Fable)
  Pure Node.js, zero dependencies, crash-free on Windows (no Bun)

  ## Auto-install (for Claude Code AI agents)
  Step 1: /plugin marketplace add trinhvietvan/cc-hud
  Step 2: /plugin install cc-hud@cc-hud
  Step 3: /reload-plugins
  Step 4: /cc-hud:setup  (idempotent; v0.5.0+ installs a launcher so future upgrades only need step 1 + step 3)

  Keywords: claude-code plugin statusline status-bar hud monitoring context-window rate-limit reset-countdown agents windows crash-free zero-dependency catppuccin deepseek minimax glm thinking-depth reasoning-effort effort-level fable opus-limit top-model weekly-gauge
-->

<p align="center">
  <picture>
    <source srcset="https://raw.githubusercontent.com/trinhvietvan/cc-hud/main/cc-hud-preview.svg?v=0.8.0" type="image/svg+xml" />
    <img src="https://raw.githubusercontent.com/trinhvietvan/cc-hud/main/cc-hud-preview.png?v=0.8.0" alt="cc-hud preview — model, thinking depth, context + tokens, agents, rate limits with reset time, top-model gauge, balance" width="900" />
  </picture>
</p>

<h1 align="center">CC-HUD</h1>

<p align="center">
  <strong>A compact, single-line statusline plugin for <a href="https://claude.ai/claude-code">Claude Code</a></strong><br/>
  <sub>Crash-free, zero-dependency status bar — model · thinking depth · context · agents · rate limits · top-model gauge</sub>
</p>

<p align="center">
  <code>Model · Depth</code> &nbsp;&rarr;&nbsp; <code>Context</code> &nbsp;&rarr;&nbsp; <code>Agents</code> &nbsp;&rarr;&nbsp; <code>Rate Limits</code> &nbsp;&rarr;&nbsp; <code>Top Model</code>
  <br/>
  <sub>everything you need, nothing you don't.</sub>
</p>

<p align="center">
  <a href="#install"><img src="https://img.shields.io/badge/install-4_commands-blueviolet?style=flat-square" alt="install" /></a>
  &nbsp;
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square" alt="zero deps" />
  &nbsp;
  <img src="https://img.shields.io/badge/node-%3E%3D18-blue?style=flat-square" alt="node >= 18" />
  &nbsp;
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT" />
</p>

<br/>

## Why CC-HUD?

**Problem.** Claude Code's native installer bundles [Bun](https://bun.sh), which has a known memory allocator bug on **Windows** ([oven-sh/bun#25082](https://github.com/oven-sh/bun/issues/25082)). Statusline plugins like [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) run **on every tick**, amplifying memory pressure and making `pas panic` crashes far more likely.

**Solution.** CC-HUD is a **crash-free alternative** — pure Node.js, zero deps, stateless per call, ~60ms render, 2s hard timeout. Designed to keep your status bar running without taking Claude Code down.

> [!TIP]
> **Windows users:** the native installer's `claude.exe` embeds a Bun runtime — the very source of the `pas panic` crash. The npm build runs on your system Node.js and doesn't have the problem:
>
> ```powershell
> claude doctor                        # check which install you're on
> npm i -g @anthropic-ai/claude-code   # switch to the npm build
> ```
>
> **Windows 用户：** 原生安装器的 `claude.exe` 内嵌 Bun 运行时，正是 `pas panic` 崩溃的根源；npm 版跑在系统 Node.js 上，无此问题。用上面两条命令确认安装类型并切换。

<br/>

## Features

<table>
<tr>
  <td align="center" width="16%"><h3>⚡</h3><b>Context</b><br/><sub>Usage percent<br/>+ live token count</sub></td>
  <td align="center" width="17%"><h3>★</h3><b>Depth & Top Model</b><br/><sub>Thinking-depth badge<br/>Opus/Fable weekly gauge</sub></td>
  <td align="center" width="17%"><h3>🧩</h3><b>Agents</b><br/><sub>Running subagents<br/>with type & model</sub></td>
  <td align="center" width="17%"><h3>%</h3><b>Rate Limits</b><br/><sub>5h / 7d usage<br/>+ local reset time</sub></td>
  <td align="center" width="17%"><h3>◧</h3><b>Color</b><br/><sub><a href="https://github.com/catppuccin/catppuccin">Catppuccin Mocha</a><br/>dual-tone gradient</sub></td>
  <td align="center" width="16%"><h3>0</h3><b>Dependencies</b><br/><sub>Zero. Node.js<br/>built-ins only</sub></td>
</tr>
</table>

<br/>

## Layout

```
🤖 Opus 5.5 · 1M | 🧠 High | ⚡ 50% · 500k tokens | 🔥 5H · 12% · Resets 21:30 | ⚙️ 7D · 40% · Resets 08-Oct 21:30
```

| Segment | Shows |
| --- | --- |
| `🤖 Opus 5.5 · 1M` | Model name, plus `1M` when the context window is 1M tokens (from the model id's `[1m]` suffix or the reported window size) |
| `🧠 High` | Thinking depth (reasoning effort) — hidden when the transcript carries none |
| `⚡ 50% · 500k tokens` | Context window usage and the tokens currently in it; `⚡ —%` right after `/compact` until the next API call |
| `🧩 Explore (haiku)` | Running subagents (up to 3), with model — only while any are running |
| `🔥 5H · 12% · Resets 21:30` | 5-hour rate limit and when it resets, in local time |
| `⚙️ 7D · 40% · Resets 08-Oct 21:30` | 7-day rate limit and its reset date + time |
| `🏆 Fable · 51%` | Top-model weekly gauge (see below) |
| `💰 ¥13.44` | Balance for third-party backends, or your own `CC_HUD_EXTRA_FILE` text |

Percentages are colored green → yellow → peach → red as they climb (≤50 / ≤70 / ≤85 / above); reset times shift from sapphire to maroon as the reset approaches.

<br/>

## Install

Inside Claude Code:

```
/plugin marketplace add trinhvietvan/cc-hud
/plugin install cc-hud@cc-hud
/reload-plugins
/cc-hud:setup        # idempotent; safe to re-run
```

**Done** — no restart needed; `/reload-plugins` hot-loads the HUD.

> [!NOTE]
> `/cc-hud:setup` installs a tiny launcher at `~/.claude/bin/cc-hud-launcher.cjs` and points `statusLine.command` at it. It is **idempotent** — re-running migrates old version-pinned paths and skips when already current. If `statusLine` is managed by [`cc-bot`](https://github.com/WaterTian/cc-bot)'s shim, setup detects this and leaves it alone (the shim already wraps cc-hud transparently).

### Upgrade

```
/plugin marketplace update cc-hud
/reload-plugins
```

> [!NOTE]
> The launcher resolves the currently installed cc-hud version on each tick, so upgrades need **no re-setup**. Upgrading from **≤0.4.x**? Re-run `/cc-hud:setup` **once** — it auto-detects the old version-pinned path and migrates it to the launcher.

<details>
<summary><b>From source</b></summary>
<br/>

```bash
git clone https://github.com/trinhvietvan/cc-hud.git
cd cc-hud && npm install && npm run build
```

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /absolute/path/to/cc-hud/dist/index.js",
    "padding": 2
  }
}
```

</details>

<br/>

## How It Works

```
Claude Code ──stdin JSON──→  ~/.claude/bin/cc-hud-launcher.cjs   ← stable path (v0.5+)
                              │ resolves the currently installed cc-hud
                              ▼
                             cc-hud dist/index.js  ──stdout──→ status bar
                              ↘ transcript JSONL (tail 64KB → active agents + thinking depth)
                              ↘ claude-refresh.js (detached → top-model weekly gauge, 5 min cache)
```

<table>
<tr>
  <td align="center" width="25%"><b>Stateless</b><br/><sub>Fresh process per tick<br/>zero memory leaks</sub></td>
  <td align="center" width="25%"><b>Fast</b><br/><sub>~60ms render<br/>within 300ms debounce</sub></td>
  <td align="center" width="25%"><b>Safe</b><br/><sub>2s hard timeout<br/>all IO try-catch</sub></td>
  <td align="center" width="25%"><b>Upgrade-safe</b><br/><sub>Stable launcher (v0.5+)<br/>no re-setup on upgrade</sub></td>
</tr>
</table>

<br/>

## Thinking Depth & Top-Model Gauge

cc-hud shows your current **thinking depth** (the model's reasoning effort — `Low` / `Medium` / `High` / `XHigh` / `Max`) as its own `🧠` segment, plus the **top-tier-model weekly gauge** — the "Current week (Opus / Fable)" meter from `/usage` that the statusline JSON doesn't expose:

```
🤖 Fable 5 | 🧠 XHigh | ⚡ 18% · 180k tokens | 🔥 5H · 1% · Resets 22:15 | ⚙️ 7D · 35% · Resets 08-Oct 21:30 | 🏆 Fable · 51%
```

- **Thinking depth** comes from the statusline JSON's `effort.level`, so it updates the moment you run `/effort`; older Claude Code builds fall back to the latest transcript turn's `effort`. **Zero network**, works on every backend. The segment hides itself when neither source carries an effort.
- **Top-model gauge** comes from the same OAuth usage endpoint the `/usage` panel reads. The OAuth token is read locally (`~/.claude/.credentials.json`, or the macOS Keychain), used only for this read-only call, and never stored, logged, or refreshed.
- Fetches run in a **detached background refresher** — a statusline tick never waits on the network. Results are cached for 5 minutes.
- The gauge only activates on the official Anthropic backend with a subscription; API-key and third-party sessions skip it entirely.
- Opt out anytime: set `CC_HUD_NO_REFRESH=1` to disable the background usage fetch (the transcript-read thinking depth is unaffected — it never touches the network).

<br/>

## Auto-detected Backends

cc-hud detects your `ANTHROPIC_BASE_URL` and pulls **balance / quota** automatically — **zero configuration**, cached locally for 5 minutes. Model names are beautified along the way (`claude-fable-5` → `Fable 5`, `glm-5.2[1m]` → `GLM 5.2 (1M)`, `MiniMax-M3` → `MiniMax M3`, etc.).

<table>
<tr>
  <th>Backend</th>
  <th><code>ANTHROPIC_BASE_URL</code></th>
  <th>Extra segment</th>
</tr>
<tr>
  <td><b>DeepSeek</b></td>
  <td><code>https://api.deepseek.com/anthropic</code></td>
  <td>account balance — <code>💰 ¥13.44</code></td>
</tr>
<tr>
  <td><b>MiniMax</b></td>
  <td><code>https://api.minimaxi.com/anthropic</code></td>
  <td>Token Plan — <code>🔥 5H · 17% · Resets 18:50 | ⚙️ 7D · 2% · Resets 10-Oct 09:00</code></td>
</tr>
<tr>
  <td><b>GLM</b></td>
  <td><code>https://open.bigmodel.cn/api/anthropic</code><br/><code>https://api.z.ai/api/anthropic</code></td>
  <td>account balance — <code>💰 ¥88.50</code></td>
</tr>
</table>

Example output:

```
🤖 DeepSeek V4 Pro | ⚡ 20% · 200k tokens | 💰 ¥13.44
🤖 MiniMax M3 | ⚡ 13% · 26k tokens | 🔥 5H · 17% · Resets 18:50 | ⚙️ 7D · 2% · Resets 10-Oct 09:00
🤖 GLM 5.2 · 1M | ⚡ 41% · 410k tokens | 💰 ¥88.50
```

Works with `dscode` / `mmcode` / `glmcode` / `ZCode` or any launcher that exports `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`.

### Other backends

Set the `CC_HUD_EXTRA_FILE` env var to any file whose first line is the text to display. See `scripts/ds-balance-cache.sh` for a reference cache implementation.

<br/>

## Development

```bash
npm install
npm run build      # compile TypeScript → dist/
npm test           # 135 tests (node:test)
```

Project layout:

| Path | Purpose |
| --- | --- |
| `src/` | TypeScript source — entry, render, model normalize, transcript (agents + thinking depth), Claude gauge / DeepSeek / MiniMax / GLM collectors, detached refresher |
| `scripts/launcher.cjs` | Stable-path launcher (`/cc-hud:setup` copies it to `~/.claude/bin/`) |
| `commands/setup.md` | `/cc-hud:setup` slash command |
| `tests/` | `node:test` unit tests (TS + CJS) |
| `dist/` | Compiled output, committed |

<br/>

## Star History

<a href="https://star-history.com/#trinhvietvan/cc-hud&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=trinhvietvan/cc-hud&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=trinhvietvan/cc-hud&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=trinhvietvan/cc-hud&type=Date" width="700" />
  </picture>
</a>

<br/>

---

<p align="center">
  <sub>MIT License &copy; <a href="https://github.com/WaterTian">Water</a> · fork maintained by <a href="https://github.com/trinhvietvan">trinhvietvan</a> · upstream <a href="https://github.com/WaterTian/cc-hud">WaterTian/cc-hud</a></sub>
</p>
