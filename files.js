// ═══════════════════════════════════════
// files.js — File system & templates
// ═══════════════════════════════════════

const FILES = {
  // In-memory file store: { name: content }
  store: {},
  active: null,

  init() {
    const saved = localStorage.getItem('vc_files');
    if (saved) {
      try { this.store = JSON.parse(saved); } catch(e) {}
    }
    if (Object.keys(this.store).length === 0) {
      this.loadTemplate('hello');
    }
    this.active = Object.keys(this.store)[0];
    this.render();
  },

  save() {
    localStorage.setItem('vc_files', JSON.stringify(this.store));
  },

  create(name, content = '') {
    if (!name) return;
    name = name.trim();
    if (!name.includes('.')) name += '.html';
    if (this.store[name] !== undefined) {
      TOAST.show('Файл уже существует!', 'err'); return;
    }
    this.store[name] = content;
    this.active = name;
    this.save();
    this.render();
    EDITOR.loadFile(name);
    TOAST.show(`📄 Создан: ${name}`, 'ok');
  },

  remove(name) {
    if (!name) return;
    if (Object.keys(this.store).length === 1) {
      TOAST.show('Нельзя удалить последний файл!', 'err'); return;
    }
    delete this.store[name];
    this.active = Object.keys(this.store)[0];
    this.save();
    this.render();
    EDITOR.loadFile(this.active);
    TOAST.show(`🗑 Удалён: ${name}`, 'info');
  },

  setActive(name) {
    // Save current content first
    if (this.active && window.cmEditor) {
      this.store[this.active] = window.cmEditor.getValue();
    }
    this.active = name;
    this.render();
    EDITOR.loadFile(name);
  },

  getContent(name) {
    return this.store[name] || '';
  },

  setContent(name, content) {
    this.store[name] = content;
    this.save();
  },

  render() {
    const list = document.getElementById('fileList');
    const tabs = document.getElementById('editor-tabs');
    if (!list || !tabs) return;

    // File list in sidebar
    list.innerHTML = Object.keys(this.store).map(name => {
      const icon = this._icon(name);
      const active = name === this.active ? 'active' : '';
      return `<div class="file-item ${active}" data-name="${name}">
        <span>${icon}</span><span>${name}</span>
      </div>`;
    }).join('');

    // Editor tabs
    tabs.innerHTML = Object.keys(this.store).map(name => {
      const icon = this._icon(name);
      const active = name === this.active ? 'active' : '';
      return `<div class="editor-tab ${active}" data-name="${name}">
        ${icon} ${name}
      </div>`;
    }).join('');

    // Click handlers
    list.querySelectorAll('.file-item').forEach(el => {
      el.addEventListener('click', () => this.setActive(el.dataset.name));
    });
    tabs.querySelectorAll('.editor-tab').forEach(el => {
      el.addEventListener('click', () => this.setActive(el.dataset.name));
    });
  },

  _icon(name) {
    if (name.endsWith('.html')) return '🌐';
    if (name.endsWith('.css'))  return '🎨';
    if (name.endsWith('.js'))   return '⚡';
    if (name.endsWith('.py'))   return '🐍';
    if (name.endsWith('.md'))   return '📝';
    return '📄';
  },

  getAllForPreview() {
    // Return all files for multi-file preview assembly
    return { ...this.store };
  },

  // ─── Templates ───
  loadTemplate(name) {
    const templates = {
      hello: {
        'index.html': `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Привет, Мир! 👋</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Привет, Мир! 👋</h1>
    <p>Мой первый VibeCode проект!</p>
    <button onclick="vibe()">✨ Нажми меня!</button>
    <div id="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        'style.css': `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', sans-serif;
}
.container {
  text-align: center;
  color: white;
  padding: 40px;
}
h1 { font-size: 3em; margin-bottom: 16px; }
button {
  background: white;
  color: #764ba2;
  border: none;
  padding: 12px 28px;
  font-size: 1.1em;
  border-radius: 30px;
  cursor: pointer;
  transition: transform 0.2s;
}
button:hover { transform: scale(1.05); }
#output { margin-top: 20px; font-size: 1.5em; }`,
        'script.js': `const vibes = ['🎉', '✨', '🌈', '🦄', '💖', '🚀', '🎊'];
let i = 0;

function vibe() {
  const output = document.getElementById('output');
  output.textContent = vibes[i % vibes.length] + ' Вайб-код это круто! ' + vibes[i % vibes.length];
  output.style.animation = 'none';
  output.offsetHeight; // reflow
  output.style.animation = 'pop 0.3s ease';
  i++;
}
`,
      },

      robot: {
        'index.html': `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Мой Робот-Друг 🤖</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="scene">
    <div class="robot">
      <div class="head">
        <div class="eyes">
          <div class="eye left"></div>
          <div class="eye right"></div>
        </div>
        <div class="mouth" id="mouth">😊</div>
        <div class="antenna"></div>
      </div>
      <div class="body">
        <div class="chest-light" id="light"></div>
        <div class="arms">
          <div class="arm left" id="armL"></div>
          <div class="arm right" id="armR"></div>
        </div>
      </div>
      <div class="legs">
        <div class="leg"></div>
        <div class="leg"></div>
      </div>
    </div>
    <div class="speech-bubble" id="bubble">Привет! Я твой робот-друг! 🤖</div>
    <div class="controls">
      <button onclick="wave()">👋 Помаши</button>
      <button onclick="happy()">😊 Радуйся</button>
      <button onclick="dance()">💃 Танцуй</button>
      <button onclick="speak()">🗣 Говори</button>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        'style.css': `* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: linear-gradient(160deg, #0f0c29, #302b63, #24243e); min-height:100vh; display:flex; align-items:center; justify-content:center; font-family: 'Segoe UI', sans-serif; }
.scene { display:flex; flex-direction:column; align-items:center; gap:20px; }
.robot { display:flex; flex-direction:column; align-items:center; gap:4px; }
.head { background:#4ecdc4; width:80px; height:70px; border-radius:16px; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; box-shadow:0 0 20px rgba(78,205,196,0.4); }
.antenna { position:absolute; top:-14px; width:4px; height:14px; background:#4ecdc4; border-radius:2px; }
.antenna::before { content:''; position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:10px; height:10px; background:#ff6b6b; border-radius:50%; box-shadow:0 0 8px #ff6b6b; }
.eyes { display:flex; gap:14px; }
.eye { width:14px; height:14px; background:#fff; border-radius:50%; position:relative; }
.eye::after { content:''; position:absolute; top:3px; left:3px; width:8px; height:8px; background:#1a1a2e; border-radius:50%; transition:all 0.3s; }
.mouth { font-size:18px; transition:all 0.3s; }
.body { background:#45b7d1; width:90px; height:80px; border-radius:12px; position:relative; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(69,183,209,0.4); }
.chest-light { width:24px; height:24px; border-radius:50%; background:#7fff6e; box-shadow:0 0 15px #7fff6e; transition:all 0.3s; }
.arms { position:absolute; top:10px; left:-24px; right:-24px; display:flex; justify-content:space-between; }
.arm { width:18px; height:60px; background:#45b7d1; border-radius:9px; transition:transform 0.4s; }
.arm.left { transform-origin: top right; }
.arm.right { transform-origin: top left; }
.legs { display:flex; gap:12px; }
.leg { width:22px; height:40px; background:#4ecdc4; border-radius:0 0 8px 8px; }
.speech-bubble { background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); color:white; padding:12px 20px; border-radius:20px; font-size:14px; max-width:260px; text-align:center; transition:all 0.3s; }
.controls { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.controls button { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3); color:white; padding:8px 16px; border-radius:20px; cursor:pointer; font-size:13px; transition:all 0.2s; }
.controls button:hover { background:rgba(255,255,255,0.25); transform:scale(1.05); }
@keyframes dance { 0%,100% { transform:translateX(0) rotate(0); } 25% { transform:translateX(-10px) rotate(-5deg); } 75% { transform:translateX(10px) rotate(5deg); } }`,
        'script.js': `const phrases = [
  'Привет! Я твой робот-друг! 🤖',
  'Вайб-код — это супер! ✨',
  'Ты лучший программист! 💖',
  'Давай создадим что-нибудь крутое! 🚀',
  'Бип-буп! Обрабатываю данные... 💾',
  'Ура! Ещё один баг исправлен! 🐛✅',
];

function wave() {
  document.getElementById('armL').style.transform = 'rotate(-60deg)';
  document.getElementById('armR').style.transform = 'rotate(60deg)';
  say('Привет привет! 👋👋');
  setTimeout(() => {
    document.getElementById('armL').style.transform = '';
    document.getElementById('armR').style.transform = '';
  }, 1000);
}

function happy() {
  document.getElementById('mouth').textContent = '😄';
  document.getElementById('light').style.background = '#ff6b6b';
  document.getElementById('light').style.boxShadow = '0 0 20px #ff6b6b';
  say('Я так счастлив! 🎉');
  setTimeout(() => {
    document.getElementById('mouth').textContent = '😊';
    document.getElementById('light').style.background = '#7fff6e';
    document.getElementById('light').style.boxShadow = '0 0 15px #7fff6e';
  }, 2000);
}

function dance() {
  document.querySelector('.robot').style.animation = 'dance 0.5s ease 4';
  say('Танцуем! 💃🎵');
  setTimeout(() => document.querySelector('.robot').style.animation = '', 2200);
}

function speak() {
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  say(phrase);
}

function say(text) {
  document.getElementById('bubble').textContent = text;
}
`,
      },

      game: {
        'index.html': `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Поймай звёздочки! ⭐</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game">
    <div id="score-board">
      <span>⭐ Счёт: <b id="score">0</b></span>
      <span>⏱ Время: <b id="timer">30</b>с</span>
    </div>
    <div id="arena" onclick="handleClick(event)"></div>
    <div id="overlay">
      <h2>Поймай все звёздочки!</h2>
      <p>Нажимай на них пока не истечёт время</p>
      <button onclick="startGame()">🚀 Играть!</button>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        'style.css': `*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f0f23;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif}
#game{width:600px;max-width:100vw;height:500px;position:relative;background:linear-gradient(180deg,#0f0c29 0%,#1a1042 100%);border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)}
#score-board{position:absolute;top:0;left:0;right:0;padding:12px 20px;display:flex;justify-content:space-between;color:white;font-size:16px;background:rgba(0,0,0,0.3);z-index:10}
#arena{width:100%;height:100%;position:relative;cursor:crosshair}
.star{position:absolute;font-size:28px;cursor:pointer;user-select:none;transition:transform 0.1s;animation:starFloat 0.5s ease}
.star:hover{transform:scale(1.2)}
@keyframes starFloat{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
#overlay{position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:white;text-align:center;padding:20px}
#overlay h2{font-size:2em}
#overlay button{background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:12px 32px;font-size:1.1em;border-radius:30px;cursor:pointer;margin-top:8px}
.pop{animation:pop 0.3s ease forwards}
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(0);opacity:0}}`,
        'script.js': `let score = 0, timeLeft = 30, interval, spawnInterval, running = false;

const emojis = ['⭐','🌟','💫','✨','🎇','🎆','⚡','🌙'];

function startGame() {
  score = 0; timeLeft = 30; running = true;
  document.getElementById('score').textContent = 0;
  document.getElementById('timer').textContent = 30;
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('arena').innerHTML = '';

  interval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);

  spawnInterval = setInterval(spawnStar, 800);
  spawnStar();
}

function spawnStar() {
  if (!running) return;
  const arena = document.getElementById('arena');
  const star = document.createElement('div');
  star.className = 'star';
  star.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  star.style.left = Math.random() * 88 + '%';
  star.style.top = Math.random() * 80 + 10 + '%';
  star.onclick = (e) => {
    e.stopPropagation();
    star.classList.add('pop');
    score++;
    document.getElementById('score').textContent = score;
    setTimeout(() => star.remove(), 300);
  };
  arena.appendChild(star);
  setTimeout(() => { if (star.parentNode) star.remove(); }, 2500);
}

function endGame() {
  running = false;
  clearInterval(interval);
  clearInterval(spawnInterval);
  const overlay = document.getElementById('overlay');
  overlay.innerHTML = \`<h2>🎉 Игра окончена!</h2>
    <p>Ты поймал <b>\${score}</b> звёздочек!</p>
    <p>\${score > 20 ? '🏆 Потрясающе!' : score > 10 ? '👏 Хорошо!' : '💪 Попробуй ещё!'}</p>
    <button onclick="startGame()">🔄 Снова!</button>\`;
  overlay.style.display = 'flex';
}
`,
      },

      chart: {
        'index.html': `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Мои Данные 📊</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="dashboard">
    <h1>📊 Мои Данные</h1>
    <div class="charts">
      <div class="chart-box">
        <h3>Любимые языки программирования</h3>
        <canvas id="chart1"></canvas>
      </div>
      <div class="chart-box">
        <h3>Прогресс обучения по неделям</h3>
        <canvas id="chart2"></canvas>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        'style.css': `*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d1117;color:#e6edf3;font-family:'Segoe UI',sans-serif;min-height:100vh;padding:30px}
h1{text-align:center;font-size:2em;margin-bottom:30px;background:linear-gradient(90deg,#58a6ff,#bc8cff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:900px;margin:0 auto}
.chart-box{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px}
h3{color:#8b949e;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px}`,
        'script.js': `new Chart(document.getElementById('chart1'), {
  type: 'doughnut',
  data: {
    labels: ['JavaScript', 'Python', 'HTML/CSS', 'Java', 'Другое'],
    datasets: [{
      data: [35, 28, 20, 12, 5],
      backgroundColor: ['#f7df1e','#3776ab','#e34f26','#ed8b00','#8b949e'],
      borderWidth: 0
    }]
  },
  options: { plugins: { legend: { labels: { color: '#e6edf3' } } } }
});

new Chart(document.getElementById('chart2'), {
  type: 'line',
  data: {
    labels: ['Нед 1','Нед 2','Нед 3','Нед 4','Нед 5','Нед 6'],
    datasets: [{
      label: 'Проекты',
      data: [1, 3, 4, 7, 8, 12],
      borderColor: '#58a6ff',
      backgroundColor: 'rgba(88,166,255,0.1)',
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    scales: { x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } }, y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } } },
    plugins: { legend: { labels: { color: '#e6edf3' } } }
  }
});
`,
      },
    };

    const tpl = templates[name];
    if (!tpl) return;
    this.store = { ...tpl };
    this.active = Object.keys(tpl)[0];
    this.save();
  },
};
