# oxelis-meadow

Plugin hub of [Oxelis](https://github.com/noctide/Oxelis): the official plugins, the signed catalog the application browses, the plugin SDK and templates.

Oxelis is a compact container: screen capture, text layout, editor panels and a plugin host. It contains no translation engine, no OCR or translation model and no network client of its own. These capabilities are provided by plugins, which are installed by the user from this repository or from their authors. Models and programs that belong to others are never bundled with Oxelis; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Trust levels

| | Official | Community |
|---|---|---|
| Source | [`official/`](official) in this repository | [`community/`](community), submitted by their authors |
| Maintained by | the Oxelis project | their authors |
| Installed into | `plugins/official/<id>/` | `plugins/community/<id>/` |
| Activation | enabled on installation | disabled until the user reviews and confirms its permissions in the plugin manager |

The folder determines the trust level; a plugin cannot declare itself official.

## Official plugins

| id | Purpose | Requirements |
|---|---|---|
| [`paddleocr`](official/paddleocr) | Model pack for accurate text recognition (PaddleOCR) | model files, obtained with `tools/fetch-ocr-assets.py` |
| [`translate-google`](official/translate-google) | Google Translate public web endpoint (unofficial) | none |
| [`translate-mymemory`](official/translate-mymemory) | MyMemory public API | none |
| [`translate-deepl`](official/translate-deepl) | DeepL API | API key |
| [`translate-openai`](official/translate-openai) | Any OpenAI-compatible chat API, including local servers | API address, optionally a key |
| [`translate-libre`](official/translate-libre) | LibreTranslate server operated by the user | a running server |
| [`translate-mtran`](official/translate-mtran) | MTranServer, offline | a running server |
| [`translate-hymt2`](official/translate-hymt2) | Hy-MT2 served by llama.cpp, vLLM or Ollama | a running server and the model |
| [`mcp-server`](official/mcp-server) | Switch and settings for the MCP bridge | none |
| [`text-tools`](official/text-tools) | Buttons for recognized text | none |
| [`selection-stats`](official/selection-stats) | Statistics panel | none |
| [`theme-amber`](official/theme-amber) | Example theme and layout | none |

## Installation

1. Open the plugin manager from the tray menu and choose **Browse online**. The catalog is verified against the publisher's signature, and every archive is verified against its checksum before it is installed.
2. Alternatively, copy a plugin folder into `plugins/official/` or `plugins/community/` next to `oxelis-worker.exe`.
3. Settings such as API keys are entered in the plugin manager. They are stored in `plugins/data/<id>.json`; values declared with `secret: true` are encrypted for the current Windows account.

The translator is selected with the environment variable `OXELIS_TRANSLATE_ENGINE` (for example `deepl`). Without it, translators that need no key are preferred.

## Writing a plugin

* [`docs/plugin-api.md`](docs/plugin-api.md): the API reference.
* [`sdk/oxelis.d.ts`](sdk/oxelis.d.ts): TypeScript declarations.
* [`llms.txt`](llms.txt): a condensed reference intended for AI assistants.
* [`templates/hello-translate`](templates/hello-translate) and [`templates/hello-ml`](templates/hello-ml): starting points.

A plugin is a folder containing `manifest.json` and, in most cases, `main.js`. Each plugin runs in its own QuickJS sandbox with a memory limit of 48 MB and a time limit of 60 seconds per call. Network access is restricted to the hosts named in the manifest, over https (plain http is accepted only for `localhost` and `127.0.0.1`).

## Attribution

A plugin that uses a service, a model or a program made by others must name them in its manifest (`credits`), spelled as their owners spell them. See [docs/plugin-api.md](docs/plugin-api.md#credits). Models of others are not stored in this repository.

## Publishing a community plugin

Submit a pull request that adds the plugin folder under [`community/`](community). After review, the maintainers include it in the signed catalog.

## Catalog and signature

`index.json` is the signed catalog and `dist/` contains the archives it refers to. Both are generated and must not be edited by hand:

```
cargo run --release -p oxelis-plugins --features tool --bin oxelis-sign -- index . https://raw.githubusercontent.com/noctide/oxelis-meadow/main/dist <secret-key-file>
```

The application accepts only a catalog signed with the key it contains, and installs only archives whose SHA-256 matches the signed entry.
