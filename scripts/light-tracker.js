// light-tracker.js
import { getThemeClass, getLowLightThresholdSeconds, getHideLightlessDefault, playLightExpiredSound, escapeHtml } from './settings.js';

// Formats remaining seconds as a whole-minute label, e.g. "39 Minutes",
// "1 Minute", or "<1 Minute" / "0 Minutes" for the edge cases.
const formatRemaining = (seconds) => {
    const m = Math.floor(seconds / 60);
    if (m > 0) return `${m} Minute${m === 1 ? '' : 's'}`;
    return seconds > 0 ? "<1 Minute" : "0 Minutes";
};

export class CustomLightTracker extends Application {
    constructor(options) {
        super(options);
        // Track the toggle state for hiding actors without lights
        this.hideWithoutLights = getHideLightlessDefault();
        // Snapshot of what's currently displayed, used to skip needless re-renders
        this._lastLightSignature = null;
    }

    static get defaultOptions() {
        const themeClass = getThemeClass();
        const classes = ["dialog", "light-tracker-app"];
        if (themeClass) classes.push(themeClass);

        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "custom-light-source-tracker",
            title: "Light Tracker",
            width: 360,
            height: "auto",
            resizable: false,
            // Use the shared theme class from style.css to match Luck/XP dialogs
            classes: classes 
        });
    }

    getData() {
        // GMs see every player-owned actor; players only see the actor(s) they own themselves
        const characters = game.actors.filter(a =>
            a.type === "Player" && a.hasPlayerOwner && (game.user.isGM || a.isOwner)
        );
        const actorData = [];

        for (const actor of characters) {
            // Find all active light sources on the character
            const activeLights = actor.items.filter(i => i.system?.light?.active);
            
            // Skip this actor if toggle is on and they have no lights
            if (this.hideWithoutLights && activeLights.length === 0) {
                continue;
            }

            // Map light data
            const lights = activeLights.map(light => {
                const remaining = light.system.light.remainingSecs ?? 0;
                return {
                    id: light.id,
                    name: light.name,
                    remaining: remaining
                };
            });

            actorData.push({
                id: actor.id,
                name: actor.name,
                img: actor.img,
                lights: lights,
                hasLights: lights.length > 0
            });
        }

        // Record what's currently displayed (rounded to minutes) so the
        // updateWorldTime hook can skip re-renders when nothing visible changed.
        this._lastLightSignature = actorData
            .flatMap(a => a.lights.map(l => `${l.id}:${Math.floor(l.remaining / 60)}`))
            .join(",");

        return { 
            actors: actorData,
            isPaused: game.paused,
            hideWithoutLights: this.hideWithoutLights,
            isGM: game.user.isGM
        };
    }

    // Lightweight check (no render) for whether any actor's displayed light
    // time (in whole minutes) has changed since the last render.
    hasVisibleLightChange() {
        const characters = game.actors.filter(a =>
            a.type === "Player" && a.hasPlayerOwner && (game.user.isGM || a.isOwner)
        );
        const parts = [];
        for (const actor of characters) {
            const activeLights = actor.items.filter(i => i.system?.light?.active);
            for (const light of activeLights) {
                const remaining = light.system.light.remainingSecs ?? 0;
                parts.push(`${light.id}:${Math.floor(remaining / 60)}`);
            }
        }
        return parts.join(",") !== this._lastLightSignature;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Click an actor's portrait to open their character sheet
        html.find('.lt-actor-avatar').click((e) => {
            e.preventDefault();
            const actorId = e.currentTarget.dataset.actorId;
            const actor = game.actors.get(actorId);
            if (actor) actor.sheet.render(true);
        });

        // Click the status pill to pause/unpause the game (GM only)
        html.find('.lt-status-pill').click(async (e) => {
            e.preventDefault();
            if (!game.user.isGM) return;
            await game.togglePause(!game.paused, { broadcast: true });
        });

        // Toggle "Hide Actors Without Lights"
        html.find('.toggle-hide-btn').click((e) => {
            e.preventDefault();
            this.hideWithoutLights = !this.hideWithoutLights;
            this.render(false); // Re-render without closing the window
        });

        // "Turn Out the Lights" - Turns off all active lights in the game
        html.find('.turn-out-lights-btn').click(async (e) => {
            e.preventDefault();
            
            // Confirm with GM just in case
            const confirm = await Dialog.confirm({
                title: "Turn Out Lights",
                content: "<p>Are you sure you want to extinguish ALL active light sources?</p>",
                defaultYes: false
            });

            if (confirm) {
                const characters = game.actors.filter(a => a.type === "Player" && a.hasPlayerOwner);
                for (const actor of characters) {
                    const activeLights = actor.items.filter(i => i.system?.light?.active);
                    for (const light of activeLights) {
                        await light.update({ "system.light.active": false });
                    }

                    // Failsafe: turning off the item's light doesn't always
                    // get pushed through to the token's own rendered light,
                    // so explicitly zero it out on every one of this actor's
                    // tokens too, to be sure they actually go dark.
                    for (const token of actor.getActiveTokens()) {
                        const currentLight = token.document.light ?? {};
                        if ((currentLight.dim ?? 0) > 0 || (currentLight.bright ?? 0) > 0) {
                            await token.document.update({ light: { dim: 0, bright: 0 } });
                        }
                    }
                }

                // Force an immediate redraw instead of waiting for the next
                // natural lighting refresh.
                canvas.perception.update({ refreshLighting: true, refreshVision: true });
            }
        });
    }

    async _renderInner(data) {
        let html = `<div class="light-tracker-content">`;

        html += `<div class="popup-title">Light Tracker</div>`;

        // Status box
        html += `
            <fieldset class="seq-box">
                <legend>Status</legend>
                <div class="lt-status-pill ${data.isPaused ? 'lt-status-paused' : 'lt-status-active'}">
                    ${data.isPaused 
                        ? '<i class="fas fa-pause-circle"></i> Paused' 
                        : '<i class="fas fa-play-circle"></i> Active'
                    }
                </div>
            </fieldset>
        `;

        // Actors box
        html += `<fieldset class="seq-box${data.isGM ? '' : ' seq-box-no-margin'}"><legend>Actors</legend>`;
        html += `<div class="lt-actor-list">`;
        if (data.actors.length === 0) {
            const emptyMessage = data.hideWithoutLights
                ? "No actors with a light source active."
                : "No actors to display.";
            html += `<div class="lt-empty">${emptyMessage}</div>`;
        } else {
            for (const actor of data.actors) {
                const singleLight = actor.lights.length === 1 ? actor.lights[0] : null;

                let nameRowTimeHtml = "";
                if (singleLight) {
                    let timeStr = formatRemaining(singleLight.remaining);
                    let lowClass = singleLight.remaining <= getLowLightThresholdSeconds() ? " lt-time-low" : "";
                    nameRowTimeHtml = `<span class="lt-time-badge${lowClass}">${timeStr}</span>`;
                }

                html += `
                    <div class="lt-actor-panel">
                        <!-- Actor Image matching Luck/XP UI (square, dark border) -->
                        <div class="lt-actor-avatar" data-actor-id="${actor.id}">
                            <img src="${escapeHtml(actor.img)}">
                        </div>
                        
                        <!-- Actor Info -->
                        <div class="lt-actor-info">
                            <div class="lt-actor-name-row">
                                <h3 class="lt-actor-name">${escapeHtml(actor.name)}</h3>
                                ${nameRowTimeHtml}
                            </div>
                `;

                if (actor.hasLights) {
                    for (const light of actor.lights) {
                        if (singleLight) {
                            // Time already shown up on the name row - just show the light's name here
                            html += `
                                <div class="lt-light-item">
                                    <span class="lt-light-name"><i class="fas fa-fire"></i>${escapeHtml(light.name)}</span>
                                </div>
                            `;
                        } else {
                            // Multiple simultaneous lights - fall back to a time per row
                            let timeStr = formatRemaining(light.remaining);
                            let lowClass = light.remaining <= getLowLightThresholdSeconds() ? " lt-light-low" : "";

                            html += `
                                <div class="lt-light-item">
                                    <span class="lt-light-name"><i class="fas fa-fire"></i>${escapeHtml(light.name)}</span> 
                                    <span class="lt-light-remaining${lowClass}">(${timeStr})</span>
                                </div>
                            `;
                        }
                    }
                } else {
                    html += `<div class="lt-no-lights">No active lights</div>`;
                }

                html += `
                        </div>
                    </div>
                `;
            }
        }
        html += `</div>`; // .lt-actor-list
        html += `</fieldset>`; // Actors box

        // Actions box - Hide toggle + Turn Out the Lights, side by side like Luck/XP's Actions row
        // GM only - players can view the tracker but can't hide/mass-extinguish lights
        if (data.isGM) {
            html += `
                <fieldset class="seq-box seq-box-no-margin">
                    <legend>Actions</legend>
                    <div class="actions-grid">
                        <div class="luck-btn btn-undo toggle-hide-btn">
                            ${data.hideWithoutLights ? 'Show All Actors' : 'Hide Actors No Lights'}
                        </div>
                        <div class="luck-btn btn-reset turn-out-lights-btn">
                            <i class="fas fa-skull-crossbones"></i> Turn Out the Lights
                        </div>
                    </div>
                </fieldset>
            `;
        }

        html += `</div>`;
        return $(html);
    }
}

