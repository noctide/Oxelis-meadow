// MyMemory (https://mymemory.translated.net): the service takes at most 500 bytes of text per request.
const MAX_BYTES = 450;

// UTF-8 length of a string (QuickJS has no TextEncoder)
function byteLength(s) {
  let n = 0;
  for (const c of s) { const p = c.codePointAt(0); n += p < 0x80 ? 1 : p < 0x800 ? 2 : p < 0x10000 ? 3 : 4; }
  return n;
}

function chunk(text) {
  if (byteLength(text) <= MAX_BYTES) return [text];
  const pieces = [];
  let cur = '', brk = -1;
  for (const c of text) {
    if (byteLength(cur + c) > MAX_BYTES) {
      const cut = brk > 0 ? brk : cur.length;
      pieces.push(cur.slice(0, cut).trim());
      cur = cur.slice(cut).trimStart();
      brk = -1;
    }
    cur += c;
    if ('.。!?！？;；'.includes(c) || (c === ' ' && brk < 0)) brk = cur.length;
  }
  if (cur.trim()) pieces.push(cur.trim());
  return pieces;
}

module.exports = class MyMemory {
  onload(oxelis) {
    oxelis.services.translate.register({
      id: 'mymemory',
      name: 'MyMemory',
      translate(texts, from, to) {
        const jobs = [];
        texts.forEach((t, i) => chunk(t).forEach(piece => jobs.push({ i, piece })));
        const answers = oxelis.http.fetchAll(jobs.map(j => ({
          url: 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(j.piece) +
            '&langpair=' + encodeURIComponent(from || 'Autodetect') + '%7C' + encodeURIComponent(to),
        })));
        const out = texts.map(() => '');
        answers.forEach((a, k) => {
          if (a.error) throw new Error(a.error);
          const v = a.json();
          const status = Number(v.responseStatus || a.status);
          const text = v.responseData && v.responseData.translatedText;
          if (status !== 200 || !text) throw new Error('mymemory: ' + status + ' ' + (v.responseDetails || text || ''));
          const i = jobs[k].i;
          out[i] = out[i] ? out[i] + ' ' + text : text;
        });
        return out;
      },
    });
  }
};
