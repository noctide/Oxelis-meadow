module.exports = {
  onload(oxelis) {
    oxelis.ui.addButton({
      id: 'double', group: 'output', icon: 'ML', tip: 'Run the demo model',
      run() {
        const model = oxelis.ml.load('models/double_f32.onnx');   // inside this plugin's folder
        const out = model.run({ x: { dtype: 'float32', shape: [3], data: [1, 2, 3.5] } });
        oxelis.app.notify('model says ' + JSON.stringify(out.y.data));   // [2,4,7]
      },
    });
  },
};
