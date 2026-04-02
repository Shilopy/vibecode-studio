// ═══════════════════════════════════════
// github.js — GitHub API integration
// ═══════════════════════════════════════

const GITHUB = {
  token: '',
  user: null,

  init() {
    // Load saved token (with warning about security)
    const saved = localStorage.getItem('vc_gh_token');
    if (saved) {
      this.token = saved;
      this._loginWithToken(saved, true); // silent=true
    }

    this._bindEvents();
  },

  _bindEvents() {
    document.getElementById('btnGhLogin').addEventListener('click', () => {
      const token = document.getElementById('ghToken').value.trim();
      if (!token) { TOAST.show('Введи GitHub токен!', 'err'); return; }
      this._loginWithToken(token);
    });

    document.getElementById('btnGhLogout').addEventListener('click', () => this.logout());
    document.getElementById('btnGhSave').addEventListener('click', () => this.showSaveModal());
    document.getElementById('btnGhPublish').addEventListener('click', () => this.publishPages());

    // Topbar publish button
    document.getElementById('btnPublish').addEventListener('click', () => {
      if (!this.user) {
        TOAST.show('Сначала войди в GitHub!', 'err');
        // Switch to github tab
        document.querySelector('[data-tab="github"]').click();
      } else {
        this.publishPages();
      }
    });

    // Share button
    document.getElementById('btnShare').addEventListener('click', () => this.share());

    // Modal buttons
    document.getElementById('btnCancelGh').addEventListener('click', () => {
      document.getElementById('modalGhSave').style.display = 'none';
    });
    document.getElementById('btnConfirmGh').addEventListener('click', () => this.saveToGitHub());
  },

  async _loginWithToken(token, silent = false) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!res.ok) throw new Error('Неверный токен');

      const user = await res.json();
      this.token = token;
      this.user = user;

      // Store (with security warning already shown)
      localStorage.setItem('vc_gh_token', token);

      // Update UI
      document.getElementById('ghLoginSection').style.display = 'none';
      document.getElementById('ghUserSection').style.display = 'flex';
      document.getElementById('ghUserSection').style.flexDirection = 'column';
      document.getElementById('ghUserSection').style.gap = '6px';
      document.getElementById('ghAvatar').src = user.avatar_url;
      document.getElementById('ghUsername').textContent = user.login;

      if (!silent) {
        TOAST.show(`🐙 Вошёл как ${user.login}!`, 'ok');
        TERMINAL.log(`🐙 GitHub: вошёл как ${user.login}`, 'ok');
      }

      // Load repos
      this.loadRepos();

    } catch(e) {
      if (!silent) {
        TOAST.show('❌ Ошибка входа: ' + e.message, 'err');
        TERMINAL.log('❌ GitHub ошибка: ' + e.message, 'err');
      } else {
        // Silent fail - just clear stored token
        localStorage.removeItem('vc_gh_token');
        this.token = '';
      }
    }
  },

  logout() {
    this.token = '';
    this.user = null;
    localStorage.removeItem('vc_gh_token');
    document.getElementById('ghLoginSection').style.display = 'block';
    document.getElementById('ghUserSection').style.display = 'none';
    document.getElementById('ghToken').value = '';
    TOAST.show('👋 Вышел из GitHub', 'info');
  },

  async loadRepos() {
    if (!this.token) return;
    try {
      const res = await fetch('https://api.github.com/user/repos?per_page=20&sort=updated', {
        headers: { 'Authorization': `token ${this.token}` }
      });
      const repos = await res.json();
      const list = document.getElementById('repoList');
      if (!Array.isArray(repos)) { list.innerHTML = '<div class="hint-text">Нет репозиториев</div>'; return; }

      list.innerHTML = repos.slice(0, 15).map(r =>
        `<div class="repo-item" data-repo="${r.name}" data-owner="${r.owner.login}">
          📁 ${r.name}
        </div>`
      ).join('');

      list.querySelectorAll('.repo-item').forEach(el => {
        el.addEventListener('click', () => this.loadRepo(el.dataset.owner, el.dataset.repo));
      });
    } catch(e) {
      console.error('GitHub repos:', e);
    }
  },

  async loadRepo(owner, repo) {
    TERMINAL.log(`📂 Загружаю репозиторий ${owner}/${repo}...`, 'cmd');
    TOAST.show(`📂 Загружаю ${repo}...`, 'info');

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
        headers: { 'Authorization': `token ${this.token}` }
      });
      const files = await res.json();

      // Clear current files
      FILES.store = {};

      for (const file of files) {
        if (file.type === 'file' && file.size < 100000) {
          const fileRes = await fetch(file.download_url);
          const content = await fileRes.text();
          FILES.store[file.name] = content;
        }
      }

      FILES.active = Object.keys(FILES.store)[0] || 'index.html';
      FILES.save();
      FILES.render();
      EDITOR.loadFile(FILES.active);
      TOAST.show(`✅ Загружен ${repo}!`, 'ok');
      TERMINAL.log(`✅ Загружено ${Object.keys(FILES.store).length} файлов`, 'ok');

    } catch(e) {
      TOAST.show('❌ Ошибка загрузки', 'err');
      TERMINAL.log('❌ ' + e.message, 'err');
    }
  },

  showSaveModal() {
    if (!this.user) { TOAST.show('Сначала войди в GitHub!', 'err'); return; }
    document.getElementById('modalGhSave').style.display = 'flex';
    document.getElementById('ghRepoName').focus();
  },

  async saveToGitHub() {
    const repoName = document.getElementById('ghRepoName').value.trim()
      .replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const desc = document.getElementById('ghRepoDesc').value.trim() || 'Проект из VibeCode Studio';

    if (!repoName) { TOAST.show('Введи название проекта!', 'err'); return; }

    document.getElementById('modalGhSave').style.display = 'none';
    TERMINAL.log(`💾 Сохраняю ${repoName} в GitHub...`, 'cmd');
    TOAST.show('⏳ Сохраняю...', 'info');

    try {
      // Create or check repo
      const repoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: desc,
          private: false,
          auto_init: false,
        })
      });

      const repoData = await repoRes.json();
      const repoFullName = repoData.full_name || `${this.user.login}/${repoName}`;

      // Push all files
      const files = FILES.getAllForPreview();
      for (const [fileName, content] of Object.entries(files)) {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        await fetch(`https://api.github.com/repos/${repoFullName}/contents/${fileName}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `VibeCode: обновление ${fileName}`,
            content: encoded,
          })
        });
      }

      TOAST.show(`✅ Сохранено: ${repoName}!`, 'ok');
      TERMINAL.log(`✅ Сохранено в https://github.com/${repoFullName}`, 'ok');
      this.loadRepos();

    } catch(e) {
      TOAST.show('❌ Ошибка сохранения', 'err');
      TERMINAL.log('❌ ' + e.message, 'err');
    }
  },

  async publishPages() {
    if (!this.user) { TOAST.show('Сначала войди в GitHub!', 'err'); return; }

    const repoName = prompt('Название проекта для публикации:', 'my-vibe-site');
    if (!repoName) return;

    const cleanName = repoName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    TERMINAL.log(`🌐 Публикую ${cleanName} на GitHub Pages...`, 'cmd');

    try {
      // Create repo
      await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          description: 'Опубликовано из VibeCode Studio ✨',
          private: false,
          auto_init: false,
        })
      });

      const repoFullName = `${this.user.login}/${cleanName}`;

      // Push files
      const files = FILES.getAllForPreview();
      for (const [fileName, content] of Object.entries(files)) {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        await fetch(`https://api.github.com/repos/${repoFullName}/contents/${fileName}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'VibeCode: публикация',
            content: encoded,
          })
        });
      }

      // Enable GitHub Pages
      await fetch(`https://api.github.com/repos/${repoFullName}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: { branch: 'main', path: '/' }
        })
      });

      const pageUrl = `https://${this.user.login}.github.io/${cleanName}/`;
      TOAST.show('🌐 Опубликовано!', 'ok');
      TERMINAL.log(`🌐 Сайт будет доступен через ~1 мин: ${pageUrl}`, 'ok');

      // Copy to clipboard
      navigator.clipboard?.writeText(pageUrl).then(() => {
        TOAST.show('📋 Ссылка скопирована!', 'info');
      });

    } catch(e) {
      TOAST.show('❌ Ошибка публикации', 'err');
      TERMINAL.log('❌ ' + e.message, 'err');
    }
  },

  share() {
    const code = EDITOR.getCurrentCode();
    const encoded = encodeURIComponent(code);
    // Create a data URI shareable link
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    navigator.clipboard?.writeText(code).then(() => {
      TOAST.show('📋 Код скопирован в буфер!', 'ok');
    });
    TERMINAL.log('📋 Код скопирован — можешь отправить в Telegram!', 'ok');
  },
};
