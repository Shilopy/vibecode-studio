// ═══════════════════════════════════════
// editor.js — CodeMirror editor setup
// ═══════════════════════════════════════

const EDITOR = {
  cm: null,

  init() {
    const textarea = document.getElementById('codeEditor');
    this.cm = CodeMirror.fromTextArea(textarea, {
      theme: 'dracula',
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      indentUnit: 2,
      tabSize: 2,
      lineWrapping: false,
      mode: 'htmlmixed',
      extraKeys: {
        'Ctrl-Enter': () => PREVIEW.run(),
        'Ctrl-S':     () => { FILES.setContent(FILES.active, this.cm.getValue()); TOAST.show('💾 Сохранено!', 'ok'); },
        'Tab': (cm) => cm.replaceSelection('  '),
      },
    });

    // Expose globally for easy access
    window.cmEditor = this.cm;

    // Auto-save on change (debounced)
    let saveTimer;
    this.cm.on('change', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (FILES.active) {
          FILES.setContent(FILES.active, this.cm.getValue());
        }
      }, 800);
    });
  },

  loadFile(name) {
    if (!this.cm) return;
    const content = FILES.getContent(name);
    this.cm.setValue(content);
    this.cm.setOption('mode', this._modeFor(name));
    this.cm.clearHistory();
    // Refresh to fix layout
    setTimeout(() => this.cm.refresh(), 50);
  },

  getCurrentCode() {
    return this.cm ? this.cm.getValue() : '';
  },

  setCode(code) {
    if (!this.cm) return;
    this.cm.setValue(code);
    if (FILES.active) FILES.setContent(FILES.active, code);
  },

  insertAtCursor(text) {
    if (!this.cm) return;
    const cursor = this.cm.getCursor();
    this.cm.replaceRange(text, cursor);
  },

  _modeFor(name) {
    if (name.endsWith('.html')) return 'htmlmixed';
    if (name.endsWith('.css'))  return 'css';
    if (name.endsWith('.js'))   return 'javascript';
    if (name.endsWith('.py'))   return 'python';
    return 'htmlmixed';
  },

  // Highlight a range (for AI suggestions)
  highlight(from, to) {
    if (!this.cm) return;
    this.cm.markText(from, to, { className: 'cm-highlight' });
  },
};
