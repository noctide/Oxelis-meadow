// Translation with a chat model. The texts go out as a JSON array and must come back as a JSON array
// of the same length, so that a block of the screen maps to exactly one translation.
const SYSTEM = (to) =>
  'You translate text captured from a computer screen into ' + to + '. ' +
  'The user sends a JSON array of strings. Reply with ONLY a JSON array of the same length: element i is the translation of element i. ' +
  'Keep code identifiers, numbers, URLs, keyboard shortcuts and placeholders unchanged. Do not explain.';

// models like to wrap JSON in a code fence
function parseArray(text) {
  let t = String(text).trim();
  const fence = t.match(/^```[a-z]*\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1];
  const start = t.indexOf('['), end = t.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error('the model did not answer with a JSON array');
  return JSON.parse(t.slice(start, end + 1));
}

module.exports = class OpenAiCompatible {
  onload(oxelis) {
    oxelis.services.translate.register({
      id: 'llm',
      name: 'LLM (OpenAI-compatible)',
      translate(texts, from, to) {
        const base = String(oxelis.settings.get('base_url') || '').replace(/\/+$/, '');
        const key = oxelis.settings.get('api_key');
        if (!base.startsWith('https://')) throw new Error('LLM: set an https:// API address in the plugin settings');
        const headers = { 'Content-Type': 'application/json' };
        if (key) headers.Authorization = 'Bearer ' + key;
        const r = oxelis.http.fetch(base + '/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: oxelis.settings.get('model') || 'deepseek-chat',
            temperature: 0,
            messages: [{ role: 'system', content: SYSTEM(to) }, { role: 'user', content: JSON.stringify(texts) }],
          }),
        });
        if (!r.ok) {
          let why = '';
          try { why = (r.json().error || {}).message || ''; } catch (e) { /* not JSON */ }
          throw new Error('LLM: HTTP ' + r.status + (why ? ' ' + why : ''));
        }
        const content = r.json().choices[0].message.content;
        const out = parseArray(content).map(x => (typeof x === 'string' ? x : String(x)));
        if (out.length !== texts.length) throw new Error('the model returned ' + out.length + ' translations for ' + texts.length + ' texts');
        return out;
      },
    });
  }
};
