// Buttons appear in the "recognize" group of the editor's toolbar. They work on the text of the last
// recognition: press ocr first, or use them on the result screen of a previous run.
module.exports = {
  onload(oxelis) {
    // runs on every recognition result before it is shown; returning the lines replaces them
    oxelis.on('ocr', (e) => e.lines.map((l) => l.replace(/\s+$/, '')));

    oxelis.ui.addButton({
      id: 'join', when: 'result', group: 'recognize', icon: '¶', tip: oxelis.t('tools.join.tip'),
      run() {
        const t = oxelis.app.text();
        if (!t) return oxelis.app.notify(oxelis.t('tools.nothing'));
        oxelis.app.copy(t.split('\n').map((l) => l.trim()).filter(Boolean).join(' '));
        oxelis.app.notify(oxelis.t('tools.joined'));
      },
    });
    oxelis.ui.addButton({
      id: 'compact', when: 'result', group: 'recognize', icon: '≡', tip: oxelis.t('tools.compact.tip'),
      run() {
        const t = oxelis.app.text();
        if (!t) return oxelis.app.notify(oxelis.t('tools.nothing'));
        oxelis.app.copy(t.split('\n').filter((l) => l.trim() !== '').join('\n'));
        oxelis.app.notify(oxelis.t('tools.compacted'));
      },
    });
  },
};
