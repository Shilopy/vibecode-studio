// ═══════════════════════════════════════
// ai.js — OpenRouter AI Assistant
// ═══════════════════════════════════════

const AI = {
  apiKey: '',
  model: 'openai/gpt-4o-mini',
  chatHistory: [],

  SYSTEM_PROMPT: `Ты VibeBot — дружелюбный AI-помощник для начинающих программистов в VibeCode Studio.
Отвечай на русском языке, кратко и понятно.
Когда пишешь код, оборачивай его в блоки \`\`\`html, \`\`\`css, \`\`\`js, \`\`\`python.
После кода добавляй кнопку применения с атрибутом data-apply.
Ты помогаешь с HTML, CSS, JavaScript, Python.
Используй эмодзи для дружелюбного тона. ✨
Если создаёшь целый проект, сначала index.html, затем style.css, script.js.
Будь краток — не более 200 слов без кода.`,

  init() {
    // Load saved settings
    this.apiKey = localStorage.getItem('vc_or_key') || '';
    this.model  = localStorage.getItem('vc_or_model') || 'openai/gpt-4o-mini';

    if (this.apiKey) {
      document.getElementById('orKey').value = this.apiKey;
      document.getElementById('keyStatus').textContent = '✅ Ключ загружен';
      document.getElementById('keyStatus').className = 'status-msg ok';
    }
    if (this.model) {
      document.getElementById('orModel').value = this.model;
    }

    this._bindEvents();
    this._addWelcomeMessage();
  },

  _bindEvents() {
    document.getElementById('btnSaveKey').addEventListener('click', () => {
      const key = document.getElementById('orKey').value.trim();
      const model = document.getElementById('orModel').value;
      if (!key) { TOAST.show('Введи API ключ!', 'err'); return; }
      this.apiKey = key;
      this.model = model;
      localStorage.setItem('vc_or_key', key);
      localStorage.setItem('vc_or_model', model);
      document.getElementById('keyStatus').textContent = '✅ Сохранено!';
      document.getElementById('keyStatus').className = 'status-msg ok';
      TOAST.show('🔑 API ключ сохранён!', 'ok');
    });

    document.getElementById('btnCheckKey').addEventListener('click', () => this.checkKey());

    document.getElementById('btnShowKey').addEventListener('click', () => {
      const input = document.getElementById('orKey');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('orModel').addEventListener('change', (e) => {
      this.model = e.target.value;
      localStorage.setItem('vc_or_model', this.model);
    });

    document.getElementById('btnSend').addEventListener('click', () => this.sendMessage());

    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick prompt buttons
    document.querySelectorAll('.qp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.p;
        document.getElementById('chatInput').value = prompt;
        this.sendMessage();
      });
    });
  },

  _addWelcomeMessage() {
    this.addMessage('ai', '👋 Привет! Я VibeBot — твой AI-напарник! 🤖\n\nМогу помочь:\n• ✨ Написать или улучшить код\n• 🐛 Найти ошибки\n• 💡 Объяснить как работает код\n• 🤖 Создать робота-друга\n\nВведи свой OpenRouter API ключ слева и начнём! 🚀');
  },

  async checkKey() {
    const key = document.getElementById('orKey').value.trim();
    if (!key) { TOAST.show('Сначала введи ключ!', 'err'); return; }

    const status = document.getElementById('keyStatus');
    status.textContent = '⏳ Проверяю...';
    status.className = 'status-msg';

    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (res.ok) {
        status.textContent = '✅ Ключ работает!';
        status.className = 'status-msg ok';
        TOAST.show('✅ API ключ валидный!', 'ok');
      } else {
        status.textContent = '❌ Неверный ключ';
        status.className = 'status-msg err';
        TOAST.show('❌ Ключ не подошёл', 'err');
      }
    } catch(e) {
      status.textContent = '❌ Ошибка соединения';
      status.className = 'status-msg err';
    }
  },

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.addMessage('user', text);

    if (!this.apiKey) {
      this.addMessage('ai', '⚠️ Нет API ключа! Введи свой OpenRouter ключ в левой панели 🔑\n\nПолучить ключ: openrouter.ai');
      return;
    }

    // Show thinking state
    document.getElementById('robotStatus').className = 'robot-status thinking';
    document.getElementById('robotStatus').textContent = '🤔';
    document.getElementById('btnSend').disabled = true;

    // Add typing indicator
    const typingId = this._addTypingIndicator();

    // Build context with current code
    const currentCode = EDITOR.getCurrentCode();
    const currentFile = FILES.active;
    let userMsg = text;
    if (currentCode && currentCode.trim()) {
      userMsg += `\n\n[Текущий файл: ${currentFile}]\n\`\`\`\n${currentCode.substring(0, 3000)}\n\`\`\``;
    }

    this.chatHistory.push({ role: 'user', content: userMsg });

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'VibeCode Studio',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.SYSTEM_PROMPT },
            ...this.chatHistory.slice(-10), // Keep last 10 messages for context
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      this._removeTypingIndicator(typingId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Нет ответа';

      this.chatHistory.push({ role: 'assistant', content: reply });
      this.addMessage('ai', reply, true);

    } catch (err) {
      this._removeTypingIndicator(typingId);
      this.addMessage('ai', `❌ Ошибка: ${err.message}\n\nПроверь API ключ и подключение к интернету.`);
      TERMINAL.log('❌ AI ошибка: ' + err.message, 'err');
    } finally {
      document.getElementById('robotStatus').className = 'robot-status';
      document.getElementById('robotStatus').textContent = '😊';
      document.getElementById('btnSend').disabled = false;
    }
  },

  addMessage(role, text, parseCode = false) {
    const messages = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;

    const avatar = role === 'ai' ? '🤖' : '👤';
    let body;

    if (parseCode) {
      body = this._parseMarkdown(text);
    } else {
      body = `<span>${this._escapeHtml(text).replace(/\n/g, '<br>')}</span>`;
    }

    msg.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div class="msg-body">${body}</div>
    `;

    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;

    // Attach apply handlers
    msg.querySelectorAll('.btn-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        const lang = btn.dataset.lang;
        if (code) {
          EDITOR.setCode(decodeURIComponent(code));
          TOAST.show('✅ Код применён!', 'ok');
        }
      });
    });
  },

  _parseMarkdown(text) {
    let html = this._escapeHtml(text);

    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      lang = lang || 'code';
      const encoded = encodeURIComponent(code.trim());
      return `<pre><code>${code.trim()}</code></pre>
        <button class="btn-apply" data-code="${encoded}" data-lang="${lang}">
          ⚡ Применить в редактор
        </button>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Newlines
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  _escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  _addTypingIndicator() {
    const id = 'typing_' + Date.now();
    const messages = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.className = 'msg ai';
    el.id = id;
    el.innerHTML = `<div class="msg-avatar">🤖</div>
      <div class="msg-body"><div class="typing-dots">
        <span></span><span></span><span></span>
      </div></div>`;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return id;
  },

  _removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  },
};
