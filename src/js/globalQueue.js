// Global queue implementation that is guaranteed to be available
var gsTabQueue = gsTabQueue || {
  queueTabAsPromise: function(tabId, queueId, callback) { 
    console.log("Global gsTabQueue.queueTabAsPromise called:", tabId, queueId); 
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
    return Promise.resolve(); 
  },
  unqueueTab: function(tabId, queueId) { 
    console.log("Global gsTabQueue.unqueueTab called:", tabId, queueId); 
    return Promise.resolve(); 
  },
  requestProcessQueue: function() { 
    console.log("Global gsTabQueue.requestProcessQueue called"); 
    return Promise.resolve(); 
  }
};

// Make global queue available everywhere
if (typeof window !== 'undefined') window.gsTabQueue = gsTabQueue;
if (typeof self !== 'undefined') self.gsTabQueue = gsTabQueue;

console.log("Global gsTabQueue installed and ready!");