// 1. Expose to global window
window.CustomLightTracker = CustomLightTracker;
window.activeCustomLightTracker = null;

// Toolbar button to open/focus the Light Tracker (mirrors the Luck & XP buttons)
export const openLightTracker = () => {
    // If already open, just bring it to the front instead of opening a second copy
    if (window.activeCustomLightTracker?.rendered) {
        window.activeCustomLightTracker.bringToTop();
        return;
    }

    window.activeCustomLightTracker = new CustomLightTracker();
    window.activeCustomLightTracker.render(true);
};

export const setupLightTrackerButton = (tokenControls) => {
    tokenControls.tools['light-tracker-button'] = {
        name: 'light-tracker-button',
        title: 'Light Tracker',
        icon: 'fas fa-fire',
        button: true,
        onClick: async () => {
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            openLightTracker();
        }
    };
};

// Tracks each light item's last known remaining time so we can detect the
// moment one burns out, regardless of whether the tracker window is open.
const lightExpiryTracked = new Map();

const checkLightExpirySound = () => {
    const characters = game.actors.filter(a => a.type === "Player" && a.hasPlayerOwner);
    for (const actor of characters) {
        const activeLights = actor.items.filter(i => i.system?.light?.active);
        for (const light of activeLights) {
            const remaining = light.system.light.remainingSecs ?? 0;
            const previous = lightExpiryTracked.get(light.id);
            if (previous !== undefined && previous > 0 && remaining <= 0) {
                playLightExpiredSound();
            }
            lightExpiryTracked.set(light.id, remaining);
        }
    }
};

// 2. Event Hooks to update UI automatically
Hooks.on("updateWorldTime", () => {
    // Only one client needs to check/broadcast the expiry sound.
    if (game.user.isGM) checkLightExpirySound();

    const tracker = window.activeCustomLightTracker;
    if (!tracker?.rendered || game.paused) return;

    // Only redraw when a displayed (whole-minute) value has actually changed,
    // instead of on every underlying world-time tick.
    if (tracker.hasVisibleLightChange()) {
        tracker.render(false);
    }
});

// Update when items are toggled on/off
Hooks.on("updateItem", (item) => {
    if (item.system?.light && window.activeCustomLightTracker?.rendered) {
        window.activeCustomLightTracker.render(false);
    }
});
Hooks.on("deleteItem", (item) => {
    if (item.system?.light && window.activeCustomLightTracker?.rendered) {
        window.activeCustomLightTracker.render(false);
    }
});

// Update UI when game is Paused or Unpaused
Hooks.on("pauseGame", (isPaused) => {
    if (window.activeCustomLightTracker?.rendered) {
        window.activeCustomLightTracker.render(false);
    }
});