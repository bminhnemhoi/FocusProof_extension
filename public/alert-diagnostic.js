// FocusProof Alert & Goal Compliance Diagnostic – External JS (MV3 CSP compliant)
'use strict';

// ============================================================
// Domain Rules (mirrored from src/utils/types.ts)
// ============================================================
var DEFAULT_GOAL_DOMAIN_RULES = {
  'study': ['docs.google.com', 'drive.google.com', 'notion.so', 'evernote.com'],
  'work': ['docs.google.com', 'drive.google.com', 'notion.so'],
  'programming': ['github.com', 'gitlab.com', 'localhost', 'vscode.dev', 'stackblitz.com'],
  'video-lecture': ['youtube.com', 'coursera.org', 'udemy.com', 'zoom.us'],
};

var DEFAULT_GOAL_EXTERNAL_APP_RULE = {
  'study': true,
  'work': true,
  'programming': false,
  'video-lecture': false,
};

var OUTSIDE_CHROME_MARKER = '__outside_chrome__';

// Quick test URLs for each scenario
var QUICK_TEST_URLS = [
  { url: 'https://docs.google.com/document/d/abc', desc: 'Google Docs (study/work)' },
  { url: 'https://drive.google.com/drive/my-drive', desc: 'Google Drive (study/work)' },
  { url: 'https://notion.so/workspace/page-123', desc: 'Notion (study/work)' },
  { url: 'https://github.com/user/repo/pull/1', desc: 'GitHub (programming)' },
  { url: 'https://stackoverflow.com/questions/123', desc: 'StackOverflow (thường không nằm trong allowed)' },
  { url: 'https://youtube.com/watch?v=abc123', desc: 'YouTube (video-lecture)' },
  { url: 'https://facebook.com/feed', desc: 'Facebook (không liên quan)' },
  { url: 'https://tiktok.com/@user', desc: 'TikTok (không liên quan)' },
  { url: 'https://twitter.com/home', desc: 'Twitter/X (không liên quan)' },
  { url: 'https://reddit.com/r/popular', desc: 'Reddit (không liên quan)' },
  { url: 'https://shopee.vn/deal', desc: 'Shopee (không liên quan)' },
  { url: 'https://messenger.com', desc: 'Messenger (không liên quan)' },
  { url: 'https://mail.google.com/inbox', desc: 'Gmail' },
  { url: 'https://chat.openai.com', desc: 'ChatGPT' },
  { url: 'http://localhost:3000', desc: 'Localhost (programming)' },
  { url: OUTSIDE_CHROME_MARKER, desc: '🚪 Ngoài Chrome (VS Code, Word, v.v.)' },
];

// ============================================================
// State
// ============================================================
var currentMode = 'study';
var liveInterval = null;
var seenAlertCount = 0;

// ============================================================
// Logger
// ============================================================
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
// Goal Compliance Logic (mirrors goal-evaluator.ts)
// ============================================================
function isGoalCompliant(currentState, mode, customDomains) {
  customDomains = customDomains || [];

  // Outside Chrome
  if (currentState === OUTSIDE_CHROME_MARKER) {
    return DEFAULT_GOAL_EXTERNAL_APP_RULE[mode];
  }

  // Inside Chrome — check domain
  var allAllowed = DEFAULT_GOAL_DOMAIN_RULES[mode].concat(customDomains);

  // Extract hostname from URL
  var hostname = currentState;
  try {
    hostname = new URL(currentState).hostname.toLowerCase();
  } catch (e) {
    hostname = currentState.toLowerCase();
  }

  return allAllowed.some(function(allowed) {
    return hostname.includes(allowed) || allowed.includes(hostname);
  });
}

