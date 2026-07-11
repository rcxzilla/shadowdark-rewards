// settings.js
export const MODULE_ID = "shadowdark-rewards";

const THEME_CLASSES = [
    "award-theme-light", "award-theme-dark", "award-theme-blackgold",
    "award-theme-verdant", "award-theme-blood", "award-theme-arcane", "award-theme-frost"
];

// Swaps the theme class on a single open window's root element, live -
// no reopen/refresh needed since all our colors are driven by CSS variables.
const applyThemeToElement = (el, theme) => {
    if (!el || !el.length) return;
    el.removeClass(THEME_CLASSES.join(" "));
    if (theme && theme !== "default") {
        el.addClass(`award-theme-${theme}`);
    }
};

// Updates any currently-open Rewards / Light Tracker windows in place when
// the setting changes, without requiring a refresh.
const applyThemeToOpenWindows = (theme) => {
    applyThemeToElement(window.activeCustomLightTracker?.element, theme);
    applyThemeToElement(window.activeAwardDialog?.element, theme);
};

export const registerSettings = () => {
    game.settings.register(MODULE_ID, "popupTheme", {
        name: "Theme",
        hint: "Choose the color theme used by the Award and Light Tracker windows.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "default": "Default (Purple)",
            "light": "Light",
            "dark": "Dark",
            "blackgold": "Black & Gold",
            "verdant": "Verdant (Forest Green)",
            "blood": "Blood (Crimson)",
            "arcane": "Arcane (Violet)",
            "frost": "Frost (Icy Blue)"
        },
        default: "default",
        onChange: (value) => {
            applyThemeToOpenWindows(value);
            ui.notifications.info("Popup Theme updated.");
        }
    });

    game.settings.register(MODULE_ID, "awardDialogWidth", {
        name: "Reward Window Width (px)",
        hint: "The width of the Reward window in pixels. Change this if the layout feels too cramped or too wide for your screen.",
        scope: "world",
        config: true,
        type: Number,
        range: { min: 550, max: 1000, step: 10 },
        default: 650,
        onChange: (value) => {
            if (window.activeAwardDialog?.rendered) {
                window.activeAwardDialog.setPosition({ width: Number(value) || 650 });
            }
        }
    });

    game.settings.register(MODULE_ID, "lightWarningThreshold", {
        name: "Light Warning Threshold (Minutes)",
        hint: "When a light source's remaining time drops to or below this many minutes, its time display turns red as a low-light warning.",
        scope: "world",
        config: true,
        type: Number,
        default: 5
    });

    game.settings.register(MODULE_ID, "autoOpenLightTracker", {
        name: "Auto-Open Light Tracker",
        hint: "Automatically open the Light Tracker window for the GM when the world finishes loading.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, "playersCanViewLightTracker", {
        name: "Allow Players to View Light Tracker",
        hint: "When enabled, players get their own Light Tracker toolbar button. They'll only see their own owned actor(s) and can't hide actors or use Turn Out the Lights - that stays GM only.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => {
            if (typeof ui !== "undefined" && ui.controls) ui.controls.render();
        }
    });

    game.settings.register(MODULE_ID, "hideLightlessActorsDefault", {
        name: "Hide Actors Without Lights By Default",
        hint: "When the Light Tracker is opened, start with actors that have no active light source already hidden.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, "chatCardVisibility", {
        name: "Chat Card Visibility",
        hint: "Choose whether the XP, Luck, Treasure, and Currency chat cards are posted publicly, whispered to GMs only, or whispered to just the receiving player(s) and GMs.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "public": "Public",
            "gm": "GM Only (Whisper)",
            "player-gm": "Receiving Player + GM Only (Whisper)"
        },
        default: "public"
    });

    game.settings.register(MODULE_ID, "luckRollFormulas", {
        name: "Luck Roll Dice Options",
        hint: "Comma-separated dice formulas shown as quick-roll buttons in Award Luck, e.g. 1d4,1d6,1d8,1d10,1d12,1d20.",
        scope: "world",
        config: true,
        type: String,
        default: "1d4,1d6,1d8,1d10,1d12,1d20"
    });

    game.settings.register(MODULE_ID, "xpAddValues", {
        name: "Add XP Values",
        hint: "Comma-separated XP amounts shown as quick-add buttons, e.g. 1,3,10.",
        scope: "world",
        config: true,
        type: String,
        default: "1,3,10"
    });

    game.settings.register(MODULE_ID, "luckAddValues", {
        name: "Add Luck Token Values",
        hint: "Comma-separated Luck token amounts shown as quick-add buttons, e.g. 1,2,3,4,5,6.",
        scope: "world",
        config: true,
        type: String,
        default: "1,2,3,4,5,6"
    });

    game.settings.register(MODULE_ID, "currencyAddValues", {
        name: "Add Currency Values",
        hint: "Comma-separated amounts shown as quick-add buttons for each of Gold, Silver, and Copper, e.g. 1,5,10.",
        scope: "world",
        config: true,
        type: String,
        default: "1,5,10"
    });

    game.settings.register(MODULE_ID, "xpSoundPath", {
        name: "XP Award Sound Effect",
        hint: "Sound played whenever XP is awarded to an actor. Leave blank for no sound.",
        scope: "world",
        config: true,
        type: String,
        filePicker: "audio",
        default: ""
    });

    game.settings.register(MODULE_ID, "luckSoundPath", {
        name: "Luck Award Sound Effect",
        hint: "Sound played whenever Luck is awarded to an actor. Leave blank for no sound.",
        scope: "world",
        config: true,
        type: String,
        filePicker: "audio",
        default: ""
    });

    game.settings.register(MODULE_ID, "treasureSoundPath", {
        name: "Treasure Award Sound Effect",
        hint: "Sound played whenever Treasure is awarded to an actor. Leave blank for no sound.",
        scope: "world",
        config: true,
        type: String,
        filePicker: "audio",
        default: ""
    });

    game.settings.register(MODULE_ID, "currencySoundPath", {
        name: "Currency Award Sound Effect",
        hint: "Sound played whenever Currency (Gold/Silver/Copper) is awarded to an actor. Leave blank for no sound.",
        scope: "world",
        config: true,
        type: String,
        filePicker: "audio",
        default: ""
    });

    game.settings.register(MODULE_ID, "lightExpiredSoundPath", {
        name: "Light Expired Sound Effect",
        hint: "Sound played when a tracked light source burns out. Leave blank for no sound.",
        scope: "world",
        config: true,
        type: String,
        filePicker: "audio",
        default: ""
    });

    // Hidden (not shown in the settings UI) - persists the Available Treasure
    // box's contents across dialog close/reopen and world reloads.
    game.settings.register(MODULE_ID, "treasureBoxItems", {
        scope: "world",
        config: false,
        type: Array,
        default: []
    });
};

