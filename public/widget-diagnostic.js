// FocusProof Widget Diagnostic – External JS (MV3 CSP compliant)
'use strict';

var logBox = document.getElementById('log-box');

function log(msg, level) {
  level = level || 'info';
  var ts = new Date().toISOString().slice(11, 23);
  var span = document.createElement('span');
  span.className = 'log-' + level;
  span.textContent = '[' + ts + '] ' + msg + '\n';
  logBox.appendChild(span);
  logBox.scrollTop = logBox.scrollHeight;
}

function setVal(id, text, cls) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'val ' + (cls || '');
}

// ============================================================
// Helpers
// ============================================================

// Get the active tab (not this diagnostic page)
function getActiveWebTab() {
  return new Promise(function(resolve, reject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      // Find the first non-extension tab, or just return the active tab
      var webTab = null;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url && !tabs[i].url.startsWith('chrome-extension://') && !tabs[i].url.startsWith('chrome://')) {
          webTab = tabs[i];
          break;
        }
      }
      if (!webTab && tabs.length > 0) {
        webTab = tabs[0];
      }
      resolve(webTab);
    });
  });
}

// Get the last active web tab across all windows
function getLastActiveWebTab() {
  return new Promise(function(resolve, reject) {
    chrome.tabs.query({ lastFocusedWindow: true }, function(tabs) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      var webTab = null;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url && tabs[i].active &&
            !tabs[i].url.startsWith('chrome-extension://') &&
            !tabs[i].url.startsWith('chrome://')) {
          webTab = tabs[i];
          break;
        }
      }
      // Fallback: any active tab
      if (!webTab) {
        for (var j = 0; j < tabs.length; j++) {
          if (tabs[j].active) { webTab = tabs[j]; break; }
        }
      }
      resolve(webTab);
    });
  });
}

// Find a web tab to test with
function findTestTab() {
  return new Promise(function(resolve) {
    chrome.tabs.query({}, function(allTabs) {
      // First: look for an active web tab
      for (var i = 0; i < allTabs.length; i++) {
        var t = allTabs[i];
        if (t.active && t.url && !t.url.startsWith('chrome') && t.url.startsWith('http')) {
          resolve(t);
          return;
        }
      }
      // Second: any web tab
      for (var j = 0; j < allTabs.length; j++) {
        var t2 = allTabs[j];
        if (t2.url && t2.url.startsWith('http')) {
          resolve(t2);
          return;
        }
      }
      resolve(null);
    });
  });
}

var lastFoundTabId = null;

// ============================================================
// Section 1: Check Session Status
// ============================================================
function checkSession() {
  log('=== Checking Session Status ===');

  chrome.runtime.sendMessage({ type: 'SESSION_STATUS', payload: null }, function(response) {
    if (chrome.runtime.lastError) {
      log('Error: ' + chrome.runtime.lastError.message, 'err');
      setVal('s-running', 'Error', 'val--err');
      return;
    }

    if (!response) {
      log('No response from background', 'err');
      setVal('s-running', 'No response', 'val--err');
      return;
    }

    var session = response.session;
    if (!session || session.status !== 'running') {
      setVal('s-running', '\u274C Kh\u00F4ng c\u00F3 session \u0111ang ch\u1EA1y', 'val--err');
      setVal('s-id', '\u2014', '');
      setVal('s-mode', '\u2014', '');
      setVal('s-task', '\u2014', '');
      setVal('s-camera', '\u2014', '');
      setVal('s-samples', '\u2014', '');
      setVal('s-alerts', '\u2014', '');
      document.getElementById('session-card').classList.add('card--warn');
      document.getElementById('session-card').classList.remove('card--ok');
      log('No running session. Widget will NOT show because it is only created when a session starts.', 'warn');
      log('\u2192 B\u1EA1n c\u1EA7n b\u1EAFt \u0111\u1EA7u m\u1ED9t session t\u1EEB popup tr\u01B0\u1EDBc!', 'warn');
      return;
    }

    setVal('s-running', '\u2705 \u0110ang ch\u1EA1y', 'val--ok');
    setVal('s-id', session.id || '\u2014', 'val--info');
    setVal('s-mode', session.config.mode || '\u2014', 'val--info');
    setVal('s-task', session.config.taskName || '\u2014', 'val--info');
    setVal('s-camera', session.config.cameraEnabled ? '\u2705 B\u1EADt' : '\u274C T\u1EAFt', session.config.cameraEnabled ? 'val--ok' : 'val--warn');
    setVal('s-samples', (session.samples ? session.samples.length : 0) + ' samples', 'val--info');
    setVal('s-alerts', (response.alertCount || 0) + ' alerts', response.alertCount > 0 ? 'val--err' : 'val--ok');
    document.getElementById('session-card').classList.add('card--ok');
    document.getElementById('session-card').classList.remove('card--warn');
    log('Session running: ' + session.id + ' | mode=' + session.config.mode + ' | samples=' + (session.samples ? session.samples.length : 0), 'ok');
  });
}

