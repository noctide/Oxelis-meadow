module.exports = {
  onload(oxelis) {
    oxelis.ui.addPanel({
      id: 'stats', when: 'result', title: oxelis.t('stats.title'), icon: 'Σ', group: 'recognize', anchor: 'right',
      render(sel) {
        const out = [oxelis.t('stats.area', sel.w, sel.h)];
        const text = oxelis.app.text();
        if (text == null) return out.concat(oxelis.t('stats.after'));
        const lines = text.split('\n').filter((l) => l.trim() !== '').length;
        const words = (text.match(/[A-Za-z0-9_]+|[一-鿿]/g) || []).length;
        return out.concat(oxelis.t('stats.lines', lines), oxelis.t('stats.words', words), oxelis.t('stats.chars', [...text.replace(/\s/g, '')].length));
      },
    });
  },
};
