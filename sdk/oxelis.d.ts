// Types of the `oxelis` object that every plugin receives. API version 0.
// "implemented" means available in the application today; "planned" means declared so that plugins can be written in advance.

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
  log(...args: any[]): void;         // Implemented

  http: {
    // Implemented. Blocking. Throws on permission errors and network failures; a 4xx/5xx answer is returned (ok = false).
    fetch(url: string, init?: Omit<OxelisRequest, 'url'>): OxelisResponse;
    // Implemented. Up to four requests at the same time. A failed request is { error } instead of throwing.
    fetchAll(requests: OxelisRequest[]): Array<OxelisResponse | { error: string }>;
  };

  settings: {
    get(key: string): string | null; // Implemented. Values come from plugins/data/<id>.json, defaults from the manifest.
  };

  services: {
    translate: {
      // Implemented
      register(def: {
        id: string;
        name?: string;
        translate(texts: string[], from: string | null, to: string): string[] | Promise<string[]>;
      }): void;
    };
    ocr: {
      // Planned: registered, not yet invoked by the application
      register(def: { id: string; name?: string; recognize(image: unknown): unknown }): void;
    };
  };

  commands: {
    // Planned: registered and callable by the host; no command palette or hotkey yet
    add(def: { id: string; name?: string; run(args?: any): any }): void;
  };

  ml: {
    // Implemented. Needs "permissions": { "ml": true }. The model is an .onnx file inside the plugin folder (at most 8 per plugin).
    load(path: string): {
      inputs: string[];
      outputs: string[];
      run(feeds: Record<string, OxelisTensor>, wanted?: string[]): Record<string, OxelisTensor>;
    };
  };

  ui: {
    // Implemented. A button in the editor's toolbar, at the end of its group. `icon` is one or two characters.
    // The manifest must list "buttons" in `provides`, or the plugin is not started in the editor.
    addButton(def: {
      id: string;
      group?: 'draw' | 'history' | 'local' | 'recognize' | 'output';
      icon: string;
      tip?: string;
      run(selection: Selection): void | Promise<void>;
    }): void;
    // Implemented. A text panel next to the selection (or under the toolbar with anchor 'bottom'); it gets a toolbar
    // button that switches it on and off. render() returns the lines; it runs again after recognition,
    // translation, a button press and when the selection was resized.
    addPanel(def: {
      id: string;
      title?: string;
      icon?: string;
      group?: 'draw' | 'history' | 'local' | 'recognize' | 'output';
      anchor?: 'right' | 'bottom';
      render(selection: Selection): string[] | Promise<string[]>;
    }): void;
    // Implemented. Built-in buttons to remove ('eraser', 'star'...). 'cancel' and 'translate' stay.
    hide(ids: string[]): void;
  };

  theme: {
    // Implemented. Colours as '#rrggbb'. The last call wins.
    set(theme: { accent?: string; bar?: string }): void;
  };

  layout: {
    // Implemented. barPosition 'top': the toolbar is placed above the selection when space permits.
    set(layout: { barPosition?: 'top' | 'bottom' }): void;
  };

  // What the editor shows now, and what a plugin may ask it to do. Requests are carried out after the plugin call returns.
  app: {
    notify(text: string): void;
    copy(text: string): void; // needs "permissions": { "clipboard": true }
    run(action: 'copy_image' | 'save' | 'pin' | 'ocr' | 'translate' | 'cancel'): void;
    text(): string | null; // recognised text, lines joined with \n; null before recognition
    translation(): string | null;
    selection(): Selection | null;
    lines(): string[] | null;
  };

  // Implemented events:
  //   'selection'  { x, y, w, h, lines, translation }  the selection became editable
  //   'ocr'        { lines, source: 'fast' | 'accurate' }  recognition finished; return the new array of lines to replace them
  //   'translated' { x, y, w, h, lines, translation }  a translation arrived
  on(event: string, handler: (payload: any) => any | Promise<any>): void;
}

interface OxelisTensor { dtype?: 'float32' | 'int64' | 'int32' | 'uint8' | 'bool'; shape: number[]; data: number[] }

interface Selection { x: number; y: number; w: number; h: number }

declare const oxelis: Oxelis;

// A plugin file is CommonJS: assign a class or an object with onload(oxelis) / onunload().
declare const module: { exports: any };
