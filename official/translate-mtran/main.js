// MTranServer: POST /translate/batch { from, to, texts, html }. Its documentation does not spell out the
// answer, so the reader below accepts the shapes such servers use and says what it got when none fits.
function code(lang) {
  if (!lang || lang === 'auto') return 'auto';
  const l = String(lang).toLowerCase();
  if (l === 'zh' || l === 'zh-cn' || l === 'zh-sg' || l === 'zh-hans') return 'zh-Hans';
  if (l === 'zh-tw' || l === 'zh-hk' || l === 'zh-hant') return 'zh-Hant';
  return l.split('-')[0];
}

function readList(body, count) {
  const candidates = Array.isArray(body) ? [body] : [body.translations, body.results, body.texts, body.result, body.data && body.data.translations, body.data];
  for (const c of candidates) {
    if (!Array.isArray(c) || c.length !== count) continue;
    const out = c.map((x) => (typeof x === 'string' ? x : x && (x.text ?? x.translatedText ?? x.translation)));
    if (out.every((x) => typeof x === 'string')) return out;
  }
  return null;
}

module.exports = class MTranServer {
  onload(oxelis) {
    oxelis.services.translate.register({
      id: 'mtran',
      name: 'MTranServer (local)',
      translate(texts, from, to) {
        const base = String(oxelis.settings.get('base_url') || '').replace(/\/+$/, '');
        if (!/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:\/])/i.test(base + '/')) {
          throw new Error('MTranServer: set the server address (http://localhost:8989) in the plugin settings');
        }
        const headers = { 'Content-Type': 'application/json' };
        const token = oxelis.settings.get('api_token');
        if (token) headers.Authorization = 'Bearer ' + token;
        const configured = oxelis.settings.get('source_lang');
        const r = oxelis.http.fetch(base + '/translate/batch', {
          method: 'POST', headers,
          body: JSON.stringify({ from: code(from || configured), to: code(to), texts, html: false }),
        });
        if (!r.ok) throw new Error('MTranServer: HTTP ' + r.status + ' ' + String(r.text).slice(0, 200));
        let body;
        try { body = r.json(); } catch (e) { throw new Error('MTranServer answered something that is not JSON: ' + String(r.text).slice(0, 200)); }
        const out = readList(body, texts.length);
        if (!out) throw new Error('MTranServer: could not find ' + texts.length + ' translations in the answer: ' + String(r.text).slice(0, 200));
        return out;
      },
    });
  }
};
