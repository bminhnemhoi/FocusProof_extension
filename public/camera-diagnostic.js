// FocusProof Camera Diagnostic – External JS (MV3 CSP compliant)
'use strict';

const logBox = document.getElementById('log-box');

function log(msg, level) {
  level = level || 'info';
  const ts = new Date().toISOString().slice(11, 23);
  const span = document.createElement('span');
  span.className = 'log-' + level;
  span.textContent = '[' + ts + '] ' + msg + '\n';
  logBox.appendChild(span);
  logBox.scrollTop = logBox.scrollHeight;
}

function setVal(id, text, cls) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'val ' + (cls || '');
}

let currentStream = null;

// ======= STEP 1: Context Info =======
(function checkContext() {
  log('=== Step 1: Extension Context ===');

  setVal('ctx-origin', location.origin, 'val--info');
  log('Origin: ' + location.origin);

  setVal('ctx-url', location.href.substring(0, 80), 'val--info');
  log('URL: ' + location.href);

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    setVal('ctx-extid', chrome.runtime.id, 'val--info');
    log('Extension ID: ' + chrome.runtime.id);
  } else {
    setVal('ctx-extid', 'N/A (not in extension)', 'val--warn');
    log('Not in extension context', 'warn');
  }

  // Detect page type
  var url = location.href;
  var pageType = 'unknown';
  if (url.includes('popup')) pageType = 'popup';
  else if (url.includes('offscreen')) pageType = 'offscreen';
  else if (url.startsWith('chrome-extension://')) pageType = 'extension page (tab)';
  else pageType = 'web page';
  setVal('ctx-pagetype', pageType, 'val--info');
  log('Page type: ' + pageType);

  // mediaDevices
  var hasMediaDevices = !!(navigator.mediaDevices);
  setVal('ctx-mediadevices', hasMediaDevices ? '\u2705 Available' : '\u274C Missing', hasMediaDevices ? 'val--ok' : 'val--err');
  log('navigator.mediaDevices: ' + (hasMediaDevices ? 'OK' : 'MISSING'), hasMediaDevices ? 'ok' : 'err');

  var hasGUM = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  setVal('ctx-gum', hasGUM ? '\u2705 Available' : '\u274C Missing', hasGUM ? 'val--ok' : 'val--err');
  log('getUserMedia: ' + (hasGUM ? 'OK' : 'MISSING'), hasGUM ? 'ok' : 'err');

  var isSecure = window.isSecureContext;
  setVal('ctx-secure', isSecure ? '\u2705 Yes' : '\u274C No', isSecure ? 'val--ok' : 'val--err');
  log('isSecureContext: ' + isSecure, isSecure ? 'ok' : 'err');
})();

// ======= STEP 2: Permission Status =======
(async function checkPermissions() {
  log('=== Step 2: Permissions API ===');

  var names = ['camera', 'microphone'];
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    try {
      var status = await navigator.permissions.query({ name: name });
      var state = status.state;
      var cls = state === 'granted' ? 'val--ok' : state === 'denied' ? 'val--err' : 'val--warn';
      setVal('perm-' + (name === 'microphone' ? 'mic' : name), state + (state === 'prompt' ? ' (ch\u01B0a h\u1ECFi)' : ''), cls);
      log(name + ' permission: ' + state, state === 'granted' ? 'ok' : state === 'denied' ? 'err' : 'warn');

      (function(permName, permStatus) {
        permStatus.addEventListener('change', function() {
          log(permName + ' permission changed \u2192 ' + permStatus.state, 'warn');
          var cls2 = permStatus.state === 'granted' ? 'val--ok' : permStatus.state === 'denied' ? 'val--err' : 'val--warn';
          setVal('perm-' + (permName === 'microphone' ? 'mic' : permName), permStatus.state, cls2);
        });
      })(name, status);
    } catch (err) {
      setVal('perm-' + (name === 'microphone' ? 'mic' : name), 'Query failed: ' + err.message, 'val--warn');
      log(name + ' permission query failed: ' + err.message, 'warn');
    }
  }
})();

