/**
 * dsh-mimo-vision-hint —— 零依赖提示插件
 *
 * 效果：向模型系统提示注册一段说明，指导模型在收到识图任务时，
 * 派出 opencode-go 的 mimo-v2.5 作为识图子代理（workflow 单代理 +
 * provider/model 覆盖），而不是自己直接看图。
 *
 * 本插件只注入 systemPrompt 服务、不提供也不注册任何服务或工具，
 * 因此在组合中挂载时无需 isolate realm。
 *
 * 安装（profile 用户补丁层 $DSH_HOME/profiles/web/cordis.patch.yml，host 层
 * 挂载、对所有 agent 预设生效，热重载）：
 *   - insert:
 *       - id: mimo-vision
 *         name: dsh-mimo-vision-hint
 */
const name = "mimo-vision";
const inject = ["systemPrompt"];

const SECTION = [
	"识图任务优先使用 mimo-v2.5 识图子代理：",
	"当用户要求识别图片（“识别这张图 / 目录里的图片”等）时，优先派出 opencode-go 的 mimo-v2.5 作为识图子代理，而不是自己用 read_image 直接看图。",
	"调用方式：使用 workflow 工具的单代理脚本，agent() 的 opts 里指定 provider 和 model，脚本示例：",
	'const report = await agent("请先列出目标目录中的图片文件，再用 read_image 逐一查看，最后用中文汇报每张图片的文件名、内容、主要对象/场景、图中文字、风格色彩。目标: <图片文件或目录路径>", { label: "mimo-v2.5 识图", provider: "opencode-go", model: "mimo-v2.5" });',
	"return { report };",
	"拿到子代理返回后，把识别汇报转述给用户；如果该方式调用失败，再回退为直接使用 read_image。"
].join("\n");

function apply(ctx) {
	ctx.systemPrompt.section({
		name: "mimo-vision",
		// order 118：经验值，排在各内置说明段落之后即可，无严格依赖；
		// 调整时只需保证不与同 preset 其他段落的 order 冲突。
		order: 118,
		text: () => SECTION
	});
}
export { apply, inject, name };
