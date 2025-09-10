// Global binding script to ensure critical objects are available everywhere
(function() {
  console.log('Setting up global bindings');
  
  // Make sure gsTabQueue is available everywhere
  if (!window.gsTabQueue && self.gsTabQueue) {
    window.gsTabQueue = self.gsTabQueue;
  } else if (!self.gsTabQueue && window.gsTabQueue) {
    self.gsTabQueue = window.gsTabQueue;
  } else if (!window.gsTabQueue && !self.gsTabQueue) {
    // Create a default implementation if missing completely
    const defaultQueue = {
      queueTabAsPromise: function(tabId, queueId, callback) {
        console.log("Default gsTabQueue.queueTabAsPromise called:", tabId, queueId);
        if (typeof callback === 'function') {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      },
      unqueueTab: function(tabId, queueId) {
        console.log("Default gsTabQueue.unqueueTab called:", tabId, queueId);
        return Promise.resolve();
      },
      requestProcessQueue: function() {
        console.log("Default gsTabQueue.requestProcessQueue called");
        return Promise.resolve();
      }
    };
    window.gsTabQueue = defaultQueue;
    self.gsTabQueue = defaultQueue;
  }
  
  console.log('Global bindings complete');
})();