// ======= STEP 3: Enumerate Devices =======
(async function checkDevices() {
  log('=== Step 3: Enumerate Devices ===');
  var list = document.getElementById('devices-list');
  try {
    var devices = await navigator.mediaDevices.enumerateDevices();
    var videoDevices = devices.filter(function(d) { return d.kind === 'videoinput'; });
    var audioDevices = devices.filter(function(d) { return d.kind === 'audioinput'; });

    log('Found ' + videoDevices.length + ' video + ' + audioDevices.length + ' audio devices');

    if (videoDevices.length === 0) {
      list.innerHTML = '<div class="row"><span class="val val--err">\u274C Kh\u00F4ng t\u00ECm th\u1EA5y camera n\u00E0o</span></div>';
      log('No video input devices found!', 'err');
      document.getElementById('devices-card').classList.add('card--err');
      return;
    }

    document.getElementById('devices-card').classList.add('card--ok');
    var html = '';
    for (var j = 0; j < devices.length; j++) {
      var d = devices[j];
      var icon = d.kind === 'videoinput' ? '\uD83D\uDCF7' : d.kind === 'audioinput' ? '\uD83C\uDFA4' : '\uD83D\uDD0A';
      var label = d.label || '(label \u1EA9n \u2014 ch\u01B0a c\u1EA5p quy\u1EC1n)';
      var id = d.deviceId ? d.deviceId.substring(0, 16) + '...' : 'N/A';
      html += '<div class="row"><span class="label">' + icon + ' ' + d.kind + '</span><span class="val val--info">' + label + ' <small style="color:#64748b">[' + id + ']</small></span></div>';
      log('  ' + d.kind + ': ' + label + ' (' + d.deviceId.substring(0, 16) + ')');
    }
    list.innerHTML = html;
  } catch (err) {
    list.innerHTML = '<div class="row"><span class="val val--err">Error: ' + err.message + '</span></div>';
    log('enumerateDevices failed: ' + err.message, 'err');
  }
})();

// ======= STEP 4: Test Camera =======
async function testCamera() {
  log('=== Step 4: getUserMedia Test ===');
  var btn = document.getElementById('btn-test');
  var btnStop = document.getElementById('btn-stop');
  btn.disabled = true;

  setVal('cam-status', '\u23F3 \u0110ang g\u1ECDi getUserMedia...', 'val--warn');
  setVal('cam-error', '\u2014', '');
  setVal('cam-tracks', '\u2014', '');
  setVal('cam-dims', '\u2014', '');

  var constraints = {
    video: { width: 320, height: 240, facingMode: 'user' },
    audio: false
  };
  log('Constraints: ' + JSON.stringify(constraints));

  var startTime = performance.now();
  try {
    log('Calling getUserMedia...');
    var stream = await navigator.mediaDevices.getUserMedia(constraints);
    var elapsed = Math.round(performance.now() - startTime);
    log('getUserMedia SUCCESS in ' + elapsed + 'ms', 'ok');

    currentStream = stream;
    var tracks = stream.getTracks();
    log('Stream tracks: ' + tracks.length, 'ok');
    for (var k = 0; k < tracks.length; k++) {
      var t = tracks[k];
      var settings = t.getSettings();
      log('  Track: ' + t.kind + ' | ' + t.label + ' | state=' + t.readyState + ' | ' + settings.width + 'x' + settings.height + '@' + settings.frameRate + 'fps');
    }

    var video = document.getElementById('video-preview');
    video.srcObject = stream;
    await video.play();
    log('Video element playing', 'ok');

    setVal('cam-status', '\u2705 Camera \u0111ang ho\u1EA1t \u0111\u1ED9ng!', 'val--ok');
    setVal('cam-tracks', tracks.map(function(t) { return t.kind + ': ' + t.label; }).join(', '), 'val--ok');

    var vt = tracks.find(function(t) { return t.kind === 'video'; });
    if (vt) {
      var s = vt.getSettings();
      setVal('cam-dims', s.width + 'x' + s.height + ' @ ' + Math.round(s.frameRate || 0) + 'fps', 'val--ok');
    }

    document.getElementById('camera-card').classList.add('card--ok');
    document.getElementById('camera-card').classList.remove('card--err');
    btnStop.disabled = false;

    // Re-check permissions after grant
    try {
      var permStatus = await navigator.permissions.query({ name: 'camera' });
      setVal('perm-camera', permStatus.state, permStatus.state === 'granted' ? 'val--ok' : 'val--warn');
      log('Camera permission after grant: ' + permStatus.state, 'ok');
    } catch (e) { /* ignore */ }

    // Re-enumerate devices (labels should now be visible)
    var devicesAfter = await navigator.mediaDevices.enumerateDevices();
    var videoAfter = devicesAfter.filter(function(d) { return d.kind === 'videoinput'; });
    log('After grant: ' + videoAfter.length + ' camera(s) with labels:');
    for (var m = 0; m < videoAfter.length; m++) {
      log('  ' + (videoAfter[m].label || '(no label)') + ' [' + videoAfter[m].deviceId.substring(0, 16) + ']');
    }

  } catch (err) {
    var elapsedErr = Math.round(performance.now() - startTime);
    log('getUserMedia FAILED in ' + elapsedErr + 'ms: ' + err.name + ': ' + err.message, 'err');

    setVal('cam-status', '\u274C L\u1ED7i', 'val--err');
    setVal('cam-error', err.name + ': ' + err.message, 'val--err');
    document.getElementById('camera-card').classList.add('card--err');
    document.getElementById('camera-card').classList.remove('card--ok');

    var extId = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) ? chrome.runtime.id : 'YOUR_ID';
    if (err.name === 'NotAllowedError') {
      log('\u2192 Nguy\u00EAn nh\u00E2n: User t\u1EEB ch\u1ED1i ho\u1EB7c Chrome block quy\u1EC1n camera cho extension n\u00E0y', 'err');
      log('\u2192 Gi\u1EA3i ph\u00E1p: V\u00E0o chrome://settings/content/camera \u2192 th\u00EAm chrome-extension://' + extId + ' v\u00E0o "Cho ph\u00E9p"', 'warn');
    } else if (err.name === 'NotFoundError') {
      log('\u2192 Nguy\u00EAn nh\u00E2n: Kh\u00F4ng t\u00ECm th\u1EA5y thi\u1EBFt b\u1ECB camera', 'err');
    } else if (err.name === 'NotReadableError') {
      log('\u2192 Nguy\u00EAn nh\u00E2n: Camera \u0111ang b\u1ECB d\u00F9ng b\u1EDFi \u1EE9ng d\u1EE5ng kh\u00E1c', 'err');
    } else if (err.name === 'OverconstrainedError') {
      log('\u2192 Nguy\u00EAn nh\u00E2n: Constraints kh\u00F4ng th\u1ECFa m\u00E3n (camera kh\u00F4ng h\u1ED7 tr\u1EE3 320x240)', 'err');
    }

    btn.disabled = false;
  }
}

