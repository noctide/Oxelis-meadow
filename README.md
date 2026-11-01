# oxelis-meadow

The plugin hub of [Oxelis](https://github.com/noctide/oxelis): official plugins, the index of community plugins, the plugin SDK and templates.

Oxelis itself is a small container (screen capture, layout, panels, a plugin host). It has no translation engine, no OCR model other than what you choose, and no network code. Everything else is a plugin that lives here or in someone's own repository.

## Two kinds of plugins

| | Official | Community |
|---|---|---|
| Where | [`official/`](official) in this repository | their own repositories, listed in [`community/index.json`](community/index.json) |
| Maintained by | the Oxelis project | their authors |
| Installed into | `plugins/official/<id>/` | `plugins/community/<id>/` |
| Starts | by itself | only after you list its id in `plugins/enabled.txt` (this is where you confirm its permissions) |

The folder decides the trust level; a plugin cannot declare itself official.

## Official plugins

| id | what | needs |
|---|---|---|
| [`translate-google`](official/translate-google) | Google's public web endpoint (unofficial, may be throttled) | nothing |
| [`translate-mymemory`](official/translate-mymemory) | MyMemory translation memory, about 5000 characters a day | nothing |
| [`translate-deepl`](official/translate-deepl) | DeepL API | API key |
| [`translate-openai`](official/translate-openai) | any OpenAI-compatible chat API (OpenAI, DeepSeek, a local server) | API address and key |

## Install

1. Copy the plugin folder into `plugins/official/` (or `plugins/community/`) next to `oxelis-worker.exe`.
2. Community and dev plugins: add the plugin's id to `plugins/enabled.txt`.
3. Settings such as API keys: `plugins/data/<id>.json`, an object of strings, for example `{ "api_key": "..." }`.
4. Nothing needs restarting. Plugins are read every time you press `T` (translate).

Choose the translator with the environment variable `OXELIS_TRANSLATE_ENGINE` (the translator id, for example `deepl`). Without it, translators that need no key come first.

## Write a plugin

* [`docs/plugin-api.md`](docs/plugin-api.md) is the API, with what works today marked.
* [`sdk/oxelis.d.ts`](sdk/oxelis.d.ts) holds the TypeScript types.
* [`llms.txt`](llms.txt) is the same information in a form meant for AI assistants.
* [`templates/hello-translate`](templates/hello-translate) is a plugin to copy.

A plugin is a folder with a `manifest.json` and a `main.js`. Each plugin runs in its own sandbox (QuickJS): 48 MB of memory, 60 seconds per call, only `https://`, only the hosts its manifest names.

## Publish a community plugin

Put your plugin in its own repository (the files at the top level, or in a folder named like the id), give the repository the GitHub topic `oxelis-plugin`, then open a pull request that adds an entry to [`community/index.json`](community/index.json).


## Catalog and signing

`index.json` is the signed list the app's plugin manager browses (「在线浏览…」). `dist/` holds the archives it points to.
Both are generated, do not edit them by hand:

```
cargo run --release -p oxelis-plugins --features tool --bin oxelis-sign -- index . https://raw.githubusercontent.com/noctide/oxelis-meadow/main/dist <secret-key-file>
```

The app only trusts an index signed with the key compiled into it, and only installs an archive whose SHA-256 matches the signed entry.