// ============================================================
// Section 1: Mode Selection
// ============================================================
function updateModeDisplay() {
  // Highlight active mode button
  var btns = document.querySelectorAll('.mode-btn');
  btns.forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === currentMode);
  });

  // Show allowed domains
  var domains = DEFAULT_GOAL_DOMAIN_RULES[currentMode];
  var container = document.getElementById('allowed-domains');
  container.innerHTML = '';
  domains.forEach(function(d) {
    var tag = document.createElement('span');
    tag.className = 'domain-tag domain-tag--ok';
    tag.textContent = d;
    container.appendChild(tag);
  });

  // Show external rule
  var extAllowed = DEFAULT_GOAL_EXTERNAL_APP_RULE[currentMode];
  setVal('external-rule',
    extAllowed
      ? '\u2705 Cho ph\u00E9p (VS Code, Word, v.v. OK)'
      : '\u274C Kh\u00F4ng cho ph\u00E9p (c\u1EA3nh b\u00E1o khi r\u1EDDi Chrome)',
    extAllowed ? 'val--ok' : 'val--err'
  );

  log('Mode changed to: ' + currentMode + ' | Allowed domains: [' + domains.join(', ') + '] | External apps: ' + (extAllowed ? 'ALLOWED' : 'BLOCKED'));

  // Update quick test table
  updateQuickTests();
}

// Mode button click handlers
document.querySelectorAll('.mode-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    currentMode = btn.getAttribute('data-mode');
    updateModeDisplay();
  });
});

// ============================================================
// Section 2: Test URL
// ============================================================
function testUrl(url) {
  if (!url) {
    log('No URL provided', 'warn');
    return null;
  }

  var compliant = isGoalCompliant(url, currentMode);
  var isOutside = url === OUTSIDE_CHROME_MARKER;

  var hostname = url;
  try { hostname = new URL(url).hostname; } catch(e) { /* keep as-is */ }

  var resultDiv = document.getElementById('test-result');
  resultDiv.style.display = 'block';

  if (compliant) {
    resultDiv.innerHTML = '<div class="result-box result-box--ok">\u2705 PH\u00D9 H\u1EE2P M\u1EE4C TI\u00CAU (' + currentMode + ')</div>' +
      '<p style="font-size:12px; color:#94a3b8; margin-top:4px;">' +
      (isOutside
        ? 'Mode "' + currentMode + '" cho ph\u00E9p d\u00F9ng \u1EE9ng d\u1EE5ng ngo\u00E0i Chrome. Kh\u00F4ng c\u1EA3nh b\u00E1o.'
        : 'Domain <b>' + hostname + '</b> n\u1EB1m trong danh s\u00E1ch \u0111\u01B0\u1EE3c ph\u00E9p. Kh\u00F4ng c\u1EA3nh b\u00E1o.') +
      '</p>';
    log('TEST: "' + url + '" \u2192 \u2705 COMPLIANT (' + currentMode + ')', 'ok');
  } else {
    resultDiv.innerHTML = '<div class="result-box result-box--err">\u274C KH\u00D4NG PH\u00D9 H\u1EE2P \u2192 S\u1EBC C\u1EA2NH B\u00C1O!</div>' +
      '<p style="font-size:12px; color:#94a3b8; margin-top:4px;">' +
      (isOutside
        ? 'Mode "' + currentMode + '" KH\u00D4NG cho ph\u00E9p r\u1EDDi Chrome. \u2192 C\u1EA3nh b\u00E1o: "B\u1EA1n \u0111\u00E3 r\u1EDDi kh\u1ECFi Chrome!" + notification h\u1EC7 th\u1ED1ng.'
        : 'Domain <b>' + hostname + '</b> KH\u00D4NG n\u1EB1m trong danh s\u00E1ch cho ph\u00E9p. \u2192 C\u1EA3nh b\u00E1o: "Tab hi\u1EC7n t\u1EA1i kh\u00F4ng ph\u00F9 h\u1EE3p m\u1EE5c ti\u00EAu!" + widget flash \u0111\u1ECF.') +
      '</p>';
    log('TEST: "' + url + '" \u2192 \u274C VIOLATION (' + currentMode + ')', 'err');
  }

  return compliant;
}

