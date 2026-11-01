// Buttons appear in the "recognize" group of the editor's toolbar. They work on the text of the last
// recognition: press ocr first, or use them on the result screen of a previous run.
module.exports = {
  onload(oxelis) {
    // runs on every recognition result before it is shown; returning the lines replaces them
    oxelis.on('ocr', (e) => e.lines.map((l) => l.replace(/\s+$/, '')));

    oxelis.ui.addButton({
      id: 'join', group: 'recognize', icon: '¶', tip: '合并为一段并复制',
      run() {
        const t = oxelis.app.text();
        if (!t) return oxelis.app.notify('还没有识别结果');
        oxelis.app.copy(t.split('\n').map((l) => l.trim()).filter(Boolean).join(' '));
        oxelis.app.notify('已合并为一段并复制');
      },
    });
    oxelis.ui.addButton({
      id: 'compact', group: 'recognize', icon: '≡', tip: '去掉空行并复制',
      run() {
        const t = oxelis.app.text();
        if (!t) return oxelis.app.notify('还没有识别结果');
        oxelis.app.copy(t.split('\n').filter((l) => l.trim() !== '').join('\n'));
        oxelis.app.notify('已去掉空行并复制');
      },
    });
  },
};
