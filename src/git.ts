import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// Locate the git dir for `start`, walking up to the filesystem root.
// Handles worktrees/submodules, where `.git` is a file holding "gitdir: <path>".
function findGitDir(start: string): string | null {
  let dir = resolve(start);
  for (;;) {
    const dotGit = join(dir, '.git');
    try {
      const st = statSync(dotGit);
      if (st.isDirectory()) return dotGit;
      if (st.isFile()) {
        const m = /^gitdir:\s*(.+)$/m.exec(readFileSync(dotGit, 'utf8'));
        if (m) return resolve(dir, m[1].trim());
      }
    } catch {}
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// Current branch name read straight from .git/HEAD — no `git` spawn, so it
// stays cheap on every tick. Detached HEAD → short commit hash. null outside a repo.
export function getGitBranch(cwd: string | undefined): string | null {
  if (!cwd) return null;
  try {
    const gitDir = findGitDir(cwd);
    if (!gitDir) return null;
    const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();
    const ref = /^ref:\s*refs\/heads\/(.+)$/.exec(head);
    if (ref) return ref[1];
    return /^[0-9a-f]{7,}$/i.test(head) ? head.slice(0, 7) : null;
  } catch {
    return null;
  }
}