document.getElementById('btn-check-session').addEventListener('click', checkSession);

// ============================================================
// Section 2: Check Active Tab
// ============================================================
function checkTab() {
  log('=== Checking Active Tab ===');

  findTestTab().then(function(tab) {
    if (!tab) {
      log('No web tab found! Open a regular webpage first.', 'err');
      setVal('t-id', '\u274C Kh\u00F4ng t\u00ECm th\u1EA5y web tab', 'val--err');
      return;
    }

    lastFoundTabId = tab.id;
    setVal('t-id', tab.id + '', 'val--info');
    setVal('t-url', (tab.url || '').substring(0, 60), 'val--info');
    setVal('t-title', (tab.title || '').substring(0, 40), 'val--info');
    log('Found tab: ID=' + tab.id + ' | URL=' + tab.url, 'ok');

    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
      log('\u26A0\uFE0F Tab n\u00E0y l\u00E0 chrome page \u2014 content script KH\u00D4NG ch\u1EA1y \u0111\u01B0\u1EE3c!', 'warn');
      document.getElementById('tab-card').classList.add('card--warn');
    } else {
      document.getElementById('tab-card').classList.add('card--ok');
      document.getElementById('tab-card').classList.remove('card--warn');
    }
  });
}

document.getElementById('btn-check-tab').addEventListener('click', checkTab);

// ============================================================
// Section 3: Ping Content Script
// ============================================================
function pingContentScript() {
  log('=== Pinging Content Script ===');

  findTestTab().then(function(tab) {
    if (!tab) {
      log('No web tab to ping', 'err');
      setVal('cs-loaded', '\u274C Kh\u00F4ng c\u00F3 web tab', 'val--err');
      return;
    }

    lastFoundTabId = tab.id;
    log('Sending PING to tab ' + tab.id + ' (' + tab.url + ')');

    chrome.tabs.sendMessage(tab.id, { type: 'PING', payload: null }, function(response) {
      if (chrome.runtime.lastError) {
        setVal('cs-loaded', '\u274C Kh\u00F4ng (content script ch\u01B0a \u0111\u01B0\u1EE3c inject)', 'val--err');
        setVal('cs-widget', '\u2014', '');
        document.getElementById('cs-card').classList.add('card--err');
        document.getElementById('cs-card').classList.remove('card--ok');
        log('PING failed: ' + chrome.runtime.lastError.message, 'err');
        log('\u2192 Content script ch\u01B0a \u0111\u01B0\u1EE3c inject v\u00E0o tab n\u00E0y.', 'err');
        log('\u2192 Gi\u1EA3i ph\u00E1p: Reload extension t\u1EA1i chrome://extensions, r\u1ED3i refresh trang web (Ctrl+R)', 'warn');
        return;
      }

      if (!response || !response.alive) {
        setVal('cs-loaded', '\u274C Kh\u00F4ng tr\u1EA3 l\u1EDDi', 'val--err');
        log('No valid response from content script', 'err');
        return;
      }

      setVal('cs-loaded', '\u2705 \u0110\u00E3 load (tracking: ' + (response.isTracking ? 'ON' : 'OFF') + ')', 'val--ok');
      setVal('cs-widget',
        response.widgetExists ? '\u2705 C\u00F3 (widget \u0111ang hi\u1EC3n)' : '\u274C Kh\u00F4ng (ch\u01B0a inject widget)',
        response.widgetExists ? 'val--ok' : 'val--warn'
      );
      document.getElementById('cs-card').classList.add('card--ok');
      document.getElementById('cs-card').classList.remove('card--err');
      log('Content script alive! url=' + response.url + ' | tracking=' + response.isTracking + ' | widget=' + response.widgetExists, 'ok');

      if (!response.widgetExists && !response.isTracking) {
        log('\u2192 Widget ch\u01B0a hi\u1EC3n v\u00EC ch\u01B0a b\u1EAFt \u0111\u1EA7u session, ho\u1EB7c session \u0111\u00E3 g\u1EEDi START_SESSION nh\u01B0ng tab n\u00E0y kh\u00F4ng ph\u1EA3i tab \u0111\u00E3 nh\u1EADn l\u1EC7nh', 'warn');
      }
    });
  });
}

