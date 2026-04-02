// ═══════════════════════════════════════
// terminal.js — In-browser terminal
// ═══════════════════════════════════════

const TERMINAL = {
  history: [],
  historyIndex: -1,

  init() {
    const input = document.getElementById('termInput');
    if (!input) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (cmd) {
          this.history.unshift(cmd);
          this.historyIndex = -1;
          this.execute(cmd);
          input.value = '';
        }
      }
      if (e.key === 'ArrowUp') {
        this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
        input.value = this.history[this.historyIndex] || '';
      }
      if (e.key === 'ArrowDown') {
        this.historyIndex = Math.max(this.historyIndex - 1, -1);
        input.value = this.historyIndex >= 0 ? this.history[this.historyIndex] : '';
      }
    });

    document.getElementById('btnClearTerm').addEventListener('click', () => this.clear());

    this.log('✨ VibeCode Terminal готов!', 'ok');
    this.log('Введи "help" для списка команд', 'out');
  },

  log(text, type = 'out') {
    const out = document.getElementById('terminal-output');
    if (!out) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  },

  clear() {
    const out = document.getElementById('terminal-output');
    if (out) out.innerHTML = '';
    this.log('🗑 Терминал очищен', 'out');
  },

  execute(cmd) {
    this.log(`$ ${cmd}`, 'cmd');

    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        this.log('Доступные команды:', 'out');
        this.log('  help          — Эта справка', 'out');
        this.log('  ls            — Список файлов проекта', 'out');
        this.log('  run           — Запустить проект', 'out');
        this.log('  new [имя]     — Создать файл', 'out');
        this.log('  rm [имя]      — Удалить файл', 'out');
        this.log('  cat [имя]     — Показать содержимое файла', 'out');
        this.log('  clear         — Очистить терминал', 'out');
        this.log('  template [имя]— Загрузить шаблон (hello/robot/game/chart)', 'out');
        this.log('  save          — Сохранить в localStorage', 'out');
        this.log('  files         — Показать все файлы', 'out');
        this.log('  echo [текст]  — Вывести текст', 'out');
        this.log('  python [код]  — Выполнить Python', 'out');
        break;

      case 'ls':
      case 'files':
        const fileNames = Object.keys(FILES.store);
        if (fileNames.length === 0) {
          this.log('Нет файлов', 'out');
        } else {
          fileNames.forEach(f => this.log(`  📄 ${f}`, 'out'));
        }
        break;

      case 'run':
        PREVIEW.run();
        this.log('▶ Запуск...', 'ok');
        break;

      case 'new':
      case 'touch':
        if (args[0]) {
          FILES.create(args[0], '');
          this.log(`✅ Создан файл: ${args[0]}`, 'ok');
        } else {
          this.log('Укажи имя файла: new имяфайла.html', 'err');
        }
        break;

      case 'rm':
      case 'delete':
        if (args[0]) {
          FILES.remove(args[0]);
        } else {
          this.log('Укажи имя файла: rm имяфайла.html', 'err');
        }
        break;

      case 'cat':
        if (args[0]) {
          const content = FILES.getContent(args[0]);
          if (content !== undefined) {
            content.split('\n').slice(0, 30).forEach(line => this.log(line, 'out'));
            if (content.split('\n').length > 30) {
              this.log(`... (${content.split('\n').length - 30} строк обрезано)`, 'out');
            }
          } else {
            this.log(`Файл не найден: ${args[0]}`, 'err');
          }
        } else {
          this.log('Укажи имя файла: cat index.html', 'err');
        }
        break;

      case 'clear':
        this.clear();
        return;

      case 'template':
        if (args[0] && ['hello','robot','game','chart'].includes(args[0])) {
          FILES.loadTemplate(args[0]);
          FILES.render();
          EDITOR.loadFile(FILES.active);
          this.log(`✅ Шаблон "${args[0]}" загружен!`, 'ok');
        } else {
          this.log('Шаблоны: hello, robot, game, chart', 'out');
        }
        break;

      case 'save':
        FILES.save();
        this.log('💾 Сохранено в localStorage!', 'ok');
        break;

      case 'echo':
        this.log(args.join(' '), 'out');
        break;

      case 'python':
        if (args.length > 0) {
          const code = args.join(' ');
          this._runPythonLine(code);
        } else {
          this.log('Использование: python print("Hello!")', 'out');
        }
        break;

      case 'date':
        this.log(new Date().toLocaleString('ru-RU'), 'out');
        break;

      case 'version':
        this.log('VibeCode Studio v1.0.0 ⚡', 'ok');
        this.log('Made with 💖 for young coders', 'out');
        break;

      default:
        this.log(`Команда не найдена: "${command}". Введи "help" для справки.`, 'err');
    }
  },

  async _runPythonLine(code) {
    if (!PREVIEW.pyodideReady) {
      this.log('⏳ Python ещё загружается...', 'out');
      return;
    }
    try {
      PREVIEW.pyodide.runPython('import sys; from io import StringIO; sys.stdout = StringIO()');
      PREVIEW.pyodide.runPython(code);
      const out = PREVIEW.pyodide.runPython('sys.stdout.getvalue()');
      PREVIEW.pyodide.runPython('sys.stdout = sys.__stdout__');
      if (out) out.split('\n').filter(Boolean).forEach(l => this.log(l, 'out'));
      else this.log('(нет вывода)', 'out');
    } catch(e) {
      PREVIEW.pyodide.runPython('import sys; sys.stdout = sys.__stdout__');
      this.log('❌ ' + e.message, 'err');
    }
  },
};
