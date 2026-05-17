// NAME: Russian Lyrics Romanizer
// AUTHOR: Jyzhdev
// DESCRIPTION: Romanizes Russian Cyrillic lyrics into phonetic English in Spotify's Lyrics view. Toggle on/off from the topbar.
// VERSION: 1.2.0

(function RussianRomanizer() {
    if (!Spicetify?.Player || !Spicetify?.Platform || !Spicetify?.Topbar) {
        setTimeout(RussianRomanizer, 200);
        return;
    }

    const STORAGE_KEY = "russianRomanizer:enabled";
    const cyrillicRegex = /[\u0400-\u04FF]/;
    const originalTextCache = new WeakMap();

    const cyrillicVowels = /[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/;
    const specialChars = /[ьъйЬЪЙ]/;
    const sibilants = /[жчшщЖЧШЩ]/;

    const translitMap = {
        "А": "A",  "Б": "B",  "В": "V",  "Г": "G",  "Д": "D",
        "Ж": "Zh", "З": "Z",  "И": "I",  "Й": "Y",  "К": "K",  
        "Л": "L",  "М": "M",  "Н": "N",  "О": "O",  "П": "P",  
        "Р": "R",  "С": "S",  "Т": "T",  "У": "U",  "Ф": "F",  
        "Х": "Kh", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Shch",
        "Ъ": "",   "Ы": "Y",  "Ь": "",   "Э": "E",  "Ю": "Yu", 
        "Я": "Ya",
        "а": "a",  "б": "b",  "в": "v",  "г": "g",  "д": "d",
        "ж": "zh", "з": "z",  "и": "i",  "й": "y",  "к": "k",  
        "л": "l",  "м": "m",  "н": "n",  "о": "o",  "п": "p",  
        "р": "r",  "с": "s",  "т": "t",  "у": "u",  "ф": "f",  
        "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
        "ъ": "",   "ы": "y",  "ь": "",   "э": "e",  "ю": "yu", 
        "я": "ya",
    };

    let romanizerEnabled = Spicetify.LocalStorage.get(STORAGE_KEY) !== "false";

    function romanizeText(text) {
        let result = "";
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === "е" || char === "Е") {
                const prevChar = text[i - 1];
                const isWordStart = !prevChar || /[^a-zA-Z\u0400-\u04FF]/.test(prevChar);
                const isAfterVowelOrSpecial = prevChar && (cyrillicVowels.test(prevChar) || specialChars.test(prevChar));
                
                let replacement;
                if (isWordStart || isAfterVowelOrSpecial) {
                    replacement = char === "Е" ? "Ye" : "ye";
                } else {
                    replacement = char === "Е" ? "E" : "e";
                }
                
                if (replacement === "Ye" && char === "Е") {
                    let nextChar = text[i + 1];
                    let prevC = text[i - 1];
                    let nextUpper = nextChar && nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase();
                    let prevUpper = prevC && prevC === prevC.toUpperCase() && prevC !== prevC.toLowerCase();
                    if (nextUpper || prevUpper) {
                        replacement = "YE";
                    }
                }
                result += replacement;
                continue;
            }
            
            if (char === "ё" || char === "Ё") {
                const prevChar = text[i - 1];
                const followsSibilant = prevChar && sibilants.test(prevChar);
                
                let replacement;
                if (followsSibilant) {
                    replacement = char === "Ё" ? "O" : "o";
                } else {
                    replacement = char === "Ё" ? "Yo" : "yo";
                }
                
                if (replacement === "Yo" && char === "Ё") {
                    let nextChar = text[i + 1];
                    let prevC = text[i - 1];
                    let nextUpper = nextChar && nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase();
                    let prevUpper = prevC && prevC === prevC.toUpperCase() && prevC !== prevC.toLowerCase();
                    if (nextUpper || prevUpper) {
                        replacement = "YO";
                    }
                }
                result += replacement;
                continue;
            }

            let replacement = translitMap[char];
            if (replacement === undefined) {
                result += char;
                continue;
            }

            if (replacement.length > 1 && char === char.toUpperCase()) {
                let nextChar = text[i + 1];
                let prevC = text[i - 1];
                let nextUpper = nextChar && nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase();
                let prevUpper = prevC && prevC === prevC.toUpperCase() && prevC !== prevC.toLowerCase();
                if (nextUpper || prevUpper) {
                    replacement = replacement.toUpperCase();
                }
            }
            result += replacement;
        }
        return result;
    }

    function processNode(node) {
        if (!node) return;

        if (node.nodeType === Node.TEXT_NODE) {
            const currentText = node.nodeValue;
            if (!currentText) return;

            const hasCyrillic = cyrillicRegex.test(currentText);

            if (romanizerEnabled) {
                if (hasCyrillic) {
                    if (!originalTextCache.has(node)) {
                        originalTextCache.set(node, currentText);
                    }
                    const rom = romanizeText(currentText);
                    if (node.nodeValue !== rom) {
                        node.nodeValue = rom;
                    }
                }
            } else {
                if (originalTextCache.has(node)) {
                    const original = originalTextCache.get(node);
                    if (node.nodeValue !== original) {
                        node.nodeValue = original;
                    }
                }
            }
            return;
        }

        if (node.shadowRoot) {
            processNode(node.shadowRoot);
        }

        let child = node.firstChild;
        while (child) {
            processNode(child);
            child = child.nextSibling;
        }
    }

    let frameCount = 0;

    function updateLyricsLoop() {
        if (!Spicetify?.Player) return;
        
        requestAnimationFrame(updateLyricsLoop);
        frameCount++;

        const containers = [];
        
        const selectors = [
            "[class*='lyric']",
            "[class*='Lyric']",
            "[data-testid*='lyric']",
            "[data-testid*='Lyric']",
            "[class*='npv']",
            "[class*='nowPlayingView']",
            "[class*='cinema']",
            "[class*='fullscreen']"
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const tagName = el.tagName.toUpperCase();
                
                if (
                    tagName === "BUTTON" || 
                    tagName === "A" || 
                    tagName === "SVG" || 
                    tagName === "PATH" || 
                    tagName === "INPUT" || 
                    tagName === "TEXTAREA" ||
                    el.getAttribute("role") === "button" || 
                    el.getAttribute("data-testid") === "lyrics-button"
                ) {
                    return;
                }
                
                if (el.getAttribute("data-testid") === "fullscreen-lyric" || el.classList.contains("lyrics-line")) {
                    const parent = el.parentElement;
                    if (parent && !containers.includes(parent)) {
                        containers.push(parent);
                    }
                } else if (!containers.includes(el)) {
                    containers.push(el);
                }
            });
        }

        if (containers.length === 0) {
            if (frameCount % 10 !== 0) return;
            
            const fallback = document.querySelector("#main-view") || document.querySelector("#main") || document.body;
            if (fallback) {
                containers.push(fallback);
            }
        }

        for (const container of containers) {
            processNode(container);
        }
    }

    const svgIconOn = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <text x="3" y="19" font-size="20" font-family="Helvetica, Arial, sans-serif" font-weight="bold">Я</text>
        </svg>`;
    const svgIconOff = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.5">
            <text x="3" y="19" font-size="20" font-family="Helvetica, Arial, sans-serif" font-weight="bold">Я</text>
        </svg>`;

    let topbarButton = null;

    function initTopbarButton() {
        if (topbarButton) return;
        
        topbarButton = new Spicetify.Topbar.Button(
            "Toggle Russian Romanization",
            romanizerEnabled ? svgIconOn : svgIconOff,
            () => {
                romanizerEnabled = !romanizerEnabled;
                Spicetify.LocalStorage.set(STORAGE_KEY, String(romanizerEnabled));
                topbarButton.icon = romanizerEnabled ? svgIconOn : svgIconOff;
                
                Spicetify.showNotification(
                    romanizerEnabled ? "🇷🇺 Russian Romanizer: ON" : "Russian Romanizer: OFF",
                    false, 1500
                );
            },
            false,
            true
        );
    }

    setTimeout(() => {
        requestAnimationFrame(updateLyricsLoop);
        initTopbarButton();
    }, 2000);
})();
