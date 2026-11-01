module.exports = {
  onload(oxelis) {
    oxelis.ui.addPanel({
      id: 'stats', title: '统计', icon: 'Σ', group: 'recognize', anchor: 'right',
      render(sel) {
        const out = [`区域  ${sel.w} × ${sel.h}`];
        const text = oxelis.app.text();
        if (text == null) return out.concat('识别后显示行数和字数');
        const lines = text.split('\n').filter((l) => l.trim() !== '').length;
        const words = (text.match(/[A-Za-z0-9_]+|[一-鿿]/g) || []).length;
        return out.concat(`行  ${lines}`, `词/字  ${words}`, `字符  ${[...text.replace(/\s/g, '')].length}`);
      },
    });
  },
};