// Returns the extra CSS class (if any) that should be added to a popup's
// "classes" array based on the currently selected theme. Wrapped defensively
// so that a settings-registration timing hiccup can never break the popups
// themselves - it just silently falls back to the default theme.
export const getThemeClass = () => {
    try {
        const theme = game.settings.get(MODULE_ID, "popupTheme");
        return theme && theme !== "default" ? `award-theme-${theme}` : null;
    } catch (err) {
        console.warn(`${MODULE_ID} | Popup Theme setting not available yet, using default theme.`, err);
        return null;
    }
};

// Low-light warning threshold, in seconds, for the Light Tracker's red-text warning.
//
// The tracker only ever displays whole minutes (e.g. "5 Minutes" covers
// everything from 5:00 down to 5:59 remaining). If we compared against the
// threshold in exact minutes (5 * 60 = 300s), a light showing "5 Minutes"
// would flip red only once it actually reached 300s, even though the
// *displayed* value "5 Minutes" had already been on screen for up to 59
// seconds beforehand - making the same displayed text sometimes red and
// sometimes not. Adding the extra 59 seconds makes the threshold line up
// with what's actually on screen, so it turns red for the whole "5 Minutes"
// display window rather than only its last second.
export const getLowLightThresholdSeconds = () => {
    try {
        const minutes = Number(game.settings.get(MODULE_ID, "lightWarningThreshold"));
        const m = Number.isFinite(minutes) ? minutes : 5;
        return m * 60 + 59;
    } catch (err) {
        return 5 * 60 + 59;
    }
};

// The configured width (in pixels) for the Reward window.
export const getAwardDialogWidth = () => {
    try {
        const width = Number(game.settings.get(MODULE_ID, "awardDialogWidth"));
        return Number.isFinite(width) && width > 0 ? width : 650;
    } catch (err) {
        return 650;
    }
};

// Whether the Light Tracker should start with lightless actors already hidden.
export const getHideLightlessDefault = () => {
    try {
        return !!game.settings.get(MODULE_ID, "hideLightlessActorsDefault");
    } catch (err) {
        return false;
    }
};

