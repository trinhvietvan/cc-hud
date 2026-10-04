import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGitBranch } from '../dist/git.js';

describe('getGitBranch', () => {
  let root: string;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'cc-hud-git-'));
  });

  after(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function repo(name: string, head: string): string {
    const dir = join(root, name);
    mkdirSync(join(dir, '.git'), { recursive: true });
    writeFileSync(join(dir, '.git', 'HEAD'), head);
    return dir;
  }

  it('reads the branch from .git/HEAD', () => {
    assert.equal(getGitBranch(repo('a', 'ref: refs/heads/main\n')), 'main');
  });

  it('keeps slashes in branch names', () => {
    assert.equal(getGitBranch(repo('b', 'ref: refs/heads/feat/git-segment\n')), 'feat/git-segment');
  });

  it('finds the repo from a nested subdirectory', () => {
    const dir = repo('c', 'ref: refs/heads/dev\n');
    const nested = join(dir, 'src', 'deep');
    mkdirSync(nested, { recursive: true });
    assert.equal(getGitBranch(nested), 'dev');
  });

  it('shows a short hash on detached HEAD', () => {
    assert.equal(getGitBranch(repo('d', '68c52c142a4f3183b21cd8b9260ec8a5b26401f9\n')), '68c52c1');
  });

  it('follows a worktree .git file', () => {
    const gitDir = join(root, 'wt-meta');
    mkdirSync(gitDir, { recursive: true });
    writeFileSync(join(gitDir, 'HEAD'), 'ref: refs/heads/wt-branch\n');
    const wt = join(root, 'wt');
    mkdirSync(wt, { recursive: true });
    writeFileSync(join(wt, '.git'), `gitdir: ${gitDir}\n`);
    assert.equal(getGitBranch(wt), 'wt-branch');
  });

  it('returns null without a cwd', () => {
    assert.equal(getGitBranch(undefined), null);
  });
});
