// Types of the `oxelis` object that every plugin receives. API version 0.
// Marked "wired" = works in the app today; "planned" = declared here so that plugins can be written ahead.

interface OxelisResponse {
  status: number;
  ok: boolean;
  text: string;
  json(): any;
}

interface OxelisRequest {
  url: string;                       // https:// only, host must be in manifest permissions.net (or netFromSettings)
  method?: string;                   // default GET
  headers?: Record<string, string>;
  body?: string;
}

interface Oxelis {
  log(...args: any[]): void;         // wired

  http: {
    // wired. Blocking. Throws on permission errors and network failures; a 4xx/5xx answer is returned (ok = false).
    fetch(url: string, init?: Omit<OxelisRequest, 'url'>): OxelisResponse;
    // wired. Up to four requests at the same time. A failed request is { error } instead of throwing.
    fetchAll(requests: OxelisRequest[]): Array<OxelisResponse | { error: string }>;
  };

  settings: {
    get(key: string): string | null; // wired. Values come from plugins/data/<id>.json, defaults from the manifest.
  };

  services: {
    translate: {
      // wired
      register(def: {
        id: string;
        name?: string;
        translate(texts: string[], from: string | null, to: string): string[] | Promise<string[]>;
      }): void;
    };
    ocr: {
      // planned: registered, not called yet
      register(def: { id: string; name?: string; recognize(image: unknown): unknown }): void;
    };
  };

  commands: {
    // planned: registered and callable by the host, no palette or hotkey yet
    add(def: { id: string; name?: string; run(args?: any): any }): void;
  };

  // planned: events 'capture', 'ocr', 'translated'. Handlers can already be registered.
  on(event: string, handler: (payload: any) => void | Promise<void>): void;
}

declare const oxelis: Oxelis;

// A plugin file is CommonJS: assign a class or an object with onload(oxelis) / onunload().
declare const module: { exports: any };
