/* FastDoc frontend */
(function () {
  'use strict';

  // --- State ---
  let files = [];
  let activeFile = null;
  let searchDebounceTimer = null;
  let isSearchMode = false;
  let pendingFile = null;

  // --- DOM refs ---
  const fileList = document.getElementById('file-list');
  const searchInput = document.getElementById('search-input');
  const viewerEmpty = document.getElementById('viewer-empty');
  const viewerContent = document.getElementById('viewer-content');
  const viewerIframe = document.getElementById('viewer-iframe');
  const addFileBtn = document.getElementById('add-file-btn');
  const themeBtn = document.getElementById('theme-btn');
  const themePicker = document.getElementById('theme-picker');
  const themeOptions = document.querySelectorAll('.theme-option');
  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmCancel = document.getElementById('confirm-cancel');
  const dialogOverlay = document.getElementById('dialog-overlay');
  const dialogPathInput = document.getElementById('dialog-path-input');
  const dialogFileInput = document.getElementById('dialog-file-input');
  const dialogBrowseBtn = document.getElementById('dialog-browse-btn');
  const dialogCancel = document.getElementById('dialog-cancel');
  const dialogClose = document.getElementById('dialog-close');
  const dialogConfirm = document.getElementById('dialog-confirm');
  const dialogError = document.getElementById('dialog-error');

  // --- marked.js config ---
  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: false });
  }

  // --- Utilities ---

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightTerm(text, term) {
    if (!term) return escapeHtml(text);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escapeHtml(text).replace(
      new RegExp(escaped, 'gi'),
      m => `<mark>${m}</mark>`
    );
  }

  function groupFilesByExt(fileArray) {
    const md = fileArray.filter(f => f.ext === 'md');
    const html = fileArray.filter(f => f.ext === 'html');
    return { md, html };
  }

  // --- Render sidebar ---

  function renderSidebar(fileArray, searchTerm) {
    fileList.innerHTML = '';

    if (fileArray.length === 0) {
      if (isSearchMode) {
        fileList.innerHTML = '<p class="sidebar-empty">No results found.</p>';
      } else {
        fileList.innerHTML = '<p class="sidebar-empty">No documents yet.<br>Drop files into <code>docs/</code>.</p>';
      }
      return;
    }

    if (isSearchMode) {
      // Search results: flat list with snippets
      const ul = document.createElement('ul');
      ul.className = 'file-group-list';
      for (const item of fileArray) {
        const li = document.createElement('li');
        li.className = 'file-item' + (item.path === activeFile ? ' active' : '');
        li.dataset.path = item.path;
        li.innerHTML =
          `<span class="file-name">${highlightTerm(item.name, searchTerm)}</span>` +
          (item.snippet ? `<span class="file-snippet">${highlightTerm(item.snippet, searchTerm)}</span>` : '');
        li.addEventListener('click', () => openFile(item.path));
        ul.appendChild(li);
      }
      fileList.appendChild(ul);
    } else {
      // Normal mode: grouped by extension
      const { md, html } = groupFilesByExt(fileArray);
      if (md.length > 0) renderGroup('Markdown', md);
      if (html.length > 0) renderGroup('HTML', html);
    }
  }

  function renderGroup(label, items) {
    const section = document.createElement('div');
    section.className = 'file-group';

    const header = document.createElement('div');
    header.className = 'file-group-header';
    header.textContent = label;
    section.appendChild(header);

    const ul = document.createElement('ul');
    ul.className = 'file-group-list';
    for (const item of items) {
      const li = document.createElement('li');
      li.className = 'file-item' + (item.path === activeFile ? ' active' : '');
      li.dataset.path = item.path;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-name';
      nameSpan.textContent = item.name;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'file-delete-btn';
      deleteBtn.title = 'Remove from docs';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFile(item.path, item.name);
      });

      li.appendChild(nameSpan);
      li.appendChild(deleteBtn);
      li.addEventListener('click', () => openFile(item.path));
      ul.appendChild(li);
    }
    section.appendChild(ul);
    fileList.appendChild(section);
  }

  // --- Load file list ---

  async function loadFiles() {
    try {
      const res = await fetch('/api/files');
      files = await res.json();
      isSearchMode = false;
      renderSidebar(files);
    } catch (err) {
      fileList.innerHTML = '<p class="sidebar-error">Failed to load files.</p>';
    }
  }

  // --- Open and render a file ---

  async function openFile(filePath) {
    activeFile = filePath;

    // Update active state in sidebar
    document.querySelectorAll('.file-item').forEach(el => {
      el.classList.toggle('active', el.dataset.path === filePath);
    });

    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error('Not found');
      const { content, ext } = await res.json();

      viewerEmpty.hidden = true;

      if (ext === 'md') {
        viewerIframe.hidden = true;
        viewerIframe.srcdoc = '';
        viewerContent.hidden = false;
        viewerContent.classList.remove('loaded');
        viewerContent.innerHTML = marked.parse(content);
        // Trigger fade-in animation
        void viewerContent.offsetWidth;
        viewerContent.classList.add('loaded');

        // Apply syntax highlighting to code blocks
        viewerContent.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });
      } else if (ext === 'html') {
        viewerContent.hidden = true;
        viewerContent.innerHTML = '';
        viewerIframe.hidden = false;
        viewerIframe.srcdoc = content;
      }
    } catch (err) {
      viewerEmpty.hidden = true;
      viewerContent.hidden = false;
      viewerIframe.hidden = true;
      viewerContent.innerHTML = '<p class="viewer-error">Failed to load file.</p>';
    }
  }

  // --- Search ---

  async function search(query) {
    if (!query.trim()) {
      isSearchMode = false;
      renderSidebar(files);
      return;
    }
    isSearchMode = true;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const results = await res.json();
      renderSidebar(results, query);
    } catch (err) {
      fileList.innerHTML = '<p class="sidebar-error">Search failed.</p>';
    }
  }

  // --- Upload a file (from browse picker) ---

  async function uploadFile(file) {
    const content = await file.text();
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, content })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  // --- Register a file ---

  async function registerFile(sourcePath) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  }

  // --- Confirm dialog ---

  function showConfirm(message) {
    return new Promise(resolve => {
      confirmMessage.textContent = message;
      confirmOverlay.hidden = false;
      confirmOk.focus();

      function cleanup(result) {
        confirmOverlay.hidden = true;
        confirmOk.removeEventListener('click', onOk);
        confirmCancel.removeEventListener('click', onCancel);
        confirmOverlay.removeEventListener('click', onBackdrop);
        resolve(result);
      }

      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }
      function onBackdrop(e) { if (e.target === confirmOverlay) cleanup(false); }

      confirmOk.addEventListener('click', onOk);
      confirmCancel.addEventListener('click', onCancel);
      confirmOverlay.addEventListener('click', onBackdrop);
    });
  }

  // --- Delete a file ---

  async function deleteFile(filePath, fileName) {
    const confirmed = await showConfirm(`Remove "${fileName}" from docs?`);
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Delete failed: ' + (data.error || 'Unknown error'));
        return;
      }
      if (activeFile === filePath) {
        activeFile = null;
        viewerEmpty.hidden = false;
        viewerContent.hidden = true;
        viewerContent.innerHTML = '';
        viewerIframe.hidden = true;
        viewerIframe.srcdoc = '';
      }
      await loadFiles();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  // --- Dialog ---

  function showDialog() {
    pendingFile = null;
    dialogFileInput.value = '';
    dialogPathInput.value = '';
    dialogPathInput.readOnly = false;
    dialogError.hidden = true;
    dialogError.textContent = '';
    dialogOverlay.hidden = false;
    dialogPathInput.focus();
  }

  function hideDialog() {
    dialogOverlay.hidden = true;
    pendingFile = null;
  }

  async function handleDialogConfirm() {
    dialogConfirm.disabled = true;
    dialogConfirm.textContent = 'Adding…';
    dialogError.hidden = true;
    try {
      if (pendingFile) {
        await uploadFile(pendingFile);
      } else {
        const sourcePath = dialogPathInput.value.trim();
        if (!sourcePath) {
          showDialogError('Please enter a file path or use Browse to select a file.');
          return;
        }
        await registerFile(sourcePath);
      }
      hideDialog();
      await loadFiles();
    } catch (err) {
      showDialogError(err.message);
    } finally {
      dialogConfirm.disabled = false;
      dialogConfirm.textContent = 'Add Document';
    }
  }

  function showDialogError(msg) {
    dialogError.textContent = msg;
    dialogError.hidden = false;
  }

  // --- Theme management ---

  function setTheme(name) {
    if (name === 'auto') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = name;
    }
    localStorage.setItem('fastdoc-theme', name);
    syncHljsTheme();
    updateThemeUI(name);
  }

  function loadTheme() {
    const saved = localStorage.getItem('fastdoc-theme') || 'auto';
    // dataset.theme already set by inline script for non-auto;
    // just sync the UI state
    updateThemeUI(saved);
    syncHljsTheme();
  }

  function updateThemeUI(activeName) {
    themeOptions.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === activeName);
    });
  }

  // --- Event listeners ---

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    const q = searchInput.value;
    searchDebounceTimer = setTimeout(() => search(q), 300);
  });

  addFileBtn.addEventListener('click', showDialog);

  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !themePicker.hidden;
    themePicker.hidden = open;
    themeBtn.classList.toggle('active', !open);
  });

  themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme);
      themePicker.hidden = true;
      themeBtn.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!themePicker.hidden && !themePicker.contains(e.target) && e.target !== themeBtn) {
      themePicker.hidden = true;
      themeBtn.classList.remove('active');
    }
  });

  dialogBrowseBtn.addEventListener('click', () => {
    dialogFileInput.value = '';
    dialogFileInput.click();
  });

  dialogFileInput.addEventListener('change', () => {
    const file = dialogFileInput.files[0];
    if (!file) return;
    pendingFile = file;
    dialogPathInput.value = file.name;
    dialogPathInput.readOnly = true;
  });

  // Typing in path input clears any browsed file selection
  dialogPathInput.addEventListener('input', () => {
    pendingFile = null;
    dialogPathInput.readOnly = false;
  });

  dialogCancel.addEventListener('click', hideDialog);
  dialogClose.addEventListener('click', hideDialog);
  dialogOverlay.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) hideDialog();
  });
  dialogConfirm.addEventListener('click', handleDialogConfirm);
  dialogPathInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleDialogConfirm();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dialogOverlay.hidden) hideDialog();
  });

  // --- Sync highlight.js theme with color scheme ---
  const hljsLight = document.getElementById('hljs-theme-light');
  const hljsDark = document.getElementById('hljs-theme-dark');
  function syncHljsTheme() {
    const theme = document.documentElement.dataset.theme;
    const dark = theme
      ? theme !== 'paper'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    hljsLight.disabled = dark;
    hljsDark.disabled = !dark;
  }
  const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  darkMQ.addEventListener('change', () => {
    if (!document.documentElement.dataset.theme) syncHljsTheme();
  });

  // --- Poll for file changes ---
  // Re-fetch file list every 2 seconds to catch chokidar-detected changes
  setInterval(async () => {
    if (isSearchMode) return;
    try {
      const res = await fetch('/api/files');
      const updated = await res.json();
      // Only re-render if something changed
      if (JSON.stringify(updated.map(f => f.path + f.mtime)) !==
          JSON.stringify(files.map(f => f.path + f.mtime))) {
        files = updated;
        renderSidebar(files);
      }
    } catch (_) {}
  }, 2000);

  // --- Init ---
  loadTheme();
  loadFiles();
})();
