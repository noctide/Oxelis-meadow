// A translator plugin in its smallest form. `oxelis` is the only object a plugin gets.
module.exports = class Hello {
  onload(oxelis) {
    oxelis.services.translate.register({
      id: 'hello',
      name: 'Hello',
      // texts: array of strings; from: language code or null (detect); to: language code like 'zh-CN'.
      // Return an array of the same length. May be async.
      translate(texts, from, to) {
        return texts.map(t => '[' + to + '] ' + t);
      },
    });
  }
};
