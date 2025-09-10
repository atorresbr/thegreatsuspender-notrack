/**
 * Patch for gsFavicon.js to handle service worker environment
 */

// Save a reference to the original functions we need to modify
if (typeof window.gsFaviconOriginalFunctions === 'undefined') {
  window.gsFaviconOriginalFunctions = {};
  
  // Wait until gsFavicon is loaded
  setTimeout(() => {
    if (typeof gsFavicon !== 'undefined') {
      // Patch the addFaviconMetaToDefaultFingerprints function
      if (typeof gsFavicon.addFaviconMetaToDefaultFingerprints === 'function') {
        window.gsFaviconOriginalFunctions.addFaviconMetaToDefaultFingerprints = gsFavicon.addFaviconMetaToDefaultFingerprints;
        
        gsFavicon.addFaviconMetaToDefaultFingerprints = function(snapshotId, faviconMeta) {
          // Add defensive checks to avoid undefined errors
          if (!faviconMeta) {
            console.warn('faviconMeta is undefined in addFaviconMetaToDefaultFingerprints');
            faviconMeta = { 
              favIconUrl: '', 
              normalisedDataUrl: '',
              transparentDataUrl: '' 
            };
          }
          
          if (!faviconMeta.normalisedDataUrl) {
            console.warn('normalisedDataUrl is undefined in addFaviconMetaToDefaultFingerprints');
            faviconMeta.normalisedDataUrl = '';
          }
          
          // Call original function with safe values
          try {
            return window.gsFaviconOriginalFunctions.addFaviconMetaToDefaultFingerprints(snapshotId, faviconMeta);
          } catch (e) {
            console.warn('Error in patched addFaviconMetaToDefaultFingerprints:', e);
            return Promise.resolve();
          }
        };
      }
      
      console.log('gsFavicon patched successfully');
    }
  }, 100);
}