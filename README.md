# dsh-mimo-vision-hint

[English](README.md) | [中文](README.zh.md)

A zero-dependency hint plugin for DeepSeek Harness (DSH). It registers a section in the model's system prompt instructing the agent to dispatch image-recognition tasks to an opencode-go **mimo-v2.5** subagent (a single-agent workflow with provider/model overrides) instead of reading images itself via `read_image`; if the workflow call fails, the agent falls back to `read_image`.

This plugin **only injects prompt text**: it registers no model tools and provides no cordis services, so mounting it in an agent composition needs no isolate realm.

## Prerequisites

- Your DSH deployment has a provider named **`opencode-go`** configured, serving a **`mimo-v2.5`** model — the subagent dispatch targets that provider/model pair.
- The active agent preset includes the **workflow** tool (needed to spawn the subagent).

Without these, the plugin does no harm: the injected prompt tells the agent to fall back to `read_image` directly.

## Installation

This package is a DSH **profile bundle** (its manifest declares `dsh.bundle` and it ships its own mount layer), so the official plugin command installs *and* mounts it in one step — **no hand-edited YAML required**:

```sh
# from npm (once published)
dsh plugin --profile web add dsh-mimo-vision-hint

# or straight from GitHub
dsh plugin --profile web add github:Isekai-Mfu/dsh-mimo-vision-hint
```

`dsh plugin` installs the package into the profile's `node_modules`, records the dependency, and — because this package declares a bundle — automatically appends its layer ([`cordis.patch.yml`](cordis.patch.yml), a single `insert` entry) to the profile's `dsh.profile.bundles` composition stack. The plugin then mounts at the host layer and takes effect for every new session of every agent preset in the deployment.

`pnpm` must be on your PATH (`dsh plugin` forwards to it). Uninstalling is equally one command — once the dependency is gone, the bundle layer leaves the composition stack automatically:

```sh
dsh plugin --profile web remove dsh-mimo-vision-hint
```

### Manual installation (without pnpm)

1. Place this package somewhere the profile can resolve (e.g. `$DSH_HOME/profiles/web/node_modules/dsh-mimo-vision-hint`).
2. Add an insert entry to the profile's user patch layer (`$DSH_HOME/profiles/web/cordis.patch.yml`):

```yaml
- insert:
    - id: mimo-vision
      name: dsh-mimo-vision-hint
```

3. Saving takes effect immediately (hot reload); remove the entry to disable.

## Notes

No other dependencies, no configuration options. The prompt text is injected into every new session; the vision subagent's provider (`opencode-go`) and model (`mimo-v2.5`) are currently hard-coded — edit `SECTION` in `lib/index.js` to change them. Presets without the workflow tool (e.g. minimal mode) cannot dispatch the subagent; the prompt tells the model to fall back to `read_image` in that case.

## License

[MIT](LICENSE)
