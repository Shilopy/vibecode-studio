# ⚡ VibeCode Studio

**Твоя персональная IDE прямо в браузере — учись программировать через вайб!**

![VibeCode Studio](https://img.shields.io/badge/VibeCode-Studio-7fff6e?style=flat-square)
![HTML](https://img.shields.io/badge/HTML-CSS-JS-blue?style=flat-square)
![Python](https://img.shields.io/badge/Python-Pyodide-3776ab?style=flat-square)

---

## 🚀 Быстрый старт

### Вариант 1: Открыть локально
Просто открой `index.html` в браузере — готово!

### Вариант 2: GitHub Pages (бесплатный хостинг)

1. Создай репозиторий на GitHub
2. Загрузи все файлы
3. Включи GitHub Pages: `Settings → Pages → Source: main branch`
4. Открой: `https://ИМЯ.github.io/vibecode-studio/`

---

## 📁 Структура файлов

```
vibecode-studio/
├── index.html    — Главная страница (подключает все файлы)
├── style.css     — Все стили (тёмная тема, анимации)
├── files.js      — Файловая система проекта + шаблоны
├── editor.js     — CodeMirror редактор кода
├── preview.js    — Живое превью + Python через Pyodide
├── terminal.js   — Встроенный терминал
├── ai.js         — AI-ассистент через OpenRouter
├── github.js     — Интеграция с GitHub
├── app.js        — Главный файл, связывает всё вместе
└── README.md     — Эта документация
```

---

## 🤖 Настройка AI-ассистента

1. Зарегистрируйся на [openrouter.ai](https://openrouter.ai)
2. Создай API ключ
3. В боковой панели выбери вкладку 🤖, введи ключ
4. Выбери модель (GPT-4o Mini бесплатен!)
5. Общайся с роботом-другом!

---

## 🐙 Настройка GitHub

1. Зайди на [github.com/settings/tokens](https://github.com/settings/tokens)
2. Создай токен с правами `repo` + `gist`
3. В боковой панели выбери вкладку 🐙, введи токен
4. Теперь можно:
   - 💾 Сохранять проекты в репозиторий
   - 🌐 Публиковать сайты на GitHub Pages
   - 📂 Загружать существующие проекты

> ⚠️ **Безопасность:** Не публикуй токен в открытом коде! Используй токен только с правами `repo`.

---

## ✨ Возможности

| Функция | Описание |
|---------|----------|
| 📝 Редактор | CodeMirror с подсветкой синтаксиса |
| 🖥 Живое превью | Мгновенный результат HTML/CSS/JS |
| 🐍 Python | Полноценный Python через Pyodide (WebAssembly) |
| ⚡ Терминал | Встроенная командная строка |
| 🤖 AI-ассистент | Чат с OpenRouter (GPT-4, Claude, Gemini...) |
| 🐙 GitHub | Сохранение и публикация на Pages |
| 📁 Мультифайловость | Несколько файлов в одном проекте |
| 🎨 Шаблоны | Hello World, Робот, Игра, Графики |

---

## 🎮 Горячие клавиши

| Комбинация | Действие |
|------------|----------|
| `Ctrl+Enter` | Запустить код |
| `Ctrl+S` | Сохранить файл |
| `Escape` | Закрыть модальное окно |

---

## 🐍 Примеры Python

```python
# Простой вывод
print("Привет, VibeCode! 🐍")

# Цикл
for i in range(1, 6):
    print(f"Шаг {i}: {'⭐' * i}")

# Функция
def приветствие(имя):
    return f"Привет, {имя}! 👋"

print(приветствие("Мир"))
```

---

## 💖 Создано с любовью для юных программистов

**VibeCode Studio** — место, где код превращается в магию ✨
