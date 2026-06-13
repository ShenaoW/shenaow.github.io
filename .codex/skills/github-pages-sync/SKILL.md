---
name: "github-pages-sync"
description: "Use after updating this Jekyll GitHub Pages site when the user asks to sync, publish, push, deploy, or update the changes to GitHub. The workflow verifies the site build, reviews the Git diff, commits the intended changes, and pushes only to origin."
---

# GitHub Pages Sync

Use this skill when the user asks to sync the latest site updates to GitHub after editing `shenaow.github.io`.

## Scope

This skill is for this repository:

- Repository: `shenaow.github.io`
- Primary remote: `origin`
- Expected push target: `origin HEAD`
- Do not push to `upstream`.

## Workflow

1. Confirm the current directory is the repository root.

```bash
git rev-parse --show-toplevel
git remote -v
```

2. Inspect the working tree before staging anything.

```bash
git status --short
git diff --stat
git diff --check
```

Stop and ask the user if there are unexpected sensitive files, unrelated large files, credential files, or changes that clearly do not belong to the site update.

3. Verify the site builds successfully.

```bash
bundle exec jekyll build
```

Do not commit or push if the build fails. Fix the issue first if it is in scope; otherwise report the blocker.

4. Review the diff at a practical level.

```bash
git diff -- _config.yml _data _includes _pages assets images files
```

For large diffs, use targeted `git diff --stat` and inspect key files rather than dumping everything.

5. Stage the intended site changes.

```bash
git add -A
git status --short
```

If generated output such as `_site/` appears staged unexpectedly, verify whether it is intended before committing.

6. Create a concise Conventional Commit.

Use the user's requested commit message if provided. If the user does not provide one, use a Conventional Commit-style message:

- Prefer `content:` for homepage data/content updates, publications, news, honors, grants, and profile text.
- Use `fix:` for broken rendering, build errors, incorrect links, or visible site regressions.
- Use `style:` for CSS-only visual adjustments that do not change content.
- Use `docs:` for documentation or Codex skill updates.
- Use `chore:` for maintenance that does not fit the above.

Keep the subject short, lowercase after the type, and imperative where practical. Good examples:

```bash
git commit -m "content: update homepage publications and news"
git commit -m "fix: restore sidebar visitor map"
git commit -m "docs: clarify github pages sync workflow"
```

7. Push to GitHub.

```bash
git push origin HEAD
```

If network access, authentication, or sandboxing blocks the push, request the narrowest needed escalation and explain that it is required to push the completed site update to GitHub.

8. Report the result.

Include:

- Commit hash.
- Push target.
- Build status.
- Any files intentionally excluded or residual risks.

## Guardrails

- Never run `git reset --hard`, `git checkout --`, or destructive cleanup commands.
- Never amend a commit unless the user explicitly asks.
- Never push to `upstream`.
- Do not skip `bundle exec jekyll build`.
- Do not commit secrets, local environment files, caches, or unrelated work.
- If there are unrelated existing changes, separate them from the intended site update or ask before including them.