document.getElementById('btn-test-url').addEventListener('click', function() {
  var url = document.getElementById('test-url').value.trim();
  if (!url) {
    log('Vui l\u00F2ng nh\u1EADp URL', 'warn');
    return;
  }
  testUrl(url);
});

document.getElementById('btn-test-outside').addEventListener('click', function() {
  testUrl(OUTSIDE_CHROME_MARKER);
});

// Also test on Enter key
document.getElementById('test-url').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    var url = e.target.value.trim();
    if (url) testUrl(url);
  }
});

// ============================================================
// Section 3: Quick Tests
// ============================================================
function updateQuickTests() {
  var tbody = document.getElementById('quick-test-body');
  tbody.innerHTML = '';

  QUICK_TEST_URLS.forEach(function(item) {
    var compliant = isGoalCompliant(item.url, currentMode);
    var tr = document.createElement('tr');

    var urlDisplay = item.url;
    if (item.url === OUTSIDE_CHROME_MARKER) {
      urlDisplay = '\uD83D\uDEAA __outside_chrome__';
    } else {
      try { urlDisplay = new URL(item.url).hostname; } catch(e) {}
    }

    tr.innerHTML =
      '<td style="font-family:Consolas,monospace; color:#60a5fa; cursor:pointer" class="quick-url">' + urlDisplay + '</td>' +
      '<td style="color:#94a3b8">' + item.desc + '</td>' +
      '<td><span class="domain-tag ' + (compliant ? 'domain-tag--ok' : 'domain-tag--err') + '">' +
      (compliant ? '\u2705 OK' : '\u274C C\u1EA3nh b\u00E1o') + '</span></td>';

    // Click to test
    tr.querySelector('.quick-url').addEventListener('click', function() {
      document.getElementById('test-url').value = item.url;
      testUrl(item.url);
    });

    tbody.appendChild(tr);
  });

  log('Quick tests updated for mode: ' + currentMode);
}

// ============================================================
// Section 4: Live Session Monitor
// ============================================================
function pollSessionStatus() {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    setVal('live-status', 'Kh\u00F4ng c\u00F3 Chrome Extension API', 'val--err');
    log('Chrome runtime API not available', 'err');
    return;
  }

  chrome.runtime.sendMessage({ type: 'SESSION_STATUS', payload: null }, function(response) {
    if (chrome.runtime.lastError) {
      setVal('live-status', 'Error: ' + chrome.runtime.lastError.message, 'val--err');
      log('SESSION_STATUS error: ' + chrome.runtime.lastError.message, 'err');
      return;
    }

    if (!response) {
      setVal('live-status', 'Kh\u00F4ng c\u00F3 response', 'val--warn');
      return;
    }

    var session = response.session;
    if (!session) {
      setVal('live-status', '\u23F8 Kh\u00F4ng c\u00F3 session \u0111ang ch\u1EA1y', 'val--warn');
      document.getElementById('live-dot').className = 'live-indicator live-indicator--off';
      return;
    }

    // Session is running
    document.getElementById('live-dot').className = 'live-indicator live-indicator--on';
    setVal('live-status', '\u25B6\uFE0F Running (' + session.config.mode + ': ' + session.config.taskName + ')', 'val--ok');

    // Get latest sample
    var samples = session.samples || [];
    var lastSample = samples.length > 0 ? samples[samples.length - 1] : null;

    if (lastSample) {
      var tabInfo = lastSample.tab || {};
      setVal('live-url', tabInfo.currentUrl || '\u2014', 'val--info');
      setVal('live-domain', tabInfo.currentDomain || '\u2014', 'val--info');

      var isAllowed = tabInfo.isAllowed;
      setVal('live-compliant',
        isAllowed ? '\u2705 Ph\u00F9 h\u1EE3p' : '\u274C KH\u00D4NG ph\u00F9 h\u1EE3p!',
        isAllowed ? 'val--ok' : 'val--err'
      );

      var isOutside = tabInfo.isOutsideChrome;
      setVal('live-outside',
        isOutside ? '\uD83D\uDEAA C\u00F3 (ngo\u00E0i Chrome)' : '\u2705 Kh\u00F4ng',
        isOutside ? 'val--warn' : 'val--ok'
      );

      setVal('live-face',
        lastSample.face ? (lastSample.face.detected ? '\u2705 C\u00F3' : '\u274C Kh\u00F4ng') : '\u2014',
        lastSample.face ? (lastSample.face.detected ? 'val--ok' : 'val--err') : ''
      );

      setVal('live-camera',
        session.config.cameraEnabled ? '\u2705 B\u1EADt' : '\u274C T\u1EAFt',
        session.config.cameraEnabled ? 'val--ok' : 'val--warn'
      );
    }

    // Alert count
    var alertCount = response.alertCount || 0;
    setVal('live-alerts', alertCount + ' c\u1EA3nh b\u00E1o',
      alertCount > 0 ? 'val--err' : 'val--ok'
    );

    // Score
    var score = typeof session.score === 'number' ? session.score : 0;
    setVal('live-score', score + '%',
      score >= 80 ? 'val--ok' : score >= 50 ? 'val--warn' : 'val--err'
    );

    // Alert history
    var alerts = response.alertHistory || session.alertHistory || [];
    if (alerts.length > seenAlertCount) {
      // New alerts since last poll
      for (var i = seenAlertCount; i < alerts.length; i++) {
        var a = alerts[i];
        log('ALERT [' + a.type + ']: ' + a.message, 'err');
      }
      seenAlertCount = alerts.length;
      updateAlertHistory(alerts);
    }
  });
}

