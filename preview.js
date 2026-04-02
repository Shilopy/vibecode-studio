// ═══════════════════════════════════════
// preview.js — Live preview & Python runner
// ═══════════════════════════════════════

const PREVIEW = {
  pyodide: null,
  pyodideLoading: false,
  pyodideReady: false,

  async init() {
    // Start loading Pyodide in the background
    this._loadPyodide();
  },

  async _loadPyodide() {
    if (this.pyodideLoading) return;
    this.pyodideLoading = true;

    try {
      const loader = document.createElement('div');
      loader.id = 'pyodide-loader';
      loader.textContent = '🐍 Загружаю Python движок...';
      document.getElementById('editor-zone').style.position = 'relative';
      document.getElementById('editor-zone').appendChild(loader);

      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      });
      this.pyodideReady = true;
      loader.remove();
      TERMINAL.log('🐍 Python готов! Можешь писать Python код.', 'ok');
    } catch (e) {
      const loader = document.getElementById('pyodide-loader');
      if (loader) loader.remove();
      console.warn('Pyodide не загружен:', e);
    }
  },

  run() {
    const lang = document.getElementById('langSelect').value;

    if (lang === 'python') {
      this.runPython();
    } else {
      this.runHTML();
    }
  },

  runHTML() {
    // Assemble multi-file project
    const files = FILES.getAllForPreview();
    const iframe = document.getElementById('preview');

    // Find index.html or the active file
    let html = files['index.html'] || FILES.getContent(FILES.active);

    // If we have separate CSS files, inject them
    const cssFiles = Object.entries(files)
      .filter(([n]) => n.endsWith('.css'))
      .map(([n, c]) => `<style>/* ${n} */\n${c}</style>`)
      .join('\n');

    // If we have separate JS files, inject them
    const jsFiles = Object.entries(files)
      .filter(([n]) => n.endsWith('.js') && n !== 'script.js')
      .map(([n, c]) => `<script>/* ${n} */\n${c}<\/script>`)
      .join('\n');

    // Inline external CSS/JS references in the HTML
    let assembled = html;

    // Replace <link rel="stylesheet" href="style.css"> with inlined styles
    Object.entries(files).forEach(([name, content]) => {
      if (name.endsWith('.css')) {
        const re = new RegExp(`<link[^>]+href=["']${name}["'][^>]*>`, 'gi');
        assembled = assembled.replace(re, `<style>${content}</style>`);
      }
      if (name.endsWith('.js')) {
        const re = new RegExp(`<script[^>]+src=["']${name}["'][^>]*><\/script>`, 'gi');
        assembled = assembled.replace(re, `<script>${content}<\/script>`);
      }
    });

    const blob = new Blob([assembled], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);

    TERMINAL.log('▶ Запущен HTML проект', 'ok');
  },

  async runPython() {
    const code = EDITOR.getCurrentCode();
    if (!code.trim()) return;

    TERMINAL.log('🐍 Запускаю Python...', 'cmd');

    if (!this.pyodideReady) {
      TERMINAL.log('⏳ Python ещё загружается, подожди...', 'out');
      // Try to load and wait
      if (!this.pyodideLoading) await this._loadPyodide();
      // Poll for ready
      let tries = 0;
      while (!this.pyodideReady && tries < 30) {
        await new Promise(r => setTimeout(r, 500));
        tries++;
      }
      if (!this.pyodideReady) {
        TERMINAL.log('❌ Python не готов. Попробуй обновить страницу.', 'err');
        return;
      }
    }

    try {
      // Capture stdout
      let output = '';
      this.pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
      `);

      await this.pyodide.runPythonAsync(code);

      output = this.pyodide.runPython('sys.stdout.getvalue()');
      this.pyodide.runPython('sys.stdout = sys.__stdout__');

      if (output) {
        output.split('\n').forEach(line => {
          if (line) TERMINAL.log(line, 'out');
        });
      }

      TERMINAL.log('✅ Python выполнен успешно', 'ok');

      // Check if matplotlib figure was created
      try {
        const figCheck = this.pyodide.runPython(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io, base64
buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight', facecolor='white')
buf.seek(0)
base64.b64encode(buf.getvalue()).decode('utf-8')
        `);
        if (figCheck) {
          const iframe = document.getElementById('preview');
          iframe.srcdoc = `<html><body style="margin:0;background:#1a1a2e;display:flex;align-items:center;justify-content:center;min-height:100vh;">
            <img src="data:image/png;base64,${figCheck}" style="max-width:100%;max-height:100%;" />
          </body></html>`;
          this.pyodide.runPython('plt.close()');
        }
      } catch(e) {
        // No matplotlib, that's fine
      }

    } catch (err) {
      this.pyodide.runPython('import sys; sys.stdout = sys.__stdout__');
      TERMINAL.log('❌ Ошибка Python: ' + err.message, 'err');
    }
  },

  refresh() {
    this.run();
  },
};
