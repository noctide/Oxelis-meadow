// DeepL API v2. https://developers.deepl.com/docs/api-reference/translate
// DeepL uses its own language codes: ZH, EN-US, JA ... and takes up to 50 texts per request.
function deeplLanguage(tag) {
  const t = String(tag || '').toUpperCase();
  if (t === 'ZH-TW' || t === 'ZH-HK' || t === 'ZH-HANT') return 'ZH-HANT';
  if (t.startsWith('ZH')) return 'ZH-HANS';
  if (t === 'EN') return 'EN-US';
  if (t === 'PT') return 'PT-BR';
  return t;
}

module.exports = class DeepL {
  onload(oxelis) {
    oxelis.services.translate.register({
      id: 'deepl',
      name: 'DeepL',
      translate(texts, from, to) {
        const key = oxelis.settings.get('api_key');
        if (!key) throw new Error('DeepL: set the API key in the plugin settings');
        const host = oxelis.settings.get('plan') === 'pro' ? 'api.deepl.com' : 'api-free.deepl.com';
        const out = [];
        for (let i = 0; i < texts.length; i += 50) {
          const batch = texts.slice(i, i + 50);
          const body = { text: batch, target_lang: deeplLanguage(to) };
          if (from) body.source_lang = String(from).slice(0, 2).toUpperCase();
          const r = oxelis.http.fetch('https://' + host + '/v2/translate', {
            method: 'POST',
            headers: { Authorization: 'DeepL-Auth-Key ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!r.ok) {
            let why = '';
            try { why = r.json().message || ''; } catch (e) { /* not JSON */ }
            throw new Error('DeepL: HTTP ' + r.status + (r.status === 456 ? ' (quota exceeded)' : '') + (why ? ' ' + why : ''));
          }
          for (const t of r.json().translations) out.push(t.text);
        }
        return out;
      },
    });
  }
};
