// Monaco Editor Web Worker configuration - DISABLED to prevent worker errors
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    // Return empty blob to disable workers and prevent errors
    return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(`
      self.onmessage = function() {};
      self.postMessage = function() {};
    `);
  },
};
