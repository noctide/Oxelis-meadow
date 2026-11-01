# Plugin API (version 0)

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
| `permissions.net` also accepts `localhost` / `127.0.0.1` | `http://` is allowed to this machine only (Ollama, LibreTranslate); every other address must be `https://` |
| `ocr` | a model pack: `{ "engine": "ppocr", "det", "rec", "dict", "runtime" }`, files inside the plugin folder; needs no `main.js` (see `official/ocr-ppocr`) |
| `secret: true` on a setting | stored sealed with Windows DPAPI, bound to the user's account |
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

## What works today

| API | state |
|---|---|
| `oxelis.log` | wired (goes to the console) |
| `oxelis.http.fetch`, `fetchAll` | wired; https only, only declared hosts |
| `oxelis.settings.get` | wired |
| `oxelis.services.translate.register` | wired |
| `oxelis.services.ocr.register` | registered, not called yet |
| `oxelis.commands.add` | registered, not shown anywhere yet |
| `oxelis.ui.addButton`, `addPanel`, `hide` | wired (editor) |
| `oxelis.theme.set`, `oxelis.layout.set` | wired (editor) |
| `oxelis.app.notify/copy/run/text/translation/selection/lines` | wired (editor) |
| `oxelis.on('selection' \| 'ocr' \| 'translated', fn)` | wired (editor) |

## The editor

The editor is the toolbar and the panels around the selection. Plugins that declare `provides` are started when a selection becomes editable (a few milliseconds each) and live until the editor closes. They run on the editor's thread, so keep calls short.

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
- **Requests** (`app.notify/copy/run`) are queued and carried out after your call returns; at most 64 per call. `copy` needs the `clipboard` permission.
- Theme and layout: the last plugin that sets them wins.
- Official examples: `official/text-tools`, `official/selection-stats`, `official/theme-amber`.

## Limits

48 MB of memory per plugin, 60 seconds per call (network time included). A plugin that exceeds them is stopped and reported; other plugins and the app keep running.

## Translators

`translate(texts, from, to)` gets an array of strings and must return an array of the same length (or a promise of one). `to` is a code like `zh-CN` or `en`. The app cuts the screen text into logical blocks first (a wrapped paragraph is one string, a menu entry is one string, in code only the comments), so every string is a unit of meaning. Text that is already in the target language, shortcuts and symbols are never sent.

## Testing a plugin without the app

The plugin host is the crate `oxelis-plugins` in the Oxelis repository; its tests run plugins against a pretend network. A plugin that parses in Node (`new Function('module', 'exports', 'oxelis', source)`) usually runs in the app, but QuickJS has no `TextEncoder`, `setTimeout` or `fetch`.
