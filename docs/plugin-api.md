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
| `oxelis.on(event, fn)` | registered, no events are sent yet |
| buttons, panels, layouts, themes | planned |

## Limits

48 MB of memory per plugin, 60 seconds per call (network time included). A plugin that exceeds them is stopped and reported; other plugins and the app keep running.

## Translators

`translate(texts, from, to)` gets an array of strings and must return an array of the same length (or a promise of one). `to` is a code like `zh-CN` or `en`. The app cuts the screen text into logical blocks first (a wrapped paragraph is one string, a menu entry is one string, in code only the comments), so every string is a unit of meaning. Text that is already in the target language, shortcuts and symbols are never sent.

## Testing a plugin without the app

The plugin host is the crate `oxelis-plugins` in the Oxelis repository; its tests run plugins against a pretend network. A plugin that parses in Node (`new Function('module', 'exports', 'oxelis', source)`) usually runs in the app, but QuickJS has no `TextEncoder`, `setTimeout` or `fetch`.
