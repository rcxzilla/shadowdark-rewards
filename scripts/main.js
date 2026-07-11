// main.js
import { setupLightTrackerButton, openLightTracker } from './light-tracker.js';
import { setupAwardButton, openAwardDialog, handleXpUndo, handleLuckUndo } from './award.js';
import { registerSettings, MODULE_ID, getPlayersCanViewLightTracker } from './settings.js';

Hooks.once("init", () => {
    try {
        registerSettings();
    } catch (err) {
        console.error(`${MODULE_ID} | Failed to register settings`, err);
    }

    // Keybinds to open the Award and Light Tracker windows without touching the toolbar
    game.keybindings.register(MODULE_ID, "openAward", {
        name: "Open Award Window",
        editable: [{ key: "KeyA", modifiers: ["Control"] }],
        restricted: true,
        onDown: () => {
            if (game.user.isGM) openAwardDialog();
        }
    });

    game.keybindings.register(MODULE_ID, "openLightTracker", {
        name: "Open Light Tracker",
        editable: [{ key: "KeyL", modifiers: ["Control"] }],
        restricted: false,
        onDown: () => {
            if (game.user.isGM || getPlayersCanViewLightTracker()) openLightTracker();
        }
    });
});

Hooks.once("ready", () => {
    if (!game.user.isGM) return;

    try {
        if (game.settings.get(MODULE_ID, "autoOpenLightTracker")) {
            openLightTracker();
        }
    } catch (err) {
        console.warn(`${MODULE_ID} | Could not auto-open the Light Tracker`, err);
    }
});

// Global hook to handle the chat card "Undo/Redo" controls
Hooks.on("renderChatMessage", (message, html) => {
    // Hide controls if not GM
    if (!game.user.isGM) {
        html.find(".undo-luck-btn, .undo-xp-btn, .award-undo-toggle, .award-undo-wrapper").remove();
        return;
    }

    // The undo/redo button stays tucked under a collapsible arrow so it
    // isn't clicked by accident - click the arrow to reveal it
    html.find(".award-undo-toggle").click((ev) => {
        ev.preventDefault();
        const $toggle = $(ev.currentTarget);
        $toggle.next(".award-undo-wrapper").slideToggle(120);
        $toggle.toggleClass("expanded");
    });

    // Attach delegated click events
    handleLuckUndo(html);
    handleXpUndo(html);
});

// Hook to add the buttons to the UI token controls
Hooks.on('getSceneControlButtons', (controls) => {
    const tokenControls = controls.tokens;
    if (!tokenControls || !tokenControls.tools) return;

    if (game.user.isGM) {
        setupLightTrackerButton(tokenControls);
        setupAwardButton(tokenControls);
    } else if (getPlayersCanViewLightTracker()) {
        setupLightTrackerButton(tokenControls);
    }
});