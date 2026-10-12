(() => {
  const $ = (selector) => document.querySelector(selector);
  const state = {
    method: 'screenshot',
    originalFile: null,
    originalUrl: '',
    sourceFile: null,
    diagnosis: null,
    beforeFile: null,
    beforeUrl: '',
    afterFile: null,
    afterUrl: '',
    busy: false
  };
  let sourceMaxBytes = 1024 * 1024;
  const input = $('#screenshot-input');

  function showError(message) {
    const error = $('#global-error');
    error.textContent = message;
    error.hidden = false;
    error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearError() {
    $('#global-error').hidden = true;
    $('#global-error').textContent = '';
  }

  async function getJson(response) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
    return result;
  }

  function validFile(file) {
    if (!file) return false;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      showError('Choose a PNG, JPG, or JPEG image.');
      return false;
    }
    if (file.size > 8 * 1024 * 1024) {
      showError('Each image must be 8 MB or smaller.');
      return false;
    }
    return true;
  }

  const sourceLanguages = {
    '.py': 'Python', '.java': 'Java', '.c': 'C', '.h': 'C',
    '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++', '.hpp': 'C++',
    '.js': 'JavaScript', '.jsx': 'JavaScript (JSX)', '.ts': 'TypeScript',
    '.tsx': 'TypeScript (TSX)', '.html': 'HTML', '.css': 'CSS',
    '.sql': 'SQL', '.json': 'JSON', '.xml': 'XML', '.sh': 'Shell',
    '.ps1': 'PowerShell', '.txt': 'Plain text', '.log': 'Plain text log'
  };

  function formatSize(size) {
    return size < 1024 ? `${size} bytes` : `${(size / 1024).toFixed(1)} KB`;
  }

  function formatLimit(size) {
    return size % (1024 * 1024) === 0
      ? `${size / (1024 * 1024)} MB`
      : `${(size / 1024).toFixed(1)} KB`;
  }

  function updateAnalyzeButton() {
    const hasEvidence = state.method === 'screenshot'
      ? Boolean(state.originalFile)
      : state.method === 'source'
        ? Boolean(state.sourceFile)
        : Boolean($('#analysis-text').value.trim());
    $('#analyze-button').disabled = state.busy || !hasEvidence;
  }

  function setMethod(method) {
    state.method = method;
    document.querySelectorAll('.evidence-method').forEach((button) => {
      const active = button.dataset.method === method;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('#evidence-screenshot').hidden = method !== 'screenshot';
    $('#evidence-source').hidden = method !== 'source';
    $('#evidence-text').hidden = method !== 'text';
    updateAnalyzeButton();
  }

  function setSourceFile(file) {
    clearError();
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const language = sourceLanguages[extension];
    if (!language) {
      showError('Unsupported file type. Choose one of the listed source, markup, script, or text formats.');
      return;
    }
    if (!file.size) {
      showError('The source file is empty. Choose a file that contains code or text.');
      return;
    }
    if (file.size > sourceMaxBytes) {
      showError(`Source files must be ${formatLimit(sourceMaxBytes)} or smaller.`);
      return;
    }
    state.sourceFile = file;
    $('#source-file-name').textContent = file.name;
    $('#source-file-meta').textContent = `${extension} · ${formatSize(file.size)}`;
    $('#source-file-language').textContent = `Detected language: ${language}`;
    $('#source-empty').hidden = true;
    $('#source-file-details').hidden = false;
    updateAnalyzeButton();
  }

  function removeSourceFile() {
    state.sourceFile = null;
    $('#source-input').value = '';
    $('#source-file-name').textContent = '';
    $('#source-file-meta').textContent = '';
    $('#source-file-language').textContent = '';
    $('#source-file-details').hidden = true;
    $('#source-empty').hidden = false;
    updateAnalyzeButton();
  }

  function revoke(url) {
    if (url) URL.revokeObjectURL(url);
  }

  function setOriginal(file, label = '') {
    clearError();
    setMethod('screenshot');
    revoke(state.originalUrl);
    if (state.beforeUrl && state.beforeUrl !== state.originalUrl) revoke(state.beforeUrl);
    revoke(state.afterUrl);
    state.originalFile = file;
    state.originalUrl = URL.createObjectURL(file);
    state.beforeFile = null;
    state.beforeUrl = '';
    state.afterFile = null;
    state.afterUrl = '';
    state.diagnosis = null;
    $('#before-text').value = '';
    $('#after-text').value = '';
    $('#after-input').value = '';
    $('#analysis-section').hidden = true;
    $('#before-preview-wrap').hidden = true;
    $('#before-image-placeholder').hidden = false;
    $('#after-preview-wrap').hidden = true;
    $('#after-image-placeholder').hidden = false;
    $('#before-caption').textContent = 'Optional screenshot';
    $('#after-caption').textContent = 'Optional screenshot';
    $('#comparison-result').hidden = true;
    $('#screenshot-preview').src = state.originalUrl;
    $('#preview-name').textContent = `${file.name}${label ? ` · ${label}` : ''}`;
    $('#upload-empty').hidden = true;
    $('#preview-wrap').hidden = false;
    updateAnalyzeButton();
    updateCompareButton();
  }

  function setComparisonImage(side, file) {
    clearError();
    const upper = side.toUpperCase();
    const previewUrlKey = `${side}Url`;
    const fileKey = `${side}File`;
    if (state[previewUrlKey] && state[previewUrlKey] !== state.originalUrl) {
      revoke(state[previewUrlKey]);
    }
    state[fileKey] = file;
    state[previewUrlKey] = URL.createObjectURL(file);
    $(`#${side}-image`).src = state[previewUrlKey];
    $(`#${side}-image-placeholder`).hidden = true;
    $(`#${side}-preview-wrap`).hidden = false;
    $(`#${side}-caption`).textContent = file.name || `${upper} screenshot selected`;
    $('#comparison-result').hidden = true;
    updateCompareButton();
  }

  function removeComparisonImage(side) {
    const previewUrlKey = `${side}Url`;
    if (state[previewUrlKey] && state[previewUrlKey] !== state.originalUrl) {
      revoke(state[previewUrlKey]);
    }
    state[`${side}File`] = null;
    state[previewUrlKey] = '';
    $(`#${side}-image`).removeAttribute('src');
    $(`#${side}-preview-wrap`).hidden = true;
    $(`#${side}-image-placeholder`).hidden = false;
    $(`#${side}-caption`).textContent = 'Optional screenshot';
    $(`#${side}-input`).value = '';
    $('#comparison-result').hidden = true;
    updateCompareButton();
  }

  function updateCompareButton() {
    const beforeHasEvidence = Boolean(state.beforeFile || $('#before-text').value.trim());
    const afterHasEvidence = Boolean(state.afterFile || $('#after-text').value.trim());
    $('#compare-button').disabled = state.busy || !beforeHasEvidence || !afterHasEvidence;
  }

  function busy(button, value, label) {
    state.busy = value;
    updateAnalyzeButton();
    updateCompareButton();
    button.dataset.originalLabel ||= button.innerHTML;
    button.innerHTML = value ? `<span class="spinner" aria-hidden="true"></span> ${label}` : button.dataset.originalLabel;
  }

  function renderAnalysis(analysis, source) {
    state.diagnosis = analysis;
    if (!state.beforeFile && !$('#before-text').value.trim() && state.originalFile) {
      state.beforeFile = state.originalFile;
      state.beforeUrl = state.originalUrl;
      $('#before-image').src = state.beforeUrl;
      $('#before-image-placeholder').hidden = true;
      $('#before-preview-wrap').hidden = false;
      $('#before-caption').textContent = state.originalFile.name || 'Original screenshot';
    }
    $('#observed-evidence').textContent = analysis.observedEvidence;
    $('#root-cause').textContent = analysis.likelyRootCause;
    $('#suggested-fix').textContent = analysis.suggestedFix;
    $('#why-fix-works').textContent = analysis.whyThisFixWorks;
    $('#missing-information').textContent = analysis.missingInformation;
    const confidenceParts = analysis.confidence.split(/[—:]/, 2);
    const confidence = document.createElement('span');
    const level = document.createElement('strong');
    level.textContent = confidenceParts[0].trim();
    confidence.append(level, document.createTextNode(confidenceParts[1] ? ` — ${confidenceParts[1].trim()}` : ''));
    $('#confidence').replaceChildren(confidence);
    const list = $('#fix-checklist');
    list.replaceChildren();
    (analysis.verificationChecklist || []).forEach((item) => {
      const li = document.createElement('li');
      const content = document.createElement('div');
      content.className = 'check-content';
      const action = document.createElement('span');
      action.className = 'check-action';
      action.textContent = item.action;
      content.append(action);
      if (item.example) {
        const example = document.createElement('span');
        example.className = 'check-meta';
        const exampleLabel = document.createElement('strong');
        exampleLabel.textContent = 'Example: ';
        example.append(exampleLabel, document.createTextNode(item.example));
        content.append(example);
      }
      const expected = document.createElement('span');
      expected.className = 'check-meta';
      const expectedLabel = document.createElement('strong');
      expectedLabel.textContent = 'Expected: ';
      expected.append(expectedLabel, document.createTextNode(item.expected));
      content.append(expected);
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      label.append(checkbox, document.createTextNode(' Mark complete'));
      content.append(label);
      li.append(content);
      list.append(li);
    });
    $('#analysis-source').textContent = source;
    $('#analysis-section').hidden = false;
    $('#comparison-section').hidden = false;
    $('#comparison-result').hidden = true;
    updateCompareButton();
  }

  function renderOffline(matched, text) {
    const result = $('#offline-results');
    result.replaceChildren();
    const heading = document.createElement('h3');
    const body = document.createElement('p');
    const list = document.createElement('ul');
    if (!matched) {
      heading.textContent = 'No local match found';
      body.textContent = 'This offline matcher recognizes several common error types. Check the message for an error name or use Gemma 4 screenshot analysis when configured.';
      result.append(heading, body);
    } else {
      heading.textContent = `${matched.name} · local troubleshooting`;
      body.textContent = `Likely cause: ${matched.cause}`;
      matched.actions.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.append(li);
      });
      const expected = document.createElement('p');
      expected.textContent = `Expected result: ${matched.expected}`;
      result.append(heading, body, list, expected);
    }
    result.hidden = false;
    if (!text.trim()) return;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderComparison(report) {
    const container = $('#comparison-result');
    const className = report.status === 'RESOLVED' ? 'status-resolved' :
      report.status === 'STILL PRESENT' ? 'status-still-present' : 'status-unable-to-verify';
    container.className = `comparison-result ${className}`;
    container.replaceChildren();
    const top = document.createElement('div');
    top.className = 'report-top';
    const status = document.createElement('span');
    status.className = 'report-status';
    status.textContent = report.status;
    const note = document.createElement('span');
    note.className = 'report-note';
    note.textContent = 'Based on the screenshots and/or text you supplied. Run your application and tests to confirm behavior.';
    top.append(status, note);
    const grid = document.createElement('div');
    grid.className = 'report-grid';
    [
      ['Before evidence summary', report.visibleBefore],
      ['After evidence summary', report.visibleAfter],
      ['What changed', report.evidenceChanged],
      ['Original error remains?', report.originalErrorRemains],
      ['Why this result', report.explanation]
    ].forEach(([label, text]) => {
      const item = document.createElement('div');
      item.className = 'report-item';
      const heading = document.createElement('strong');
      heading.textContent = label;
      const copy = document.createElement('p');
      copy.textContent = text;
      item.append(heading, copy);
      grid.append(item);
    });
    const next = document.createElement('p');
    next.className = 'report-next';
    const strong = document.createElement('strong');
    strong.textContent = 'Next recommended action: ';
    next.append(strong, document.createTextNode(report.nextAction));
    container.append(top, grid, next);
    container.hidden = false;
  }

  async function analyze() {
    clearError();
    const button = $('#analyze-button');
    busy(button, true, 'Analyzing evidence…');
    try {
      let response;
      if (state.method === 'screenshot') {
        const form = new FormData();
        form.append('screenshot', state.originalFile);
        response = await fetch('/api/analyze', { method: 'POST', body: form });
      } else if (state.method === 'source') {
        const form = new FormData();
        form.append('sourceFile', state.sourceFile);
        response = await fetch('/api/analyze-source', { method: 'POST', body: form });
      } else {
        response = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: $('#analysis-text').value, language: $('#analysis-language').value })
        });
      }
      const result = await getJson(response);
      renderAnalysis(result.analysis, `GEMMA 4 · ${result.model}`);
      if (state.method === 'screenshot') {
        $('#before-image').src = state.originalUrl;
        $('#before-caption').textContent = state.originalFile.name;
      }
      $('#comparison-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showError(error.message);
    } finally {
      busy(button, false, 'Analyzing evidence…');
    }
  }

  async function compare() {
    clearError();
    if ($('#compare-button').disabled) return;
    const button = $('#compare-button');
    busy(button, true, 'Comparing evidence…');
    try {
      const form = new FormData();
      if (state.beforeFile) form.append('before', state.beforeFile);
      if (state.afterFile) form.append('after', state.afterFile);
      form.append('beforeText', $('#before-text').value);
      form.append('afterText', $('#after-text').value);
      if (state.diagnosis) form.append('diagnosis', JSON.stringify(state.diagnosis));
      const result = await getJson(await fetch('/api/compare', { method: 'POST', body: form }));
      renderComparison(result.report);
    } catch (error) {
      showError(error.message);
    } finally {
      busy(button, false, 'Comparing…');
    }
  }

  function reset() {
    clearError();
    revoke(state.originalUrl);
    if (state.beforeUrl && state.beforeUrl !== state.originalUrl) revoke(state.beforeUrl);
    revoke(state.afterUrl);
    Object.assign(state, {
      method: 'screenshot',
      originalFile: null,
      originalUrl: '',
      sourceFile: null,
      diagnosis: null,
      beforeFile: null,
      beforeUrl: '',
      afterFile: null,
      afterUrl: '',
      busy: false
    });
    input.value = '';
    $('#analysis-text').value = '';
    $('#analysis-language').value = 'Not specified';
    removeSourceFile();
    setMethod('screenshot');
    $('#before-input').value = '';
    $('#after-input').value = '';
    $('#upload-empty').hidden = false;
    $('#preview-wrap').hidden = true;
    $('#analysis-section').hidden = true;
    $('#before-text').value = '';
    $('#after-text').value = '';
    $('#before-preview-wrap').hidden = true;
    $('#before-image-placeholder').hidden = false;
    $('#before-caption').textContent = 'Optional screenshot';
    $('#after-preview-wrap').hidden = true;
    $('#after-image-placeholder').hidden = false;
    $('#after-caption').textContent = 'Optional screenshot';
    $('#comparison-result').hidden = true;
    $('#offline-results').hidden = true;
    $('#error-text').value = '';
    updateAnalyzeButton();
    $('#compare-button').disabled = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadSample() {
    clearError();
    try {
      const response = await fetch('/sample-error.svg');
      if (!response.ok) throw new Error('Could not load the bundled sample screenshot.');
      const imageUrl = URL.createObjectURL(await response.blob());
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          revoke(imageUrl);
          if (!blob) {
            showError('Could not prepare the sample screenshot. Please choose an image file instead.');
            return;
          }
          setOriginal(new File([blob], 'sample-python-error.png', { type: 'image/png' }), 'SAMPLE DATA');
        }, 'image/png');
      };
      image.onerror = () => {
        revoke(imageUrl);
        showError('Could not decode the bundled sample screenshot.');
      };
      image.src = imageUrl;
    } catch (error) {
      showError(error.message);
    }
  }

  async function updateStatus() {
    const indicator = $('#mode-indicator');
    const text = $('#mode-text');
    try {
      const status = await getJson(await fetch('/api/status'));
      if (Number.isSafeInteger(status.sourceMaxBytes) && status.sourceMaxBytes > 0) {
        sourceMaxBytes = status.sourceMaxBytes;
        $('#analysis-text').maxLength = sourceMaxBytes;
        $('#source-size-limit').textContent = `Code, markup, scripts, JSON, logs · Up to ${formatLimit(sourceMaxBytes)}`;
        $('#analysis-size-limit').textContent = `Maximum ${formatLimit(sourceMaxBytes)} · Sent only when you choose Analyze evidence`;
      }
      text.textContent = status.mode === 'configured' ? 'Gemma 4 configured' : 'Offline fallback';
      indicator.title = status.message;
      indicator.classList.toggle('is-configured', status.mode === 'configured');
      indicator.classList.toggle('has-error', status.mode !== 'configured');
    } catch {
      text.textContent = 'Offline fallback';
      indicator.title = 'Local troubleshooting is available; the backend status could not be checked.';
      indicator.classList.add('has-error');
    }
  }

  $('#browse-button').addEventListener('click', (event) => {
    event.stopPropagation();
    input.click();
  });
  $('#drop-zone').addEventListener('click', (event) => {
    if (!event.target.closest('button') && !event.target.closest('.preview-wrap')) input.click();
  });
  $('#drop-zone').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  });
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (validFile(file)) setOriginal(file);
    input.value = '';
  });
  $('#source-browse-button').addEventListener('click', (event) => {
    event.stopPropagation();
    $('#source-input').click();
  });
  $('#source-drop-zone').addEventListener('click', (event) => {
    if (!event.target.closest('button') && !event.target.closest('.source-file-details')) $('#source-input').click();
  });
  $('#source-drop-zone').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      $('#source-input').click();
    }
  });
  $('#source-input').addEventListener('change', (event) => {
    setSourceFile(event.target.files[0]);
    event.target.value = '';
  });
  $('#remove-source').addEventListener('click', removeSourceFile);
  $('#analysis-text').addEventListener('input', () => {
    clearError();
    updateAnalyzeButton();
  });
  document.querySelectorAll('.evidence-method').forEach((button) => {
    button.addEventListener('click', () => {
      clearError();
      setMethod(button.dataset.method);
    });
  });
  $('#after-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (validFile(file)) setComparisonImage('after', file);
    event.target.value = '';
  });
  $('#before-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (validFile(file)) setComparisonImage('before', file);
    event.target.value = '';
  });
  $('#remove-before').addEventListener('click', () => removeComparisonImage('before'));
  $('#remove-after').addEventListener('click', () => removeComparisonImage('after'));
  ['before-text', 'after-text'].forEach((id) => {
    $(`#${id}`).addEventListener('input', () => {
      $('#comparison-result').hidden = true;
      updateCompareButton();
    });
  });
  $('#remove-image').addEventListener('click', (event) => {
    event.stopPropagation();
    reset();
  });
  ['dragenter', 'dragover'].forEach((type) => $('#drop-zone').addEventListener(type, (event) => {
    event.preventDefault();
    $('#drop-zone').classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach((type) => $('#drop-zone').addEventListener(type, (event) => {
    event.preventDefault();
    $('#drop-zone').classList.remove('dragging');
  }));
  $('#drop-zone').addEventListener('drop', (event) => {
    const file = event.dataTransfer.files[0];
    if (validFile(file)) setOriginal(file);
  });
  ['dragenter', 'dragover'].forEach((type) => $('#source-drop-zone').addEventListener(type, (event) => {
    event.preventDefault();
    $('#source-drop-zone').classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach((type) => $('#source-drop-zone').addEventListener(type, (event) => {
    event.preventDefault();
    $('#source-drop-zone').classList.remove('dragging');
  }));
  $('#source-drop-zone').addEventListener('drop', (event) => setSourceFile(event.dataTransfer.files[0]));
  $('#analyze-button').addEventListener('click', analyze);
  $('#compare-button').addEventListener('click', compare);
  $('#sample-button').addEventListener('click', loadSample);
  $('#new-session').addEventListener('click', reset);
  $('#offline-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('#error-text').value.trim();
    if (!text) {
      showError('Paste an error message first to use Offline Rescue.');
      $('#error-text').focus();
      return;
    }
    clearError();
    const match = window.PIXELFIX_KNOWLEDGE.find((entry) => entry.pattern.test(text));
    renderOffline(match, text);
  });
  updateStatus();
})();
