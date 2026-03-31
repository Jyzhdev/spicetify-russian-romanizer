// NAME: Russian Lyrics Romanizer
// AUTHOR: Jyzhdev
// DESCRIPTION: Romanizes Russian Cyrillic lyrics into phonetic English in Spotify's Lyrics view. Toggle on/off from the topbar.
// VERSION: 1.0.0

(function RussianRomanizer() {
    // ─── Wait for Spicetify to be ready ───────────────────────────────────────
    if (!Spicetify?.Player || !Spicetify?.Platform || !Spicetify?.Topbar) {
        setTimeout(RussianRomanizer, 200);
        return;
    }

    // ─── Constants ────────────────────────────────────────────────────────────
    const STORAGE_KEY = "russianRomanizer:enabled";
    const ATTR_ORIGINAL = "data-rr-original";
    const ATTR_ROMANIZED = "data-rr-romanized";

    // ─── Cyrillic → Latin transliteration map (BGN/PCGN-based phonetic) ──────
    const CHAR_MAP = {
        // Uppercase
        "А": "A",  "Б": "B",  "В": "V",  "Г": "G",  "Д": "D",
        "Е": "Ye", "Ё": "Yo", "Ж": "Zh", "З": "Z",  "И": "I",
        "Й": "Y",  "К": "K",  "Л": "L",  "М": "M",  "Н": "N",
        "О": "O",  "П": "P",  "Р": "R",  "С": "S",  "Т": "T",
        "У": "U",  "Ф": "F",  "Х": "Kh", "Ц": "Ts", "Ч": "Ch",
        "Ш": "Sh", "Щ": "Shch","Ъ": "",  "Ы": "Y",  "Ь": "",
        "Э": "E",  "Ю": "Yu", "Я": "Ya",
        // Lowercase
        "а": "a",  "б": "b",  "в": "v",  "г": "g",  "д": "d",
        "е": "ye", "ё": "yo", "ж": "zh", "з": "z",  "и": "i",
        "й": "y",  "к": "k",  "л": "l",  "м": "m",  "н": "n",
        "о": "o",  "п": "p",  "р": "r",  "с": "s",  "т": "t",
        "у": "u",  "ф": "f",  "х": "kh", "ц": "ts", "ч": "ch",
        "ш": "sh", "щ": "shch","ъ": "", "ы": "y",  "ь": "",
        "э": "e",  "ю": "yu", "я": "ya",
    };

    // Regex to detect if a string contains any Cyrillic character
    const CYRILLIC_RE = /[\u0400-\u04FF]/;

    // ─── State ────────────────────────────────────────────────────────────────
    let isEnabled = Spicetify.LocalStorage.get(STORAGE_KEY) !== "false"; // default ON
    let observer = null;

    // ─── Core: transliterate a string ─────────────────────────────────────────
    function romanize(text) {
        let result = "";
        for (const char of text) {
            result += CHAR_MAP[char] !== undefined ? CHAR_MAP[char] : char;
        }
        return result;
    }

    // ─── Apply romanization to a single text node ─────────────────────────────
    function processTextNode(node) {
        const raw = node.nodeValue;
        if (!raw || !CYRILLIC_RE.test(raw)) return; // skip non-Cyrillic

        const parent = node.parentElement;
        if (!parent) return;

        // Already wrapped? skip
        if (parent.hasAttribute(ATTR_ORIGINAL)) return;

        // Wrap the text node in a <span> so we can store both versions
        const span = document.createElement("span");
        span.setAttribute(ATTR_ORIGINAL, raw);
        span.setAttribute(ATTR_ROMANIZED, romanize(raw));
        span.textContent = isEnabled ? romanize(raw) : raw;

        parent.replaceChild(span, node);
    }

    // ─── Walk and process all text nodes inside an element ────────────────────
    function processElement(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    // Skip script/style nodes
                    const tag = node.parentElement?.tagName?.toLowerCase();
                    if (tag === "script" || tag === "style") {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Only process nodes with Cyrillic
                    return CYRILLIC_RE.test(node.nodeValue)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_SKIP;
                },
            }
        );

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(processTextNode);
    }

    // ─── Update all already-processed spans ──────────────────────────────────
    function updateAllSpans() {
        document
            .querySelectorAll(`[${ATTR_ORIGINAL}]`)
            .forEach((span) => {
                span.textContent = isEnabled
                    ? span.getAttribute(ATTR_ROMANIZED)
                    : span.getAttribute(ATTR_ORIGINAL);
            });
    }

    // ─── Find the lyrics container ────────────────────────────────────────────
    function getLyricsContainer() {
        // Spotify's lyrics containers (selectors may vary across versions)
        return (
            document.querySelector(".lyrics-lyrics-container") ||
            document.querySelector('[data-testid="fullscreen-lyric"]')?.closest('[class*="lyrics"]') ||
            document.querySelector('[class*="Lyrics"]') ||
            document.querySelector('[data-testid="lyrics-container"]') ||
            document.querySelector('[class*="lyric"]')
        );
    }

    // ─── Start observing lyrics for DOM changes ───────────────────────────────
    function startObserver() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }

        // Try to find lyrics container; retry until it exists
        const container = getLyricsContainer();
        if (!container) {
            // Retry — lyrics panel may not be open yet
            setTimeout(startObserver, 1000);
            return;
        }

        // Process what's already there
        processElement(container);

        // Watch for future changes (new lines, song changes)
        observer = new MutationObserver((mutations) => {
            if (!isEnabled) return; // don't process if disabled (toggle will handle it)
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        processTextNode(node);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        processElement(node);
                    }
                }
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
        });
    }

    // ─── Topbar Toggle Button (Manual DOM) ───────────────────────────────────
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
            e.preventDefault();
            e.stopPropagation();
            
            isEnabled = !isEnabled;
            Spicetify.LocalStorage.set(STORAGE_KEY, String(isEnabled));
            
            toggleBtn.innerHTML = isEnabled ? TOGGLE_SVG_ON : TOGGLE_SVG_OFF;
            updateAllSpans();

            if (isEnabled) {
                const container = getLyricsContainer();
                if (container) processElement(container);
            }

            Spicetify.showNotification(
                isEnabled ? "🇷🇺 Russian Romanizer: ON" : "Russian Romanizer: OFF",
                false,
                1500
            );
        };

        // Add styles if not present
        if (!document.getElementById("rr-styles")) {
            const style = document.createElement("style");
            style.id = "rr-styles";
            style.textContent = `
                #rr-toggle-btn {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 32px !important;
                    height: 32px !important;
                    background: transparent !important;
                    border: none !important;
                    border-radius: 50% !important;
                    margin-right: 8px !important;
                    color: white !important;
                    cursor: pointer !important;
                    transition: background 0.2s ease, transform 0.1s ease !important;
                    -webkit-app-region: no-drag !important;
                    z-index: 99 !important;
                }
                #rr-toggle-btn:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                }
                #rr-toggle-btn:active {
                    transform: scale(0.9);
                }
                #rr-toggle-btn svg {
                    pointer-events: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        positionButton();
    }

    function positionButton() {
        if (!toggleBtn) return;

        // Find the notification bell button (the actual button, not the SVG inside)
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

    // ─── Initial run ──────────────────────────────────────────────────────────
    setTimeout(() => {
        startObserver();
        createToggleButton();
        
        // Keep it in place and handle dynamic topbar renders
        const topbarObserver = new MutationObserver(positionButton);
        topbarObserver.observe(document.body, { childList: true, subtree: true });
    }, 2000);

    console.log(`[Russian Romanizer] Loaded. Romanization is ${isEnabled ? "ON" : "OFF"}.`);
})();
