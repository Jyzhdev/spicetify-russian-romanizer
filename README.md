<div align="center">

# 🇷🇺 Russian Lyrics Romanizer

### A [Spicetify](https://spicetify.app) extension that converts Russian Cyrillic lyrics into phonetic English — so you can sing along without knowing Cyrillic!

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Spicetify](https://img.shields.io/badge/Spicetify-Extension-1DB954?logo=spotify&logoColor=white)](https://spicetify.app)

</div>

---

## ✨ What It Does

When you open the **Lyrics** view in Spotify for a Russian song, the extension automatically converts the Cyrillic text into readable phonetic English (romanization) in real time.

**Before:**
> Я хочу, чтобы ты была счастлива

**After:**
> Ya khochu, chtoby ty byla schastliva

- ✅ Works on **Spotify's built-in Lyrics panel**
- ✅ Uses a phonetic romanization standard (BGN/PCGN-based)
- ✅ **Topbar toggle** — switch on/off with one click, state is remembered
- ✅ Leaves non-Russian lyrics (Latin, etc.) completely untouched
- ✅ Works on **Windows, macOS, and Linux**

---

## 📦 Installation

### Method 1: Spicetify Marketplace (Recommended)

> The easiest way. No manual steps needed.

1. Make sure you have [Spicetify](https://spicetify.app/docs/getting-started) and the [Marketplace](https://spicetify.app/docs/customization/marketplace) installed.
2. Open Spotify → click the **Marketplace** icon in the topbar.
3. Go to the **Extensions** tab.
4. Search for **"Russian Lyrics Romanizer"**.
5. Click **Install** — done! 🎉

---

### Method 2: Manual Installation

1. **Download** [`russian-romanizer.js`](russian-romanizer.js) from this repository.

2. **Copy** the file to your Spicetify Extensions folder:

   | OS | Path |
   |---|---|
   | **Windows** | `%appdata%\spicetify\Extensions\` |
   | **macOS / Linux** | `~/.config/spicetify/Extensions/` |

3. **Enable** the extension and apply:

   ```bash
   spicetify config extensions russian-romanizer.js
   spicetify apply
   ```

4. **Restart Spotify** if it doesn't reload automatically.

---

## 🎛️ Usage

After installation, you'll see a **Я** button in the Spotify topbar:

| State | Icon | Behavior |
|---|---|---|
| **ON** *(default)* | **Я** (bright) | Russian lyrics are romanized |
| **OFF** | **Я** (dimmed) | Original Cyrillic lyrics are shown |

- Click the **Я** button to toggle romanization on or off.
- Your preference is **saved automatically** — it persists across Spotify restarts.
- A small notification pops up to confirm the toggle state.

---

## 🔤 Romanization Standard

The extension uses a highly optimized **phonetic transliteration** based on the BGN/PCGN standard — refined for natural sing-along readability:

| Cyrillic | Romanized | Context Rules / Example |
|---|---|---|
| **Е / е** | **Ye / ye** or **E / e** | **Ye** at start of words or after vowels/special chars (e.g. *Ельник → Yelnik*, *Киев → Kiyev*). **E** after consonants (e.g. *сестра → sestra*, *нет → net*). |
| **Ё / ё** | **Yo / yo** or **O / o** | **O** after sibilants (ж, ч, ш, щ) (e.g. *ещё → yeshcho*, *жёлтый → zholtyy*). **Yo** elsewhere (e.g. *Ёж → Yozh*). |
| **Ж / ж** | **Zh / zh** | *Жизнь → Zhizn* |
| **Х / х** | **Kh / kh** | *Хорошо → Khorosho* |
| **Ц / ц** | **Ts / ts** | *Цветок → Tsvetok* |
| **Ч / ч** | **Ch / ch** | *Человек → Chelovek* |
| **Ш / ш** | **Sh / sh** | *Школа → Shkola* |
| **Щ / щ** | **Shch / shch** | *Щука → Shchuka* |
| **Ю / ю** | **Yu / yu** | *Юность → Yunost* |
| **Я / я** | **Ya / ya** | *Язык → Yazyk* |
| **Ъ / Ь** | *(silent)* | Eliminated as in standard. |

> [!TIP]
> **Perfect Digraph Capitalization**: The extension automatically capitalizes full digraphs in uppercase contexts. For example, instead of ugly mixed-case like `"YeSLI"` or `"YaD"`, it produces `"YESLI"` and `"YAD"`.

---

## 🛠️ How It Works

1. **Waits** for Spicetify's core APIs (Player, Platform, Topbar) to be fully active.
2. **Registers** a native topbar button (Я) using the official `Spicetify.Topbar.Button` API for flawless, theme-compatible integration that won't break on Spotify updates.
3. **Synchronizes** at 60 FPS via a `requestAnimationFrame` loop. This eliminates active-line flickering caused by Spotify constantly re-rendering active lines.
4. **Caches** text nodes using a memory-safe JavaScript `WeakMap` (`ORIGINAL_CACHE`). When lyrics are romanized, original Russian is stored in the cache so that subsequent frames have virtually zero processing overhead.
5. **Restores** original text instantly when romanization is toggled off.

---

## 🤝 Contributing

Found a bug or want to improve the transliteration? Open an [issue](https://github.com/Jyzhdev/spicetify-russian-romanizer/issues) or submit a [pull request](https://github.com/Jyzhdev/spicetify-russian-romanizer/pulls)!

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
Made with ❤️ by <a href="https://github.com/Jyzhdev">Jyzhdev</a>
</div>
