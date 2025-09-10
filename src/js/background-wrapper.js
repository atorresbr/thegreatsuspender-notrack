/**
 * The Great Suspender - NoTrack
 * Background Service Worker Wrapper for Manifest V3
 */
'use strict';

// Immediate patch for chrome.extension APIs before anything else runs
if (!chrome.extension) {
  chrome.extension = {};
}
chrome.extension.getURL = chrome.runtime.getURL;
chrome.extension.getBackgroundPage = function() {
  console.log('chrome.extension.getBackgroundPage is not available in Manifest V3');
  return self;
};
chrome.extension.getViews = function() {
  console.log('chrome.extension.getViews is not available in Manifest V3');
  return [];
};
chrome.extension.isAllowedIncognitoAccess = chrome.runtime.isAllowedIncognitoAccess;
chrome.extension.isAllowedFileSchemeAccess = chrome.runtime.isAllowedFileSchemeAccess;
Object.defineProperty(chrome.extension, 'inIncognitoContext', {
  get: function() {
    return false;
  }
});

// Now import our compatibility adapter
importScripts('gsManifestV3Adapter.js');

console.log('Adapter loaded, localStorage available:', typeof localStorage !== 'undefined');
console.log('chrome.extension.getURL available:', typeof chrome.extension.getURL === 'function');

// Create gsFavicon stub to avoid errors
self.gsFavicon = {
  fetchFaviconDataUrl: function() {
    return Promise.resolve('');
  },
  buildFaviconMetaData: function() {
    return Promise.resolve({
      favIconUrl: '',
      normalisedDataUrl: '',
      transparentDataUrl: ''
    });
  },
  getFaviconMetaData: function() {
    return Promise.resolve({
      favIconUrl: '',
      normalisedDataUrl: '',
      transparentDataUrl: ''
    });
  },
  generateFaviconFromUrl: function() {
    return Promise.resolve('');
  }
};

// Import all background scripts in the same order as the original manifest
importScripts(
  'gsUtils.js',
  'gsChrome.js',
  'gsStorage.js',
  'db.js',
  'gsIndexedDb.js',
  'gsMessages.js',
  'gsSession.js',
  'gsTabQueue.js',
  'gsTabCheckManager.js',
  'gsFavicon.js',
  'gsCleanScreencaps.js',
  'gsTabSuspendManager.js',
  'gsTabDiscardManager.js',
  'gsSuspendedTab.js',
  'background.js'
);

// Service worker lifecycle events
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Great Suspender service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Great Suspender service worker activated');
  event.waitUntil(clients.claim());
});

// Ensure service worker stays alive with periodic alarms
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.create('checkTabs', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTabs') {
    // This simulates the periodic checks that the original extension did with setInterval
    if (typeof gsTabCheckManager !== 'undefined' && gsTabCheckManager.performTabChecks) {
      gsTabCheckManager.performTabChecks();
    }
  }
});

// Debugging helper
console.log('Great Suspender background wrapper loaded');