// Whether players (non-GM) are allowed to open their own read-only Light Tracker.
export const getPlayersCanViewLightTracker = () => {
    try {
        return !!game.settings.get(MODULE_ID, "playersCanViewLightTracker");
    } catch (err) {
        return false;
    }
};

// The list of dice formulas shown as quick-roll buttons in Award Luck.
export const getLuckRollFormulas = () => {
    const fallback = ["1d4", "1d6", "1d8", "1d10", "1d12", "1d20"];
    try {
        const raw = game.settings.get(MODULE_ID, "luckRollFormulas") || "";
        const list = raw.split(",").map(s => s.trim()).filter(Boolean);
        return list.length ? list : fallback;
    } catch (err) {
        return fallback;
    }
};

// Shared parser for comma-separated positive-integer setting values
// (Add XP / Add Luck Tokens / Add Currency quick-add buttons).
const parsePositiveIntList = (settingKey, fallback) => {
    try {
        const raw = game.settings.get(MODULE_ID, settingKey) || "";
        const list = raw.split(",").map(s => parseInt(s.trim())).filter(n => Number.isFinite(n) && n > 0);
        return list.length ? list : fallback;
    } catch (err) {
        return fallback;
    }
};

// The amounts shown as quick-add buttons in Add XP.
export const getXpAddValues = () => parsePositiveIntList("xpAddValues", [1, 3, 10]);

// The amounts shown as quick-add buttons in Add Luck Tokens.
export const getLuckAddValues = () => parsePositiveIntList("luckAddValues", [1, 2, 3, 4, 5, 6]);

// The amounts shown as quick-add buttons in Add Currency (applied to each of Gold/Silver/Copper).
export const getCurrencyAddValues = () => parsePositiveIntList("currencyAddValues", [1, 5, 10]);

// Resolves the whisper target IDs (if any) that XP/Luck/Treasure/Currency
// chat cards should be sent to, based on the Chat Card Visibility setting.
// Pass the actor being awarded so "Receiving Player + GM" can include them.
export const getChatWhisperTargets = (actor = null) => {
    try {
        const visibility = game.settings.get(MODULE_ID, "chatCardVisibility");
        const gmIds = ChatMessage.getWhisperRecipients("GM").map(u => u.id);

        if (visibility === "gm") {
            return gmIds;
        }
        if (visibility === "player-gm") {
            const ownerIds = actor
                ? game.users.filter(u => !u.isGM && actor.testUserPermission(u, "OWNER")).map(u => u.id)
                : [];
            return Array.from(new Set([...gmIds, ...ownerIds]));
        }
    } catch (err) {
        console.warn(`${MODULE_ID} | Chat Card Visibility setting not available yet, defaulting to public.`, err);
    }
    return [];
};

// Plays the configured sound effect for the given award category
// ("xp" | "luck" | "treasure"), if one is set.
export const playAwardSound = (category) => {
    const settingKey = { xp: "xpSoundPath", luck: "luckSoundPath", treasure: "treasureSoundPath", currency: "currencySoundPath" }[category];
    if (!settingKey) return;
    try {
        const path = game.settings.get(MODULE_ID, settingKey);
        if (path) foundry.audio.AudioHelper.play({ src: path, volume: 0.8, autoplay: true, loop: false }, true);
    } catch (err) {
        console.warn(`${MODULE_ID} | Could not play the ${category} award sound effect.`, err);
    }
};

// Plays the configured Light Expired sound effect, if any.
export const playLightExpiredSound = () => {
    try {
        const path = game.settings.get(MODULE_ID, "lightExpiredSoundPath");
        if (path) foundry.audio.AudioHelper.play({ src: path, volume: 0.8, autoplay: true, loop: false }, true);
    } catch (err) {
        console.warn(`${MODULE_ID} | Could not play the Light Expired sound effect.`, err);
    }
};

// Reads the persisted Available Treasure box contents (survives closing the
// Award dialog and reloading the world).
export const getTreasureBoxItems = () => {
    try {
        const items = game.settings.get(MODULE_ID, "treasureBoxItems");
        return Array.isArray(items) ? foundry.utils.deepClone(items) : [];
    } catch (err) {
        console.warn(`${MODULE_ID} | Could not load the saved Available Treasure box.`, err);
        return [];
    }
};

// Persists the Available Treasure box contents.
export const saveTreasureBoxItems = async (items) => {
    try {
        await game.settings.set(MODULE_ID, "treasureBoxItems", items);
    } catch (err) {
        console.warn(`${MODULE_ID} | Could not save the Available Treasure box.`, err);
    }
};