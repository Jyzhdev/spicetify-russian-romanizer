// NAME: Russian Lyrics Romanizer
// AUTHOR: Jyzhdev
// DESCRIPTION: Romanizes Russian Cyrillic lyrics into phonetic English in Spotify's Lyrics view. Toggle on/off from the topbar.
// VERSION: 1.1.0

(function RussianRomanizer() {
    // ─── Prerequisites ────────────────────────────────────────────────────────
    if (!Spicetify?.Player || !Spicetify?.Platform || !Spicetify?.Topbar) {
        setTimeout(RussianRomanizer, 200);
        return;
    }

    const STORAGE_KEY = "russianRomanizer:enabled";
    const CYRILLIC_RE = /[\u0400-\u04FF]/;
    const ORIGINAL_CACHE = new WeakMap(); // Secure storage for original Russian text nodes

    const CHAR_MAP = {
        "А": "A",  "Б": "B",  "В": "V",  "Г": "G",  "Д": "D",
        "Е": "Ye", "Ё": "Yo", "Ж": "Zh", "З": "Z",  "И": "I",
        "Й": "Y",  "К": "K",  "Л": "L",  "М": "M",  "Н": "N",
        "О": "O",  "П": "P",  "Р": "R",  "С": "S",  "Т": "T",
        "У": "U",  "Ф": "F",  "Х": "Kh", "Ц": "Ts", "Ч": "Ch",
        "Ш": "Sh", "Щ": "Shch","Ъ": "",  "Ы": "Y",  "Ь": "",
        "Э": "E",  "Ю": "Yu", "Я": "Ya",
        "а": "a",  "б": "b",  "в": "v",  "г": "g",  "д": "d",
        "е": "ye", "ё": "yo", "ж": "zh", "з": "z",  "и": "i",
        "й": "y",  "к": "k",  "л": "l",  "м": "m",  "н": "n",
        "о": "o",  "п": "p",  "р": "r",  "с": "s",  "т": "t",
        "у": "u",  "ф": "f",  "х": "kh", "ц": "ts", "ч": "ch",
        "ш": "sh", "щ": "shch","ъ": "", "ы": "y",  "ь": "",
        "э": "e",  "ю": "yu", "я": "ya",
    };

    let isEnabled = Spicetify.LocalStorage.get(STORAGE_KEY) !== "false";

    function romanize(text) {
        let result = "";
        for (const char of text) {
            result += CHAR_MAP[char] !== undefined ? CHAR_MAP[char] : char;
        }
        return result;
    }

    // ─── The Forced Sync Loop (The "Nuclear" Fix) ─────────────────────────────
    function syncFrame() {
        if (!Spicetify?.Player) return; // Guard
        
        requestAnimationFrame(syncFrame); // Keep the loop going 60x per second

        // Only search lyrics container to maintain extreme performance
        const container = (
            document.querySelector(".lyrics-lyrics-container") ||
            document.querySelector('[data-testid="fullscreen-lyric"]')?.closest('[class*="lyrics"]') ||
            document.querySelector('[class*="Lyrics"]') ||
            document.querySelector('[data-testid="lyrics-container"]') ||
            document.querySelector('[class*="lyric"]')
        );

        if (!container) return;

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            const currentText = node.nodeValue;
            if (!currentText) continue;

            const isCyrillic = CYRILLIC_RE.test(currentText);

            // ── ENABLED: FORCE ROMANIZATION ──
            if (isEnabled) {
                if (isCyrillic) {
                    if (!ORIGINAL_CACHE.has(node)) {
                        ORIGINAL_CACHE.set(node, currentText);
                    }
                    const rom = romanize(currentText);
                    if (node.nodeValue !== rom) {
                        node.nodeValue = rom;
                    }
                }
            } 
            // ── DISABLED: RESTORE RUSSIAN ──
            else if (ORIGINAL_CACHE.has(node)) {
                const original = ORIGINAL_CACHE.get(node);
                if (node.nodeValue !== original) {
                    node.nodeValue = original;
                }
            }
        }
    }

    // ─── Topbar Toggle Button ─────────────────────────────────────────────────
    const TOGGLE_SVG_ON = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <text x="3" y="19" font-size="20" font-family="Helvetica, Arial, sans-serif" font-weight="bold">Я</text>
        </svg>`;
    const TOGGLE_SVG_OFF = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.5">
            <text x="3" y="19" font-size="20" font-family="Helvetica, Arial, sans-serif" font-weight="bold">Я</text>
        </svg>`;

    let toggleBtn = null;

    function createToggleButton() {
        if (document.getElementById("rr-toggle-btn")) return;
        toggleBtn = document.createElement("button");
        toggleBtn.id = "rr-toggle-btn";
        toggleBtn.className = "rr-topbar-button";
        toggleBtn.setAttribute("aria-label", "Toggle Russian Romanization");
        toggleBtn.innerHTML = isEnabled ? TOGGLE_SVG_ON : TOGGLE_SVG_OFF;

        toggleBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            isEnabled = !isEnabled;
            Spicetify.LocalStorage.set(STORAGE_KEY, String(isEnabled));
            toggleBtn.innerHTML = isEnabled ? TOGGLE_SVG_ON : TOGGLE_SVG_OFF;
            
            Spicetify.showNotification(
                isEnabled ? "🇷🇺 Russian Romanizer: ON" : "Russian Romanizer: OFF",
                false, 1500
            );
        };

        if (!document.getElementById("rr-styles")) {
            const style = document.createElement("style");
            style.id = "rr-styles";
            style.textContent = `
                #rr-toggle-btn {
                    display: flex !important; align-items: center !important; justify-content: center !important;
                    width: 32px !important; height: 32px !important; background: transparent !important;
                    border: none !important; border-radius: 50% !important; margin-right: 8px !important;
                    color: white !important; cursor: pointer !important;
                    transition: background 0.2s ease, transform 0.1s ease !important;
                    -webkit-app-region: no-drag !important; z-index: 99 !important;
                }
                #rr-toggle-btn:hover { background: rgba(255, 255, 255, 0.1) !important; }
                #rr-toggle-btn:active { transform: scale(0.9); }
                #rr-toggle-btn svg { pointer-events: none !important; }
            `;
            document.head.appendChild(style);
        }
        positionButton();
    }

    function positionButton() {
        if (!toggleBtn) return;
        const bell = document.querySelector('[data-testid="notification-indicator"]') || 
                     document.querySelector('button[aria-label="Notifications"]') ||
                     document.querySelector('.main-topBar-topbarContentRight button');
        if (bell) {
            const bellBtn = bell.tagName === "BUTTON" ? bell : bell.closest("button");
            const container = bellBtn?.parentElement || document.querySelector(".main-topBar-topbarContentRight");
            if (container && toggleBtn.parentElement !== container) {
                container.insertBefore(toggleBtn, bellBtn || container.firstChild);
            }
        }
    }

    // ─── Initialization ───────────────────────────────────────────────────────
    setTimeout(() => {
        requestAnimationFrame(syncFrame); // Start the frame loop
        createToggleButton();
        const topbarObserver = new MutationObserver(positionButton);
        topbarObserver.observe(document.body, { childList: true, subtree: true });
    }, 2000);

    console.log(`[Russian Romanizer] Atomic Romanizer Loaded.`);
})();
