# oxelis-meadow

[English](README.md) | **简体中文**

[Oxelis](https://github.com/noctide/Oxelis) 的插件库：官方插件、应用内浏览所用的签名目录、插件 SDK 和模板。

Oxelis 本体是一个小巧的容器：截屏、文字版面还原、编辑器面板和插件宿主。它不内置任何翻译引擎、OCR 或翻译模型，也没有自己的网络客户端。这些能力都由插件提供，由用户从本仓库或插件作者处安装。属于他人的模型和程序从不随 Oxelis 分发，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 信任级别

| | 官方 | 社区 |
|---|---|---|
| 来源 | 本仓库的 [`official/`](official) | [`community/`](community)，由作者提交 |
| 维护者 | Oxelis 项目 | 插件作者 |
| 安装位置 | `plugins/official/<id>/` | `plugins/community/<id>/` |
| 启用 | 安装后直接启用 | 用户在插件管理页查看并确认权限后才启用 |

信任级别由所在文件夹决定，插件不能自称官方。

## 官方插件

| id | 用途 | 需要 |
|---|---|---|
| [`paddleocr`](official/paddleocr) | 精准文字识别的模型包（PaddleOCR） | 模型文件，用 `tools/fetch-ocr-assets.py` 获取 |
| [`translate-mymemory`](official/translate-mymemory) | MyMemory 公共接口 | 无 |
| [`translate-deepl`](official/translate-deepl) | DeepL API | API 密钥 |
| [`translate-openai`](official/translate-openai) | 任意 OpenAI 兼容的对话接口，含本机服务 | 接口地址，可选密钥 |
| [`translate-mtran`](official/translate-mtran) | MTranServer，离线 | 一个运行中的服务 |
| [`mcp-server`](official/mcp-server) | MCP 桥的开关与设置 | 无 |
| [`language-zh-tw`](official/language-zh-tw) | 繁体中文（台湾）界面语言 | 无 |
| [`text-tools`](official/text-tools) | 识别文字的辅助按钮 | 无 |
| [`selection-stats`](official/selection-stats) | 统计面板 | 无 |
| [`theme-amber`](official/theme-amber) | 主题与布局示例 | 无 |

## 安装

1. 在托盘菜单打开插件管理页，选择「在线浏览…」。目录会用发布者的签名验证，每个压缩包在安装前会核对校验和。
2. 也可以把插件文件夹复制到 `oxelis-worker.exe` 旁边的 `plugins/official/` 或 `plugins/community/`。
3. API 密钥等设置在插件管理页里填写，保存在 `plugins/data/<id>.json`；声明了 `secret: true` 的值会用当前 Windows 账户加密。

翻译器用环境变量 `OXELIS_TRANSLATE_ENGINE` 选择（例如 `deepl`）。不设置时，优先使用不需要密钥的翻译器。

## 编写插件

* [`docs/plugin-api.md`](docs/plugin-api.md)：API 参考（英文）。
* [`sdk/oxelis.d.ts`](sdk/oxelis.d.ts)：TypeScript 类型声明。
* [`llms.txt`](llms.txt)：为 AI 助手准备的精简参考。
* [`templates/hello-translate`](templates/hello-translate)、[`templates/hello-ml`](templates/hello-ml)、[`templates/hello-language`](templates/hello-language)：起步模板。

插件是一个文件夹，含 `manifest.json`，通常还有 `main.js`。每个插件在自己的 QuickJS 沙箱里运行，内存上限 48 MB，每次调用最长 60 秒。网络仅限清单里列出的主机，并且只能用 https（只有 `localhost` 和 `127.0.0.1` 可以用普通 http）。

## 署名

使用他人的服务、模型或程序的插件，必须在清单的 `credits` 里按所有者的写法标明它们，见 [docs/plugin-api.md](docs/plugin-api.md#credits)。他人的模型不存放在本仓库里。

## 收录原则

许可条款不明、或带有无法满足全球分发的限制（地域、受众规模、品牌使用）的插件和第三方作品不收录；服务的非官方接口也不收录。每次新增前先核对所有者的许可原文。

## 发布社区插件

提交一个拉取请求，把插件文件夹加到 [`community/`](community) 下。审核通过后，维护者会把它收入签名目录。

## 目录与签名

`index.json` 是签名目录，`dist/` 里是它指向的压缩包。两者都是生成的，不要手工编辑：

```
cargo run --release -p oxelis-plugins --features tool --bin oxelis-sign -- index . https://raw.githubusercontent.com/noctide/oxelis-meadow/main/dist <密钥文件>
```

应用只信任用它内置公钥签名的目录，并且只安装校验和与签名条目一致的压缩包。
