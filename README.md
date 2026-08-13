# dsh-mimo-vision-hint

零依赖 DSH 提示插件。效果：向模型系统提示（systemPrompt）注册一段说明，指导模型在识图任务时派出 opencode-go 的 mimo-v2.5 作为识图子代理（workflow 单代理 + provider/model 覆盖），而不是自己直接用 `read_image` 看图；workflow 调用失败时回退为直接使用 `read_image`。

本插件**只注入提示文本**：不注册任何模型工具，也不提供任何 cordis 服务，因此在 agent 组合中挂载时无需 isolate realm。

## 安装

本插件挂载在 **profile 用户补丁层**（host 层），对部署内所有 agent 预设的会话生效，无需为此创建专用预设。

1. 把本包放到 DSH 能解析的位置（如 `$DSH_HOME/profiles/node_modules/dsh-mimo-vision-hint`）。
2. 在 profile 的用户补丁层（如 `$DSH_HOME/profiles/web/cordis.patch.yml`，所有 bundle 层之后应用，热重载）加一段 insert：

```yaml
- insert:
    - id: mimo-vision
      name: dsh-mimo-vision-hint
```

3. 保存即生效（新会话注入该提示）；停用就把这段从补丁层删掉。

无其他依赖，无配置项。提示文本对所有新会话常驻注入；识图子代理的 provider（`opencode-go`）和模型（`mimo-v2.5`）目前为硬编码，如需变更请直接修改 `lib/index.js` 中的 `SECTION`。注意：不含 workflow 工具的预设（如极简模式）无法照提示派出子代理，模型会按提示回退为直接使用 `read_image`。
