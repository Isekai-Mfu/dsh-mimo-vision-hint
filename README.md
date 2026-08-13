# dsh-mimo-vision-hint

零依赖 DSH 提示插件。效果：向模型系统提示（systemPrompt）注册一段说明，指导模型在识图任务时派出 opencode-go 的 mimo-v2.5 作为识图子代理（workflow 单代理 + provider/model 覆盖），而不是自己直接用 `read_image` 看图；workflow 调用失败时回退为直接使用 `read_image`。

本插件**只注入提示文本**：不注册任何模型工具，也不提供任何 cordis 服务，因此在 agent 组合中挂载时无需 isolate realm。

## 安装

本包是一个 DSH **profile bundle**（manifest 声明了 `dsh.bundle`，自带挂载层），用官方插件命令一条命令装完即用，**无需手改任何 YAML**：

```sh
# 从 npm 安装（发布后）
dsh plugin --profile web add dsh-mimo-vision-hint

# 或直接从 GitHub 安装
dsh plugin --profile web add github:Isekai-Mfu/dsh-mimo-vision-hint
```

`dsh plugin` 会把包装进 profile 的 `node_modules`、记录依赖，并自动把本包的 bundle 层（[`cordis.patch.yml`](cordis.patch.yml)，内容为一条 `insert`）加入 `dsh.profile.bundles` 组合栈——插件随即挂载在 host 层，对部署内所有 agent 预设的新会话生效。

需要本机 PATH 上有 `pnpm`（`dsh plugin` 是它的转发器）。卸载同样一条命令，依赖移除后 bundle 层自动退出组合栈：

```sh
dsh plugin --profile web remove dsh-mimo-vision-hint
```

### 手动安装（不想用 pnpm 时）

1. 把本包放到 profile 能解析的位置（如 `$DSH_HOME/profiles/web/node_modules/dsh-mimo-vision-hint`）。
2. 在 profile 的用户补丁层（`$DSH_HOME/profiles/web/cordis.patch.yml`）加一段 insert：

```yaml
- insert:
    - id: mimo-vision
      name: dsh-mimo-vision-hint
```

3. 保存即生效（热重载）；停用就把这段删掉。

## 说明

无其他依赖，无配置项。提示文本对所有新会话常驻注入；识图子代理的 provider（`opencode-go`）和模型（`mimo-v2.5`）目前为硬编码，如需变更请直接修改 `lib/index.js` 中的 `SECTION`。注意：不含 workflow 工具的预设（如极简模式）无法照提示派出子代理，模型会按提示回退为直接使用 `read_image`。

## License

[MIT](LICENSE)
