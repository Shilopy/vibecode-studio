// ═══════════════════════════════════════
// app.js — Main bootstrapper & TOAST util
// ═══════════════════════════════════════

// ─── Toast notification utility ───
const TOAST = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ─── App init ───
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Init file system
  FILES.init();

  // 2. Init editor
  EDITOR.init();
  EDITOR.loadFile(FILES.active);

  // 3. Init preview
  await PREVIEW.init();

  // 4. Init terminal
  TERMINAL.init();

  // 5. Init AI
  AI.init();

  // 6. Init GitHub
  GITHUB.init();

  // 7. Wire up UI events
  _bindGlobalEvents();

  // 8. Auto-run preview on start
  setTimeout(() => PREVIEW.run(), 300);

});

function _bindGlobalEvents() {

  // ─── Sidebar tabs ───
  document.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${target}`)?.classList.add('active');
    });
  });

  // ─── Run button ───
  document.getElementById('btnRun').addEventListener('click', () => PREVIEW.run());

  // ─── Refresh preview ───
  document.getElementById('btnRefresh').addEventListener('click', () => PREVIEW.refresh());

  // ─── Fullscreen preview ───
  document.getElementById('btnFullscreen').addEventListener('click', () => {
    const iframe = document.getElementById('preview');
    if (iframe.requestFullscreen) iframe.requestFullscreen();
  });

  // ─── New file modal ───
  document.getElementById('btnNewFile').addEventListener('click', () => {
    document.getElementById('modalNewFile').style.display = 'flex';
    document.getElementById('newFileName').focus();
  });
  document.getElementById('btnCancelFile').addEventListener('click', () => {
    document.getElementById('modalNewFile').style.display = 'none';
  });
  document.getElementById('btnConfirmFile').addEventListener('click', () => {
    const name = document.getElementById('newFileName').value.trim();
    FILES.create(name);
    document.getElementById('modalNewFile').style.display = 'none';
    document.getElementById('newFileName').value = '';
  });
  document.getElementById('newFileName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btnConfirmFile').click();
  });

  // ─── Delete active file ───
  document.getElementById('btnDeleteFile').addEventListener('click', () => {
    if (confirm(`Удалить файл "${FILES.active}"?`)) {
      FILES.remove(FILES.active);
    }
  });

  // ─── Template buttons ───
  document.querySelectorAll('.tpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tpl = btn.dataset.tpl;
      if (confirm('Загрузить шаблон? Текущие файлы будут заменены.')) {
        FILES.loadTemplate(tpl);
        FILES.render();
        EDITOR.loadFile(FILES.active);
        setTimeout(() => PREVIEW.run(), 200);
        TOAST.show(`✨ Шаблон "${tpl}" загружен!`, 'ok');
      }
    });
  });

  // ─── Language switch ───
  document.getElementById('langSelect').addEventListener('change', (e) => {
    const lang = e.target.value;
    if (lang === 'python') {
      // Create or switch to a .py file
      if (!FILES.store['main.py']) {
        FILES.create('main.py', '# Python код\nprint("Привет из Python! 🐍")\n\n# Попробуй:\nfor i in range(5):\n    print(f"Шаг {i+1}: ✨")\n');
      } else {
        FILES.setActive('main.py');
      }
    } else if (lang === 'html') {
      if (!FILES.store['index.html']) {
        FILES.create('index.html', '<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>Мой сайт</title></head>\n<body>\n  <h1>Привет, Мир! 👋</h1>\n</body>\n</html>');
      } else {
        FILES.setActive('index.html');
      }
    } else if (lang === 'js') {
      if (!FILES.store['script.js']) {
        FILES.create('script.js', '// JavaScript\nconsole.log("Привет из JS! ⚡");\n\nconst message = "VibeCode крутой!";\nalert(message);\n');
      } else {
        FILES.setActive('script.js');
      }
    }
  });

  // ─── Close modals on overlay click ───
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });

  // ─── Keyboard shortcuts ───
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'Enter':
          e.preventDefault();
          PREVIEW.run();
          break;
        case 's':
          e.preventDefault();
          FILES.save();
          TOAST.show('💾 Сохранено!', 'ok');
          break;
      }
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    }
  });

  // ─── Resize observer to fix CodeMirror ───
  new ResizeObserver(() => {
    if (window.cmEditor) window.cmEditor.refresh();
  }).observe(document.getElementById('editor-wrap'));
}