function updateAlertHistory(alerts) {
  var tbody = document.getElementById('alert-history-body');
  if (alerts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:#64748b; text-align:center">Ch\u01B0a c\u00F3 c\u1EA3nh b\u00E1o</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  // Show most recent first
  var recent = alerts.slice().reverse().slice(0, 30);
  recent.forEach(function(a) {
    var tr = document.createElement('tr');
    var time = new Date(a.timestamp).toLocaleTimeString('vi-VN');
    var typeColors = {
      'face-lost': '#f59e0b',
      'idle': '#f59e0b',
      'tab-violation': '#ef4444',
      'outside-chrome': '#ef4444',
    };
    var typeLabels = {
      'face-lost': '\uD83D\uDE36 M\u1EA5t m\u1EB7t',
      'idle': '\uD83D\uDCA4 Idle',
      'tab-violation': '\uD83D\uDEAB Tab sai',
      'outside-chrome': '\uD83D\uDEAA R\u1EDDi Chrome',
    };
    var color = typeColors[a.type] || '#94a3b8';
    tr.innerHTML =
      '<td style="color:#94a3b8">' + time + '</td>' +
      '<td style="color:' + color + '; font-weight:600">' + (typeLabels[a.type] || a.type) + '</td>' +
      '<td>' + a.message + '</td>';
    tbody.appendChild(tr);
  });
}

document.getElementById('btn-live-start').addEventListener('click', function() {
  log('=== Live Monitor Started ===', 'ok');
  seenAlertCount = 0;
  document.getElementById('btn-live-start').disabled = true;
  document.getElementById('btn-live-stop').disabled = false;
  document.getElementById('live-dot').className = 'live-indicator live-indicator--on';

  pollSessionStatus(); // Immediate first poll
  liveInterval = setInterval(pollSessionStatus, 2000); // Every 2s
});

document.getElementById('btn-live-stop').addEventListener('click', function() {
  log('=== Live Monitor Stopped ===');
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = null;
  }
  document.getElementById('btn-live-start').disabled = false;
  document.getElementById('btn-live-stop').disabled = true;
  document.getElementById('live-dot').className = 'live-indicator live-indicator--off';
});

// ============================================================
// Init
// ============================================================
log('=== Alert & Goal Compliance Diagnostic loaded ===', 'ok');
log('Extension ID: ' + (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : 'N/A'));
updateModeDisplay();
