const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3333;
const DOCS_DIR = path.resolve(__dirname, 'docs');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory file index: relative path → { name, ext, content, mtime }
const fileIndex = new Map();

function relativePath(absPath) {
  return path.relative(DOCS_DIR, absPath).replace(/\\/g, '/');
}

function isSafePath(relPath) {
  const resolved = path.resolve(DOCS_DIR, relPath);
  return resolved.startsWith(DOCS_DIR + path.sep) || resolved === DOCS_DIR;
}

function indexFile(absPath) {
  try {
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) return;
    const ext = path.extname(absPath).toLowerCase().slice(1);
    if (!['md', 'html'].includes(ext)) return;
    const rel = relativePath(absPath);
    const content = fs.readFileSync(absPath, 'utf8');
    fileIndex.set(rel, {
      name: path.basename(absPath),
      ext,
      content,
      mtime: stat.mtimeMs
    });
  } catch (err) {
    console.error('Error indexing file:', absPath, err.message);
  }
}

function removeFromIndex(absPath) {
  const rel = relativePath(absPath);
  fileIndex.delete(rel);
}

// Initial scan and watch
const watcher = chokidar.watch(DOCS_DIR, {
  ignored: /(^|[/\\])\../,
  persistent: true,
  ignoreInitial: false
});

watcher
  .on('add', indexFile)
  .on('change', indexFile)
  .on('unlink', removeFromIndex);

// --- REST API ---

// GET /api/files — list all files sorted by name
app.get('/api/files', (req, res) => {
  const files = [];
  for (const [filePath, meta] of fileIndex.entries()) {
    files.push({
      name: meta.name,
      path: filePath,
      ext: meta.ext,
      mtime: meta.mtime
    });
  }
  files.sort((a, b) => a.name.localeCompare(b.name));
  res.json(files);
});

// GET /api/file?path=<rel> — get file content
app.get('/api/file', (req, res) => {
  const relPath = req.query.path;
  if (!relPath || !isSafePath(relPath)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  const entry = fileIndex.get(relPath);
  if (!entry) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.json({ content: entry.content, ext: entry.ext });
});

// GET /api/search?q=<term> — search name and content
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  if (!query) {
    return res.json([]);
  }
  const results = [];
  for (const [filePath, meta] of fileIndex.entries()) {
    const nameMatch = meta.name.toLowerCase().includes(query);
    const contentIdx = meta.content.toLowerCase().indexOf(query);
    if (nameMatch || contentIdx !== -1) {
      let snippet = '';
      if (contentIdx !== -1) {
        const start = Math.max(0, contentIdx - 60);
        const end = Math.min(meta.content.length, contentIdx + query.length + 60);
        snippet = meta.content.slice(start, end).replace(/\n/g, ' ').trim();
        if (start > 0) snippet = '…' + snippet;
        if (end < meta.content.length) snippet = snippet + '…';
      }
      results.push({ path: filePath, name: meta.name, ext: meta.ext, snippet });
    }
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  res.json(results);
});

// POST /api/register — copy a file into ./docs/
app.post('/api/register', (req, res) => {
  const { sourcePath } = req.body;
  if (!sourcePath || typeof sourcePath !== 'string') {
    return res.status(400).json({ error: 'sourcePath required' });
  }

  const absSource = path.resolve(sourcePath);
  const ext = path.extname(absSource).toLowerCase().slice(1);
  if (!['md', 'html'].includes(ext)) {
    return res.status(400).json({ error: 'Only .md and .html files are supported' });
  }

  if (!fs.existsSync(absSource)) {
    return res.status(400).json({ error: 'Source file does not exist' });
  }

  const fileName = path.basename(absSource);
  const destPath = path.join(DOCS_DIR, fileName);

  // Ensure dest is inside DOCS_DIR
  if (!destPath.startsWith(DOCS_DIR + path.sep) && destPath !== DOCS_DIR) {
    return res.status(400).json({ error: 'Invalid destination path' });
  }

  try {
    fs.copyFileSync(absSource, destPath);
    const rel = relativePath(destPath);
    // Chokidar will pick it up, but return immediately
    res.json({ path: rel, name: fileName, ext });
  } catch (err) {
    res.status(500).json({ error: 'Failed to copy file: ' + err.message });
  }
});

// POST /api/upload — write file content directly into ./docs/
app.post('/api/upload', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || typeof filename !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'filename and content required' });
  }
  const ext = path.extname(filename).toLowerCase().slice(1);
  if (!['md', 'html'].includes(ext)) {
    return res.status(400).json({ error: 'Only .md and .html files are supported' });
  }
  const safeName = path.basename(filename);
  const destPath = path.join(DOCS_DIR, safeName);
  if (!destPath.startsWith(DOCS_DIR + path.sep)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  try {
    fs.writeFileSync(destPath, content, 'utf8');
    const rel = relativePath(destPath);
    res.json({ path: rel, name: safeName, ext });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write file: ' + err.message });
  }
});

// DELETE /api/file?path=<rel> — delete file from docs/
app.delete('/api/file', (req, res) => {
  const relPath = req.query.path;
  if (!relPath || !isSafePath(relPath)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  const absPath = path.join(DOCS_DIR, relPath);
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  try {
    fs.unlinkSync(absPath);
    fileIndex.delete(relPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete file: ' + err.message });
  }
});

// Fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FastDoc running at http://localhost:${PORT}`);
});