function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(function(t) { t.stop(); });
    currentStream = null;
    log('Camera stopped', 'info');
  }
  var video = document.getElementById('video-preview');
  video.srcObject = null;

  setVal('cam-status', '\u23F9 \u0110\u00E3 d\u1EEBng', 'val--warn');
  document.getElementById('btn-test').disabled = false;
  document.getElementById('btn-stop').disabled = true;
  document.getElementById('camera-card').classList.remove('card--ok');
}

// ======= Bind event listeners (no inline handlers) =======
document.getElementById('btn-test').addEventListener('click', testCamera);
document.getElementById('btn-stop').addEventListener('click', stopCamera);
document.getElementById('btn-mic-test').addEventListener('click', testMicrophone);
document.getElementById('btn-mic-stop').addEventListener('click', stopMicrophone);

// ======= STEP 5: Test Microphone =======
var micStream = null;
var micAudioCtx = null;
var micAnalyser = null;
var micAnimFrame = null;

async function testMicrophone() {
  log('=== Step 5: Microphone Test ===');
  var btn = document.getElementById('btn-mic-test');
  var btnStop = document.getElementById('btn-mic-stop');
  btn.disabled = true;

  setVal('mic-status', '\u23F3 \u0110ang g\u1ECDi getUserMedia (audio)...', 'val--warn');
  setVal('mic-error', '\u2014', '');
  setVal('mic-tracks', '\u2014', '');
  setVal('mic-samplerate', '\u2014', '');
  setVal('mic-channels', '\u2014', '');
  setVal('mic-volume', '\u2014', '');

  var constraints = { video: false, audio: true };
  log('Constraints: ' + JSON.stringify(constraints));

  var startTime = performance.now();
  try {
    log('Calling getUserMedia for audio...');
    var stream = await navigator.mediaDevices.getUserMedia(constraints);
    var elapsed = Math.round(performance.now() - startTime);
    log('getUserMedia (audio) SUCCESS in ' + elapsed + 'ms', 'ok');

    micStream = stream;
    var tracks = stream.getAudioTracks();
    log('Audio tracks: ' + tracks.length, 'ok');
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var settings = t.getSettings();
      log('  Track: ' + t.kind + ' | ' + t.label + ' | state=' + t.readyState + ' | sampleRate=' + settings.sampleRate + ' | channels=' + settings.channelCount);
    }

    setVal('mic-status', '\u2705 Microphone \u0111ang ho\u1EA1t \u0111\u1ED9ng!', 'val--ok');
    setVal('mic-tracks', tracks.map(function(t) { return t.kind + ': ' + t.label; }).join(', '), 'val--ok');

    var audioTrack = tracks[0];
    if (audioTrack) {
      var s = audioTrack.getSettings();
      setVal('mic-samplerate', (s.sampleRate || 'N/A') + ' Hz', 'val--ok');
      setVal('mic-channels', (s.channelCount || 'N/A') + '', 'val--ok');
    }

    document.getElementById('mic-card').classList.add('card--ok');
    document.getElementById('mic-card').classList.remove('card--err');
    btnStop.disabled = false;

    // Setup audio visualization
    micAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var source = micAudioCtx.createMediaStreamSource(stream);
    micAnalyser = micAudioCtx.createAnalyser();
    micAnalyser.fftSize = 256;
    source.connect(micAnalyser);

    var canvas = document.getElementById('mic-canvas');
    var canvasCtx = canvas.getContext('2d');
    var bufferLength = micAnalyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    function drawMicLevel() {
      micAnimFrame = requestAnimationFrame(drawMicLevel);
      micAnalyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = '#0f172a';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      var barWidth = (canvas.width / bufferLength) * 2.5;
      var x = 0;
      var maxVal = 0;
      for (var j = 0; j < bufferLength; j++) {
        var barHeight = dataArray[j] / 2;
        if (dataArray[j] > maxVal) maxVal = dataArray[j];

        var g = Math.round(100 + (dataArray[j] / 255) * 155);
        canvasCtx.fillStyle = 'rgb(50,' + g + ',100)';
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      var volumePercent = Math.round((maxVal / 255) * 100);
      setVal('mic-volume', volumePercent + '%' + (volumePercent > 50 ? ' \uD83D\uDD0A' : volumePercent > 10 ? ' \uD83D\uDD09' : ' \uD83D\uDD08'), volumePercent > 10 ? 'val--ok' : 'val--warn');
    }
    drawMicLevel();
    log('Audio visualizer started', 'ok');

    // Re-check permissions after grant
    try {
      var permStatus = await navigator.permissions.query({ name: 'microphone' });
      setVal('perm-mic', permStatus.state, permStatus.state === 'granted' ? 'val--ok' : 'val--warn');
      log('Microphone permission after grant: ' + permStatus.state, 'ok');
    } catch (e) { /* ignore */ }

  } catch (err) {
    var elapsedErr = Math.round(performance.now() - startTime);
    log('getUserMedia (audio) FAILED in ' + elapsedErr + 'ms: ' + err.name + ': ' + err.message, 'err');

    setVal('mic-status', '\u274C L\u1ED7i', 'val--err');
    setVal('mic-error', err.name + ': ' + err.message, 'val--err');
    document.getElementById('mic-card').classList.add('card--err');
    document.getElementById('mic-card').classList.remove('card--ok');

    var extId = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) ? chrome.runtime.id : 'YOUR_ID';
    if (err.name === 'NotAllowedError') {
      log('\u2192 Nguy\u00EAn nh\u00E2n: User t\u1EEB ch\u1ED1i ho\u1EB7c Chrome block quy\u1EC1n microphone', 'err');
      log('\u2192 Gi\u1EA3i ph\u00E1p: V\u00E0o chrome://settings/content/microphone \u2192 th\u00EAm chrome-extension://' + extId + ' v\u00E0o "Cho ph\u00E9p"', 'warn');
    } else if (err.name === 'NotFoundError') {
      log('\u2192 Nguy\u00EAn nh\u00E2n: Kh\u00F4ng t\u00ECm th\u1EA5y microphone', 'err');
    } else if (err.name === 'NotReadableError') {
      log('\u2192 Nguy\u00EAn nh\u00E2n: Microphone \u0111ang b\u1ECB d\u00F9ng b\u1EDFi \u1EE9ng d\u1EE5ng kh\u00E1c', 'err');
    }

    btn.disabled = false;
  }
}

function stopMicrophone() {
  if (micAnimFrame) {
    cancelAnimationFrame(micAnimFrame);
    micAnimFrame = null;
  }
  if (micAudioCtx) {
    micAudioCtx.close();
    micAudioCtx = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(function(t) { t.stop(); });
    micStream = null;
    log('Microphone stopped', 'info');
  }

  var canvas = document.getElementById('mic-canvas');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  setVal('mic-status', '\u23F9 \u0110\u00E3 d\u1EEBng', 'val--warn');
  setVal('mic-volume', '\u2014', '');
  document.getElementById('btn-mic-test').disabled = false;
  document.getElementById('btn-mic-stop').disabled = true;
  document.getElementById('mic-card').classList.remove('card--ok');
}
