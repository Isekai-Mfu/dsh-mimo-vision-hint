# AGENTS.md — Maintainer Handoff Notes

> 给后续维护本项目的开发者 / AI agent：本文档记录了仓库结构、DSH 插件机制要点、发布流程、本机环境状态和踩过的坑。读完这份文档即可无缝接手维护。
> For any developer or AI agent picking up this project: this file documents the repo layout, the DSH plugin mechanics that matter, the release workflow, the state of the maintainer's machine, and the pitfalls already hit. Read this before changing anything.

## Project identity

- **Repo**: https://github.com/Isekai-Mfu/dsh-mimo-vision-hint (public, owner: `Isekai-Mfu`)
- **Package name**: `dsh-mimo-vision-hint` (npm, not yet published to the registry)
- **What it is**: a zero-dependency DSH (DeepSeek Harness) hint plugin. It injects one `systemPrompt` section telling the agent to dispatch image-recognition tasks to an `opencode-go` / `mimo-v2.5` subagent (single-agent workflow with provider/model override) instead of calling `read_image` itself, with `read_image` as fallback.
- **License**: MIT, copyright `Isekai-Mfu (https://github.com/Isekai-Mfu)`.

## Repository layout

| File | Role |
|---|---|
| `lib/index.js` | Entire plugin code. Exports `apply`/`inject`/`name`; registers `ctx.systemPrompt.section({ name: "mimo-vision", order: 118 })`. No tools, no services — safe to mount without an isolate realm. |
| `cordis.patch.yml` | The **bundle layer**: one `insert` entry mounting the plugin as `id: mimo-vision`. This is what makes installs one-command. |
| `package.json` | Declares `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }` — the bundle marker `dsh plugin` looks for. `files` must keep listing both `lib` and `cordis.patch.yml`. |
| `README.md` / `README.zh.md` | English (default) / Chinese. **Keep the two in sync**; both carry the `English | 中文` switcher line at the top. |
| `AGENTS.md` | This file. Not shipped to npm (not in `files`). |

## DSH mechanics that matter (verified against DSH source)

- A DSH **profile** (`$DSH_HOME/profiles/<name>`) composes its plugin tree from `dsh.profile.bundles` layers, then the user's `cordis.patch.yml` (hot-reloaded). The Settings → 插件 GUI list is **read-only**; there is no GUI install path.
- `dsh plugin --profile <name> add <pkg>` is a thin pnpm forwarder: it runs `pnpm add` in the profile dir, then **auto-appends any dependency declaring `dsh.bundle` to the bundles list**. `remove` reverses it. Plain (non-bundle) packages stay inert until the user hand-edits an `insert` into `cordis.patch.yml` — that is why this repo is a bundle.
- Install from GitHub without npm publish: `dsh plugin --profile web add github:Isekai-Mfu/dsh-mimo-vision-hint` (needs `pnpm` on PATH).
- The plugin's prompt section uses `order: 118` (after built-in sections); only change it to resolve a conflict. The subagent provider (`opencode-go`) and model (`mimo-v2.5`) are hard-coded in the `SECTION` constant in `lib/index.js`.

## Verifying changes (no pnpm on the maintainer's machine)

`dsh` is on PATH; `pnpm` is **not installed**, so `dsh plugin add` has not been run end-to-end here. Composition was verified instead by simulating the post-install state:

1. Create throwaway profile `$DSH_HOME/profiles/bundletest` with: `package.json` (bundles `["@deepseek-ai/dsh-base", "dsh-mimo-vision-hint"]`, dependency entry), `cordis.patch.yml` = `[]`, `pnpm-workspace.yaml` copied from the `web` profile, and `node_modules/dsh-mimo-vision-hint` = a copy of this repo.
2. Run `dsh --profile bundletest --dump-config` and confirm the output contains the `id: mimo-vision` / `name: dsh-mimo-vision-hint` entry.
3. **Delete the throwaway profile afterwards.**

## Machine / live-install state (maintainer's box)