document.getElementById('btn-check-cs').addEventListener('click', pingContentScript);

// ============================================================
// Section 4: Manual Widget Test
// ============================================================
function sendToTab(type, payload, label) {
  findTestTab().then(function(tab) {
    if (!tab) {
      log('No web tab to send to', 'err');
      setVal('m-result', '\u274C No web tab', 'val--err');
      return;
    }

    lastFoundTabId = tab.id;
    log('Sending ' + type + ' to tab ' + tab.id + '...');

    chrome.tabs.sendMessage(tab.id, { type: type, payload: payload }, function(response) {
      if (chrome.runtime.lastError) {
        setVal('m-result', '\u274C ' + label + ': ' + chrome.runtime.lastError.message, 'val--err');
        log(label + ' failed: ' + chrome.runtime.lastError.message, 'err');
        return;
      }
      setVal('m-result', '\u2705 ' + label + ' OK', 'val--ok');
      log(label + ' success! response=' + JSON.stringify(response), 'ok');
    });
  });
}

document.getElementById('btn-inject-widget').addEventListener('click', function() {
  sendToTab('START_SESSION', null, 'Inject Widget');
});

document.getElementById('btn-update-widget').addEventListener('click', function() {
  sendToTab('WIDGET_UPDATE', {
    focusScore: 0.85,
    timeRemaining: 1500000,
    faceDetected: true,
    isIdle: false,
    goalCompliant: true,
  }, 'Update Widget');
});

document.getElementById('btn-test-alert').addEventListener('click', function() {
  sendToTab('ALERT', {
    type: 'tab-violation',
    timestamp: Date.now(),
    message: 'Tab hi\u1EC7n t\u1EA1i kh\u00F4ng ph\u00F9 h\u1EE3p m\u1EE5c ti\u00EAu!',
  }, 'Alert Toast');
});

document.getElementById('btn-destroy-widget').addEventListener('click', function() {
  sendToTab('STOP_SESSION', null, 'Destroy Widget');
});

// ============================================================
// Init
// ============================================================
log('=== Widget Diagnostic loaded ===', 'ok');
log('Extension ID: ' + (chrome.runtime && chrome.runtime.id ? chrome.runtime.id : 'N/A'));
log('');
log('H\u01B0\u1EDBng d\u1EABn nhanh:', 'info');
log('1. M\u1EDF m\u1ED9t tab web (google.com, youtube.com, v.v.)');
log('2. Quay l\u1EA1i \u0111\u00E2y, b\u1EA5m "Ki\u1EC3m tra Tab hi\u1EC7n t\u1EA1i"');
log('3. B\u1EA5m "Ping Content Script" \u2192 xem content script \u0111\u00E3 load ch\u01B0a');
log('4. B\u1EA5m "Inject Widget" \u2192 chuy\u1EC3n qua tab web \u0111\u1EC3 xem widget');
log('');

// Auto-check session on load
checkSession();
