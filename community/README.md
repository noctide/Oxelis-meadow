# Community index

`index.json` lists community plugins. An entry:

```json
{
  "id": "translate-example",
  "name": "Example translator",
  "author": "someone",
  "description": "One sentence.",
  "repo": "someone/oxelis-translate-example",
  "kinds": ["translate"],
  "net": ["api.example.com"]
}
```

`net` is a copy of the hosts in the plugin's manifest, so that people can see what a plugin talks to before installing it. The plugin's own repository is the source of truth; an entry that does not match the manifest is removed.
