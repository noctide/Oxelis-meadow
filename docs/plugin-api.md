# Plugin API reference

A plugin is a folder:

```
my-plugin/
  manifest.json
  main.js
```

## manifest.json

| key | meaning |
|---|---|
| `id` | 2–64 characters of `a-z 0-9 . - _`. Must equal the folder name. |
| `name`, `author`, `description` | shown to the user |
| `version` | `1.2.3` |
| `minAppVersion` | optional |
| `main` | script, default `main.js`; a path inside the folder |
| `permissions.net` | host names the plugin may contact over https: `api.deepl.com`, `*.example.com` (subdomains only) |
| `permissions.netFromSettings` | names of settings whose value is an https address the plugin may contact (for "any OpenAI-compatible server") |
| `settings` | `[{ "key", "label", "secret", "default" }]` |
| `provides` | what the plugin adds to the editor: `buttons`, `panels`, `theme`, `layout`, `events`. **A plugin that adds to the editor must list something here**, otherwise it is only started for translation. Shown in the plugin manager. |
| `permissions.net` also accepts `localhost` / `127.0.0.1` | `http://` is allowed to this machine only (for example Ollama or MTranServer); every other address must be `https://` |
| `ocr` | a model pack: `{ "engine": "ppocr", "det", "rec", "dict", "runtime" }`, files inside the plugin folder; needs no `main.js` (see `official/paddleocr`) |
| `secret: true` on a setting | stored sealed with Windows DPAPI, bound to the user's account |
| `permissions.ml` | `true` lets the plugin load and run `.onnx` models from its own folder (`oxelis.ml`, see `templates/hello-ml`) |
| `language` | an interface language pack: `{ "code": "ja", "name": "日本語", "strings": "ja.lang" }`; needs no `main.js` and no permissions (see `templates/hello-language`) |
| `permissions.clipboard` | `true` lets `oxelis.app.copy` put text on the clipboard |

## main.js

CommonJS. Export a class or an object with `onload(oxelis)`; `onload` may be async. The plugin sees one global, `oxelis`; there is no `require`, no file system, no timers, no `fetch`, no `TextEncoder`.

```js
module.exports = class Hello {
  onload(oxelis) {
    oxelis.services.translate.register({
      id: 'hello', name: 'Hello',
      translate(texts, from, to) { return texts.map(t => '[' + to + '] ' + t); },
    });
  }
};
```

## API status

| API | Status |
|---|---|
| `oxelis.log` | implemented; writes to the console |
| `oxelis.http.fetch`, `fetchAll` | implemented; https only (plain http to localhost), declared hosts only |
| `oxelis.settings.get` | implemented |
| `oxelis.services.translate.register` | implemented |
| `oxelis.services.ocr.register` | registration only; not yet invoked by the application |
| `oxelis.commands.add` | registration only; not yet exposed in the interface |
| `oxelis.ui.addButton`, `addPanel`, `hide` | implemented (editor) |
| `oxelis.theme.set`, `oxelis.layout.set` | implemented (editor) |
| `oxelis.app.notify/copy/run/text/translation/selection/lines` | implemented (editor) |
| `oxelis.on('selection' \| 'ocr' \| 'translated', fn)` | implemented (editor) |

## The editor

The editor is the toolbar and the panels around the selection. Plugins that declare `provides` are started when a selection becomes editable (a few milliseconds each) and remain loaded until the editor closes. They run on the editor's thread; calls should therefore be short.

```js
module.exports = {
  onload(oxelis) {
    oxelis.ui.addButton({
      id: 'upper', group: 'recognize', icon: 'Aa', tip: 'Copy as UPPERCASE',
      run(sel) { oxelis.app.copy((oxelis.app.text() || '').toUpperCase()); oxelis.app.notify('copied'); },
    });
    oxelis.on('ocr', e => e.lines.map(l => l.replace(/\s+$/, '')));   // fix text before it is shown
    oxelis.theme.set({ accent: '#ffb300' });
  },
};
```

- **Buttons** join the end of their group (`draw`, `history`, `local`, `recognize`, `output`). `run` gets the selection `{x, y, w, h}`.
- **Panels** are text boxes; the user switches them on with their toolbar button. `render` returns an array of lines.
- **`oxelis.ui.hide([...])`** removes built-in buttons; `cancel` and `translate` cannot be hidden.
- **Events**: a handler of `ocr` receives `{ lines, source }` and may return a new array of lines. Handlers run in plugin order; each sees the previous result.
- **Requests** (`app.notify/copy/run`) are queued and carried out after the plugin call returns; at most 64 per call. `copy` needs the `clipboard` permission.
- Theme and layout: the last plugin that sets them wins.
- Official examples: `official/text-tools`, `official/selection-stats`, `official/theme-amber`.

## Limits

48 MB of memory per plugin, 60 seconds per call (network time included). A plugin that exceeds them is stopped and reported; other plugins and the app keep running.

## Translators

`translate(texts, from, to)` gets an array of strings and must return an array of the same length (or a promise of one). `to` is a code like `zh-CN` or `en`. The app cuts the screen text into logical blocks first (a wrapped paragraph is one string, a menu entry is one string, in code only the comments), so every string is a unit of meaning. Text that is already in the target language, shortcuts and symbols are never sent.

## Testing a plugin without the app

The plugin host is the crate `oxelis-plugins` in the Oxelis repository; its tests run plugins against a pretend network. A plugin that loads in Node.js (`new Function('module', 'exports', 'oxelis', source)`) generally runs in the application as well, with the exception that QuickJS provides no `TextEncoder`, `setTimeout` or `fetch`.

## MCP

`official/mcp-server` is the switch for the MCP bridge (`oxelis-host.exe`). It has no logic: while it is installed and enabled, AI assistants may use the tools listed in its `allowed_tools` setting (`read_screen_text`, `translate_text`, `screenshot`; the last is off by default). `provides: ["mcp"]` marks such plugins.

## Models (`oxelis.ml`)

```js
const model = oxelis.ml.load('models/encoder.onnx');          // inside the plugin folder; permissions.ml required
const out = model.run({ input_ids: { dtype: 'int64', shape: [1, 4], data: [5, 9, 2, 0] } }, ['last_hidden_state']);
out.last_hidden_state.shape; out.last_hidden_state.data;       // flat numbers
```

The host runs the model with ONNX Runtime on the CPU. Tensors are exchanged as JSON; outputs should therefore be limited to a few tens of thousands of values per call. This interface allows a translation or OCR engine to be delivered entirely as a plugin; tokenizers and search loops are written in JavaScript.

## Credits

A plugin that uses a service, runs a model or includes a program made by others must name them in its manifest, using the name its owner uses:

```json
"credits": [
  { "name": "MTranServer", "by": "xxnuo", "license": "Apache-2.0", "url": "https://github.com/xxnuo/MTranServer" }
]
```

Names must be written exactly as their owners write them. If the license cannot be determined, the entry states that instead of assuming one. The plugin manager displays these entries, and `oxelis-sign` declines to list a plugin that declares `net`, `netFromSettings`, `ml` or `ocr` without credits. Models and programs of others are not stored in the plugin repository: a plugin refers to them, and the user obtains them from their owners.

## Interface languages

A language pack is a plugin whose manifest has a `language` entry and whose folder holds a catalog file. Start from `templates/hello-language`: it is the English catalog, with one entry per line (`key = value`). Translate the values only. `\n` is a line break, `\s` a space, and `{0}`, `{1}` are filled in by the program and must be kept. The language is chosen from the Windows language (or `OXELIS_LANG`); a key the pack lacks is shown in English.