> Paths below are deliberately written as placeholders — substitute the real values on the maintainer's machine. `$DSH_HOME` defaults to `~/.dsh`; the git working copy lives wherever the maintainer cloned it.

- **Working copy**: the maintainer keeps a local git checkout of this repo; `origin` is the clean URL `https://github.com/Isekai-Mfu/dsh-mimo-vision-hint.git` (no credentials stored in it). Local git identity: `user.name=Isekai-Mfu`, `user.email=Isekai-Mfu@users.noreply.github.com` (GitHub noreply — keep it, it hides the real email).
- **Live DSH install** on the maintainer's box still uses the pre-bundle manual method: a package copy under `$DSH_HOME/profiles/node_modules/dsh-mimo-vision-hint` (code is v0.2.1-era but functionally identical) plus a hand-written `insert` block in the `web` profile's `cordis.patch.yml`. **If the plugin code changes, sync that copy or the live deployment drifts.** (Cleaner: migrate the live install to `dsh plugin --profile web add` once pnpm is available, and remove the manual copy + insert.)
- **No GitHub credentials are stored on the machine.** Previous sessions authenticated per-push via the OAuth device flow (see below) and deleted the token afterwards.

## GitHub auth for pushes/releases (no stored creds)

Use the OAuth **device flow** with the GitHub CLI's public client id — the user only types a code at https://github.com/login/device:

1. `POST https://github.com/login/device/code` with `client_id=178c6fc778ccc68e1d6a`, `scope=public_repo` → show `user_code` to the user.
2. Poll `POST https://github.com/login/oauth/access_token` (`grant_type=urn:ietf:params:oauth:grant-type:device_code`) every ~6 s until `access_token` appears (code expires in ~15 min).
3. Push with a one-off credentialed URL: `git push https://x-access-token:TOKEN@github.com/Isekai-Mfu/dsh-mimo-vision-hint.git main --tags`. **Never** store the token in `git remote`.
4. Releases: `POST /repos/Isekai-Mfu/dsh-mimo-vision-hint/releases` with `Authorization: Bearer TOKEN`.
5. Delete temp token files (`%TEMP%\dsh_gh_token.txt`, `%TEMP%\dsh_device_code.txt`) when done.

## Release workflow (follow it for every version)

1. Make changes; bump `version` in `package.json` (semver).
2. Update **both** READMEs if behavior or install steps changed.
3. `git add -A && git commit -m "vX.Y.Z: <summary>"`.
4. Annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z - <title>"`.
5. Push `main` and tags, then create the GitHub Release with bilingual notes (中文 + English summary). Docs-only changes may skip tag/release at maintainer discretion.

## Pitfalls already hit (Windows PowerShell)

- **BOM kills DSH**: `Out-File -Encoding utf8` writes a BOM; DSH's `JSON.parse` then fails on profile manifests. Write JSON with `[System.IO.File]::WriteAllText($p, $s, [System.Text.UTF8Encoding]::new($false))`.
- **CJK mangling in GitHub API**: `Invoke-RestMethod -Body $jsonString` garbles Chinese in release names/bodies. Send bytes instead: `[System.Text.Encoding]::UTF8.GetBytes($json)` with `-ContentType "application/json; charset=utf-8"`. (v0.2.1/v0.3.0 releases had to be re-PATCHed because of this.)
- **git stderr noise**: git writes progress to stderr; PowerShell surfaces it as `NativeCommandError`. If the output shows `main -> main` / `[new tag]`, the push succeeded.
- `$DSH_HOME/profiles/node_modules` is DSH's maintained symlink fallback for built-in packages — do **not** treat it as the documented install location in user-facing docs (README points at `dsh plugin add` + profile `node_modules`).

## Current state

- Latest: **v0.3.1** (tag + GitHub Release, marked Latest). History: v0.2.1 (initial, manual-insert install) → v0.3.0 (bundle conversion) → v0.3.1 (bilingual README).
- Open ideas: publish to npm (enables the shorter install command); migrate the maintainer's own live install to the bundle path; make provider/model configurable via plugin config instead of editing `SECTION`.
