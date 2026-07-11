// award.js
// A single "Award" popup that combines Award XP, Award Luck, and a new
// Award Treasure workflow, all behind one shared Actors selection.
import { getThemeClass, getChatWhisperTargets, playAwardSound, getLuckRollFormulas, getTreasureBoxItems, saveTreasureBoxItems, getAwardDialogWidth, getXpAddValues, getLuckAddValues, getCurrencyAddValues } from './settings.js';

let activeAwardDialog = null; // Tracks the combined Award dialog

// Only player-owned characters are eligible (matches Luck/XP/Light Tracker)
const getEligibleActors = () => game.actors.filter(a => a.type === "Player" && a.hasPlayerOwner);

// Updates a card's "XP: N" / "Luck: N" lines
const setXpValueDisplay = (root, actorId, value) => {
    root.find(`.award-actor-card[data-actor-id="${actorId}"] .award-actor-value-xp .award-actor-value-num`).text(value);
};
const setLuckValueDisplay = (root, actorId, value) => {
    root.find(`.award-actor-card[data-actor-id="${actorId}"] .award-actor-value-luck .award-actor-value-num`).text(value);
};
// Updates a card's "G: N", "S: N", "C: N" currency values
const setCurrencyValueDisplay = (root, actorId, { gp, sp, cp }) => {
    const card = root.find(`.award-actor-card[data-actor-id="${actorId}"]`);
    card.find(".award-actor-value-gp .award-actor-value-num").text(gp);
    card.find(".award-actor-value-sp .award-actor-value-num").text(sp);
    card.find(".award-actor-value-cp .award-actor-value-num").text(cp);
};

// Handles the Undo/Redo click on an XP chat card. Lives here (instead of a
// standalone xp.js) since Award XP is now only ever created via this file's
// combined Rewards dialog.
export const handleXpUndo = (html) => {
    html.find(".undo-xp-btn").click(async (ev) => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const $btn = $(btn);
        const amount = Number(btn.dataset.amount);
        const actorId = btn.dataset.actorId;
        const actor = game.actors.get(actorId);

        if (!actor) return ui.notifications.warn("Actor not found.");

        const isUndone = btn.dataset.state === "undone";
        const currentXp = Number(actor.system.level?.xp) || 0;
        let newXp;

        if (isUndone) {
            // Redo: reapply the award
            newXp = currentXp + amount;
            await actor.update({ "system.level.xp": newXp });
            btn.dataset.state = "awarded";
            $btn.removeClass("state-undone").addClass("state-awarded").text("Undo");
            ui.notifications.info(`Redid ${amount} XP.`);
        } else {
            // Undo: remove the award
            newXp = Math.max(0, currentXp - amount);
            await actor.update({ "system.level.xp": newXp });
            btn.dataset.state = "undone";
            $btn.removeClass("state-awarded").addClass("state-undone").text("Redo");
            ui.notifications.info(`Undid ${amount} XP.`);
        }

        if (activeAwardDialog && activeAwardDialog.rendered) {
            setXpValueDisplay(activeAwardDialog.element, actorId, newXp);
        }
    });
};

// Handles the Undo/Redo click on a Luck chat card. Lives here (instead of a
// standalone luck.js) since Award Luck is now only ever created via this
// file's combined Rewards dialog.
export const handleLuckUndo = (html) => {
    html.find(".undo-luck-btn").click(async (ev) => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const $btn = $(btn);
        const amount = Number(btn.dataset.amount);
        const actorId = btn.dataset.actorId;
        const actor = game.actors.get(actorId);

        if (!actor) return ui.notifications.warn("Actor not found.");

        const isUndone = btn.dataset.state === "undone";
        const currentLuck = Number(actor.system.luck?.remaining) || 0;
        let newLuck;

        if (isUndone) {
            // Redo: reapply the award
            newLuck = currentLuck + amount;
            await actor.update({ "system.luck.remaining": newLuck });
            btn.dataset.state = "awarded";
            $btn.removeClass("state-undone").addClass("state-awarded").text("Undo");
            ui.notifications.info(`Redid ${amount} luck.`);
        } else {
            // Undo: remove the award
            newLuck = Math.max(0, currentLuck - amount);
            await actor.update({ "system.luck.remaining": newLuck });
            btn.dataset.state = "undone";
            $btn.removeClass("state-awarded").addClass("state-undone").text("Redo");
            ui.notifications.info(`Undid ${amount} luck.`);
        }

        if (activeAwardDialog && activeAwardDialog.rendered) {
            setLuckValueDisplay(activeAwardDialog.element, actorId, newLuck);
        }
    });
};

const buildActorGridHtml = (actors, selectedIds) => {
    if (actors.length === 0) {
        return `<div class="award-empty">No eligible actors found.</div>`;
    }
    let html = `<div class="award-actor-grid">`;
    for (const actor of actors) {
        const xp = Number(actor.system.level?.xp) || 0;
        const luck = Number(actor.system.luck?.remaining) || 0;
        const gp = Number(actor.system.coins?.gp) || 0;
        const sp = Number(actor.system.coins?.sp) || 0;
        const cp = Number(actor.system.coins?.cp) || 0;
        const selectedClass = selectedIds.has(actor.id) ? " selected" : "";
        html += `
            <div class="award-actor-card${selectedClass}" data-actor-id="${actor.id}">
                <div class="award-actor-avatar" data-actor-id="${actor.id}">
                    <img src="${actor.img}">
                </div>
                <div class="award-actor-info">
                    <div class="award-actor-name">${actor.name}</div>
                    <div class="award-actor-line">
                        <span class="award-actor-value award-actor-value-xp">XP: <span class="award-actor-value-num">${xp}</span></span>
                        <span class="award-actor-value award-actor-value-luck">Luck: <span class="award-actor-value-num">${luck}</span></span>
                    </div>
                    <div class="award-actor-line">
                        <span class="award-actor-value award-actor-value-gp"><span class="award-actor-currency-label award-actor-currency-label-gp">G:</span> <span class="award-actor-value-num">${gp}</span></span>
                        <span class="award-actor-value award-actor-value-sp"><span class="award-actor-currency-label award-actor-currency-label-sp">S:</span> <span class="award-actor-value-num">${sp}</span></span>
                        <span class="award-actor-value award-actor-value-cp"><span class="award-actor-currency-label award-actor-currency-label-cp">C:</span> <span class="award-actor-value-num">${cp}</span></span>
                    </div>
                </div>
            </div>
        `;
    }
    html += `</div>`;
    return html;
};

// Chat cards re-use the same classes/data attributes as the standalone
// Award XP / Award Luck dialogs so the existing renderChatMessage undo
// handling in main.js (handleXpUndo / handleLuckUndo) picks them up for free.
const buildXpChatCardHtml = ({ amount, newXp, actorId }) => `
    <div class="award-chat-card">
        <div class="award-chat-header">Manual Entry</div>
        <div class="award-chat-amount">Added: ${amount} XP</div>
        <div class="award-chat-total">Total XP: ${newXp}</div>
        <div class="award-undo-toggle" title="Show undo control"><i class="fas fa-chevron-down"></i></div>
        <div class="award-undo-wrapper">
            <button class="undo-xp-btn award-undo-btn state-awarded" data-amount="${amount}" data-actor-id="${actorId}" data-state="awarded">Undo</button>
        </div>
    </div>
`;
const buildLuckChatCardHtml = ({ header, amount, newLuck, actorId }) => `
    <div class="award-chat-card">
        <div class="award-chat-header">${header}</div>
        <div class="award-chat-amount">Added: ${amount}</div>
        <div class="award-chat-total">Total Luck: ${newLuck}</div>
        <div class="award-undo-toggle" title="Show undo control"><i class="fas fa-chevron-down"></i></div>
        <div class="award-undo-wrapper">
            <button class="undo-luck-btn award-undo-btn state-awarded" data-amount="${amount}" data-actor-id="${actorId}" data-state="awarded">Undo</button>
        </div>
    </div>
`;
const buildTreasureChatCardHtml = ({ name }) => `
    <div class="award-chat-card">
        <div class="award-chat-header">Treasure Discovered</div>
        <div class="award-chat-amount">${name}</div>
    </div>
`;

const TREASURE_PAGE_SIZE = 6; // 2 columns x 3 rows

const renderTreasureList = (html) => {
    const listEl = html.find(".treasure-list");
    const emptyEl = html.find(".treasure-empty");
    const items = activeAwardDialog.treasureItems;

    const totalPages = Math.max(1, Math.ceil(items.length / TREASURE_PAGE_SIZE));
    activeAwardDialog.treasurePage = Math.min(activeAwardDialog.treasurePage ?? 0, totalPages - 1);
    const page = activeAwardDialog.treasurePage;
    const pageItems = items.slice(page * TREASURE_PAGE_SIZE, page * TREASURE_PAGE_SIZE + TREASURE_PAGE_SIZE);

    listEl.empty();
    emptyEl.toggle(items.length === 0);
    html.find(".treasure-page-prev").toggleClass("disabled", page <= 0);
    html.find(".treasure-page-next").toggleClass("disabled", page >= totalPages - 1);

    for (const t of pageItems) {
        listEl.append(`
            <div class="treasure-item" data-tid="${t.tid}">
                <div class="treasure-item-top">
                    <img src="${t.img}" class="treasure-item-img">
                    <span class="treasure-item-name">${t.name}</span>
                </div>
                <div class="treasure-item-actions">
                    <div class="luck-btn btn-manual treasure-award-btn" data-tid="${t.tid}">Award</div>
                    <div class="luck-btn btn-reset treasure-remove-btn" data-tid="${t.tid}">Remove</div>
                </div>
            </div>
        `);
    }

    // Content height just changed - let the window resize to fit instead of scrolling
    if (activeAwardDialog?.rendered) {
        activeAwardDialog.setPosition({ height: "auto" });
    }

    // Persist so the box survives closing the Award dialog or reloading the world
    saveTreasureBoxItems(items);
};

export const openAwardDialog = () => {
    if (activeAwardDialog && activeAwardDialog.rendered) {
        activeAwardDialog.bringToTop();
        return;
    }

    const actors = getEligibleActors();
    const defaultActorId = actors[0]?.id ?? null;
    const initialSelected = new Set(defaultActorId ? [defaultActorId] : []);

            // ---- XP ----
            const processXp = async (amount) => {
                const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");

                activeAwardDialog.lastXpAwardedMap = {};

                for (const actorId of actorIds) {
                    const actor = game.actors.get(actorId);
                    if (!actor) continue;

                    const currentXp = Number(actor.system.level?.xp) || 0;
                    const newXp = currentXp + Number(amount);
                    await actor.update({ "system.level.xp": newXp });

                    activeAwardDialog.lastXpAwardedMap[actorId] = Number(amount);
                    setXpValueDisplay(activeAwardDialog.element, actorId, newXp);

                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor }),
                        flavor: '<div class="award-flavor"><strong>Congratulations!</strong><br>You have earned XP!</div>',
                        content: buildXpChatCardHtml({ amount, newXp, actorId: actor.id }),
                        whisper: getChatWhisperTargets(actor)
                    });
                }

                playAwardSound("xp");
            };

            // ---- Luck ----
            const processLuck = async (amount) => {
                const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");

                activeAwardDialog.lastLuckAwardedMap = {};

                for (const actorId of actorIds) {
                    const actor = game.actors.get(actorId);
                    if (!actor) continue;

                    const currentLuck = Number(actor.system.luck?.remaining) || 0;
                    const newLuck = currentLuck + Number(amount);
                    await actor.update({ "system.luck.remaining": newLuck });

                    activeAwardDialog.lastLuckAwardedMap[actorId] = Number(amount);
                    setLuckValueDisplay(activeAwardDialog.element, actorId, newLuck);

                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor }),
                        flavor: '<div class="award-flavor"><strong>Congratulations!</strong><br>You have earned Luck Tokens!</div>',
                        content: buildLuckChatCardHtml({ header: "Manual Entry", amount, newLuck, actorId: actor.id }),
                        whisper: getChatWhisperTargets(actor)
                    });
                }

                playAwardSound("luck");
            };

            const processLuckRoll = async (formula) => {
                const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");

                activeAwardDialog.lastLuckAwardedMap = {};

                for (const actorId of actorIds) {
                    const actor = game.actors.get(actorId);
                    if (!actor) continue;

                    const r = new Roll(formula);
                    await r.evaluate();
                    const amount = r.total;

                    const currentLuck = Number(actor.system.luck?.remaining) || 0;
                    const newLuck = currentLuck + amount;
                    await actor.update({ "system.luck.remaining": newLuck });

                    activeAwardDialog.lastLuckAwardedMap[actorId] = amount;
                    setLuckValueDisplay(activeAwardDialog.element, actorId, newLuck);

                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor }),
                        flavor: '<div class="award-flavor"><strong>Congratulations!</strong><br>You have earned Luck Tokens!</div>',
                        content: buildLuckChatCardHtml({ header: `Rolled: ${formula}`, amount, newLuck, actorId: actor.id }),
                        rolls: [r],
                        whisper: getChatWhisperTargets(actor)
                    });
                }

                playAwardSound("luck");
            };

            // ---- Currency ----
            const processCurrency = async (amounts) => {
                const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");

                const gp = Number(amounts.gp) || 0;
                const sp = Number(amounts.sp) || 0;
                const cp = Number(amounts.cp) || 0;

                if (gp === 0 && sp === 0 && cp === 0) {
                    return ui.notifications.warn("Enter at least one currency amount!");
                }

                activeAwardDialog.lastCurrencyAwardedMap = {};

                const parts = [];
                if (gp) parts.push(`${gp} Gold`);
                if (sp) parts.push(`${sp} Silver`);
                if (cp) parts.push(`${cp} Copper`);

                for (const actorId of actorIds) {
                    const actor = game.actors.get(actorId);
                    if (!actor) continue;

                    const currentGp = Number(actor.system.coins?.gp) || 0;
                    const currentSp = Number(actor.system.coins?.sp) || 0;
                    const currentCp = Number(actor.system.coins?.cp) || 0;

                    await actor.update({
                        "system.coins.gp": currentGp + gp,
                        "system.coins.sp": currentSp + sp,
                        "system.coins.cp": currentCp + cp
                    });

                    activeAwardDialog.lastCurrencyAwardedMap[actorId] = { gp, sp, cp };
                    setCurrencyValueDisplay(activeAwardDialog.element, actorId, {
                        gp: currentGp + gp,
                        sp: currentSp + sp,
                        cp: currentCp + cp
                    });

                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor }),
                        flavor: '<div class="award-flavor"><strong>Congratulations!</strong><br>You have found currency!</div>',
                        content: `
                            <div class="award-chat-card">
                                <div class="award-chat-header">Currency Awarded</div>
                                <div class="award-chat-amount">${parts.join(", ")}</div>
                            </div>
                        `,
                        whisper: getChatWhisperTargets(actor)
                    });
                }

                playAwardSound("currency");
            };

            const themeClass = getThemeClass();
            const dialogClasses = ["dialog", "seq-theme-dialog"];
            if (themeClass) dialogClasses.push(themeClass);

            const luckRollButtonsHtml = getLuckRollFormulas()
                .map(f => `<div class="luck-btn" data-type="luck-roll" data-val="${f}">${f}</div>`)
                .join("");

            const xpAddButtonsHtml = getXpAddValues()
                .map(v => `<div class="luck-btn" data-type="xp-add" data-val="${v}">${v} XP</div>`)
                .join("");

            const luckAddButtonsHtml = getLuckAddValues()
                .map(v => `<div class="luck-btn" data-type="luck-add" data-val="${v}">${v} Token${v === 1 ? '' : 's'}</div>`)
                .join("");

            const currencyAddValues = getCurrencyAddValues();
            const currencyAddButtonsHtml = (currency, label) => currencyAddValues
                .map(v => `<div class="luck-btn currency-btn" data-type="currency-add" data-currency="${currency}" data-val="${v}">${v} ${label}</div>`)
                .join("");


            activeAwardDialog = new Dialog({
                title: "Rewards",
                content: `
                    <div class="popup-title">Rewards</div>

                    <fieldset class="seq-box">
                        <legend>Options</legend>
                        <div class="luck-grid award-options-grid">
                            <div class="luck-btn award-toggle-btn" data-toggle="xp">XP</div>
                            <div class="luck-btn award-toggle-btn" data-toggle="luck">Luck</div>
                            <div class="luck-btn award-toggle-btn" data-toggle="treasure">Treasure</div>
                            <div class="luck-btn award-toggle-btn" data-toggle="currency">Currency</div>
                        </div>
                    </fieldset>

                    <fieldset class="seq-box">
                        <legend>Actors</legend>
                        ${buildActorGridHtml(actors, initialSelected)}
                    </fieldset>

                    <div class="award-panel collapsed" data-panel="xp">
                        <fieldset class="seq-box">
                            <legend>Manual Amount</legend>
                            <div class="manual-grid">
                                <input type="number" id="award-xp-amount" value="1" class="seq-input">
                                <div class="luck-btn btn-manual" data-type="xp-manual">Manual Entry</div>
                            </div>
                        </fieldset>
                        <fieldset class="seq-box">
                            <legend>Add XP</legend>
                            <div class="luck-grid">
                                ${xpAddButtonsHtml}
                            </div>
                        </fieldset>
                        <fieldset class="seq-box seq-box-no-margin">
                            <legend>Actions</legend>
                            <div class="actions-grid">
                                <div class="luck-btn btn-undo" data-type="xp-undo">Undo Last</div>
                                <div class="luck-btn btn-reset" data-type="xp-reset">Remove All</div>
                            </div>
                        </fieldset>
                    </div>

                    <div class="award-panel collapsed" data-panel="luck">
                        <fieldset class="seq-box">
                            <legend>Manual Amount</legend>
                            <div class="manual-grid">
                                <input type="number" id="award-luck-amount" value="1" class="seq-input">
                                <div class="luck-btn btn-manual" data-type="luck-manual">Manual Entry</div>
                            </div>
                        </fieldset>
                        <fieldset class="seq-box">
                            <legend>Roll Dice</legend>
                            <div class="luck-grid">
                                ${luckRollButtonsHtml}
                            </div>
                        </fieldset>
                        <fieldset class="seq-box">
                            <legend>Add Luck Tokens</legend>
                            <div class="luck-grid">
                                ${luckAddButtonsHtml}
                            </div>
                        </fieldset>
                        <fieldset class="seq-box seq-box-no-margin">
                            <legend>Actions</legend>
                            <div class="actions-grid">
                                <div class="luck-btn btn-undo" data-type="luck-undo">Undo Last</div>
                                <div class="luck-btn btn-reset" data-type="luck-reset">Remove All</div>
                            </div>
                        </fieldset>
                    </div>

                    <div class="award-panel collapsed" data-panel="treasure">
                        <fieldset class="seq-box treasure-dropzone">
                            <legend>Available Treasure</legend>
                            <div class="treasure-list"></div>
                            <div class="treasure-empty">Drag &amp; Drop Treasure</div>
                        </fieldset>
                        <fieldset class="seq-box">
                            <legend>Navigation</legend>
                            <div class="treasure-pager">
                                <div class="luck-btn treasure-page-prev" title="Previous page"><i class="fas fa-chevron-left"></i></div>
                                <div class="luck-btn treasure-page-next" title="Next page"><i class="fas fa-chevron-right"></i></div>
                            </div>
                        </fieldset>
                        <fieldset class="seq-box seq-box-no-margin">
                            <legend>Treasure Actions</legend>
                            <div class="actions-grid">
                                <div class="luck-btn btn-undo" data-type="treasure-undo">Undo Last</div>
                                <div class="luck-btn btn-reset" data-type="treasure-reset">Remove All</div>
                            </div>
                        </fieldset>
                    </div>

                    <div class="award-panel collapsed" data-panel="currency">
                        <div class="currency-top-row">
                            <fieldset class="seq-box currency-add-col">
                                <legend>Add Currency</legend>
                                <div class="luck-grid currency-grid" style="grid-template-columns: repeat(${currencyAddValues.length}, 1fr);">
                                    ${currencyAddButtonsHtml("cp", "Copper")}
                                    ${currencyAddButtonsHtml("sp", "Silver")}
                                    ${currencyAddButtonsHtml("gp", "Gold")}
                                </div>
                            </fieldset>
                            <fieldset class="seq-box currency-manual-col">
                                <legend>Manual Amount</legend>
                                <div class="currency-manual-grid">
                                    <input type="number" id="award-currency-cp" value="0" class="seq-input" placeholder="Copper">
                                    <input type="number" id="award-currency-sp" value="0" class="seq-input" placeholder="Silver">
                                    <input type="number" id="award-currency-gp" value="0" class="seq-input" placeholder="Gold">
                                    <div class="luck-btn btn-manual currency-manual-submit" data-type="currency-manual">Manual Entry</div>
                                </div>
                            </fieldset>
                        </div>
                        <fieldset class="seq-box seq-box-no-margin">
                            <legend>Currency Actions</legend>
                            <div class="actions-grid">
                                <div class="luck-btn btn-undo" data-type="currency-undo">Undo Last</div>
                                <div class="luck-btn btn-reset" data-type="currency-reset">Remove All</div>
                            </div>
                        </fieldset>
                    </div>
                `,
                render: (html) => {
                    activeAwardDialog.selectedActorIds = initialSelected;
                    activeAwardDialog.lastXpAwardedMap = {};
                    activeAwardDialog.lastLuckAwardedMap = {};
                    activeAwardDialog.lastCurrencyAwardedMap = {};
                    activeAwardDialog.treasureItems = getTreasureBoxItems();
                    activeAwardDialog.treasurePage = 0;
                    activeAwardDialog.lastTreasureAward = null;
                    renderTreasureList(html);

                    // Click an actor card to toggle it in/out of the award selection
                    html.find(".award-actor-card").click((ev) => {
                        const actorId = ev.currentTarget.dataset.actorId;
                        if (activeAwardDialog.selectedActorIds.has(actorId)) {
                            activeAwardDialog.selectedActorIds.delete(actorId);
                            $(ev.currentTarget).removeClass("selected");
                        } else {
                            activeAwardDialog.selectedActorIds.add(actorId);
                            $(ev.currentTarget).addClass("selected");
                        }
                    });

                    // Click an actor's portrait to open their character sheet (doesn't change selection)
                    html.find(".award-actor-avatar").click((ev) => {
                        ev.stopPropagation();
                        const actorId = ev.currentTarget.dataset.actorId;
                        const actor = game.actors.get(actorId);
                        if (actor) actor.sheet.render(true);
                    });

                    // Toggle buttons show/hide their matching panel below - only one
                    // panel (XP, Luck, Treasure, or Currency) can be open at a time.
                    // Panels are shown/hidden with a CSS fade+collapse (see .award-panel
                    // in style.css) rather than jQuery's slide, for a smoother transition.
                    html.find(".award-toggle-btn").click((ev) => {
                        const $btn = $(ev.currentTarget);
                        const key = ev.currentTarget.dataset.toggle;
                        const wasActive = $btn.hasClass("active");

                        html.find(".award-toggle-btn").removeClass("active");
                        html.find(".award-panel").addClass("collapsed");

                        if (!wasActive) {
                            $btn.addClass("active");
                            html.find(`.award-panel[data-panel="${key}"]`).removeClass("collapsed");
                        }
                    });

                    // Once a panel's collapse/expand transition finishes, let the
                    // window resize to fit instead of leaving an internal scrollbar.
                    html.on("transitionend", ".award-panel", (ev) => {
                        if (ev.originalEvent.propertyName !== "max-height") return;
                        if (activeAwardDialog?.rendered) activeAwardDialog.setPosition({ height: "auto" });
                    });

                    // ---- Treasure: pager (prev/next only, no page numbers) ----
                    html.find(".treasure-page-prev").click(() => {
                        if (activeAwardDialog.treasurePage > 0) {
                            activeAwardDialog.treasurePage -= 1;
                            renderTreasureList(html);
                        }
                    });
                    html.find(".treasure-page-next").click(() => {
                        const totalPages = Math.max(1, Math.ceil(activeAwardDialog.treasureItems.length / TREASURE_PAGE_SIZE));
                        if (activeAwardDialog.treasurePage < totalPages - 1) {
                            activeAwardDialog.treasurePage += 1;
                            renderTreasureList(html);
                        }
                    });

                    // ---- Treasure: drag & drop ----
                    const dropZone = html.find(".treasure-dropzone")[0];
                    dropZone.addEventListener("dragover", (ev) => ev.preventDefault());
                    dropZone.addEventListener("drop", async (ev) => {
                        ev.preventDefault();
                        let data;
                        try {
                            data = TextEditor.getDragEventData(ev);
                        } catch (err) {
                            return;
                        }
                        if (!data || data.type !== "Item") {
                            return ui.notifications.warn("Only items can be dropped into the treasure box.");
                        }

                        const item = await Item.implementation.fromDropData(data);
                        if (!item) return ui.notifications.warn("Could not resolve the dropped item.");

                        activeAwardDialog.treasureItems.push({
                            tid: foundry.utils.randomID(),
                            name: item.name,
                            img: item.img,
                            itemData: item.toObject()
                        });
                        activeAwardDialog.treasurePage = Math.ceil(activeAwardDialog.treasureItems.length / TREASURE_PAGE_SIZE) - 1;
                        renderTreasureList(html);
                    });

                    // Click a treasure item's box/picture to preview its details (Award/Remove
                    // buttons below have their own handlers and aren't affected by this)
                    html.find(".treasure-dropzone").on("click", ".treasure-item-top", (ev) => {
                        const tid = $(ev.currentTarget).closest(".treasure-item").data("tid");
                        const treasure = activeAwardDialog.treasureItems.find(t => t.tid === tid);
                        if (!treasure) return;

                        // Build a temporary, unowned copy from the saved item data so the
                        // preview works even if the original dropped item no longer exists.
                        const tempItem = new Item.implementation(treasure.itemData, { temporary: true });
                        tempItem.sheet.render(true);
                    });

                    // Award an individual treasure item to the currently selected actors
                    html.find(".treasure-dropzone").on("click", ".treasure-award-btn", async (ev) => {
                        const tid = ev.currentTarget.dataset.tid;
                        const idx = activeAwardDialog.treasureItems.findIndex(t => t.tid === tid);
                        if (idx === -1) return;

                        const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                        if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");

                        const treasure = activeAwardDialog.treasureItems[idx];
                        const createdIds = {};

                        for (const actorId of actorIds) {
                            const actor = game.actors.get(actorId);
                            if (!actor) continue;

                            const [created] = await actor.createEmbeddedDocuments("Item", [treasure.itemData]);
                            if (created) createdIds[actorId] = created.id;

                            await ChatMessage.create({
                                speaker: ChatMessage.getSpeaker({ actor }),
                                flavor: '<div class="award-flavor"><strong>Congratulations!</strong><br>You have found treasure!</div>',
                                content: buildTreasureChatCardHtml({ name: treasure.name }),
                                whisper: getChatWhisperTargets(actor)
                            });
                        }

                        playAwardSound("treasure");
                        activeAwardDialog.treasureItems.splice(idx, 1);
                        activeAwardDialog.lastTreasureAward = { treasure, createdIds };
                        renderTreasureList(html);
                        ui.notifications.info(`Awarded ${treasure.name} to ${actorIds.length} actor(s).`);
                    });

                    // Remove a single treasure item from the box without awarding it
                    html.find(".treasure-dropzone").on("click", ".treasure-remove-btn", (ev) => {
                        const tid = ev.currentTarget.dataset.tid;
                        const idx = activeAwardDialog.treasureItems.findIndex(t => t.tid === tid);
                        if (idx === -1) return;

                        const removed = activeAwardDialog.treasureItems.splice(idx, 1)[0];
                        renderTreasureList(html);
                        ui.notifications.info(`Removed ${removed.name} from Available Treasure.`);
                    });

                    // ---- All other buttons (XP / Luck / Treasure Actions) ----
                    html.find(".luck-btn[data-type]").click(async (ev) => {
                        const btn = ev.currentTarget;
                        const type = btn.dataset.type;
                        const val = btn.dataset.val;

                        if (type === "xp-add") {
                            processXp(parseInt(val));
                        } else if (type === "xp-manual") {
                            processXp(html.find("#award-xp-amount").val());
                        } else if (type === "xp-undo") {
                            const entries = Object.entries(activeAwardDialog.lastXpAwardedMap || {});
                            if (entries.length === 0) return ui.notifications.warn("No recent XP award to undo!");
                            for (const [actorId, amt] of entries) {
                                const actor = game.actors.get(actorId);
                                if (!actor) continue;
                                const currentXp = Number(actor.system.level?.xp) || 0;
                                const newXp = Math.max(0, currentXp - amt);
                                await actor.update({ "system.level.xp": newXp });
                                setXpValueDisplay(html, actorId, newXp);
                            }
                            ui.notifications.info(`Undid the last XP award for ${entries.length} actor(s).`);
                            activeAwardDialog.lastXpAwardedMap = {};
                        } else if (type === "xp-reset") {
                            const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                            if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");
                            Dialog.confirm({
                                title: "Reset XP",
                                content: `<p>Are you sure you want to remove all XP from ${actorIds.length} selected actor(s)?</p>`,
                                yes: async () => {
                                    for (const actorId of actorIds) {
                                        const actor = game.actors.get(actorId);
                                        if (!actor) continue;
                                        await actor.update({ "system.level.xp": 0 });
                                        setXpValueDisplay(html, actorId, 0);
                                    }
                                    activeAwardDialog.lastXpAwardedMap = {};
                                    ui.notifications.info("XP reset to 0 for selected actor(s).");
                                },
                                no: () => {},
                                defaultYes: false
                            });
                        } else if (type === "luck-roll") {
                            processLuckRoll(val);
                        } else if (type === "luck-add") {
                            processLuck(parseInt(val));
                        } else if (type === "luck-manual") {
                            processLuck(html.find("#award-luck-amount").val());
                        } else if (type === "luck-undo") {
                            const entries = Object.entries(activeAwardDialog.lastLuckAwardedMap || {});
                            if (entries.length === 0) return ui.notifications.warn("No recent Luck award to undo!");
                            for (const [actorId, amt] of entries) {
                                const actor = game.actors.get(actorId);
                                if (!actor) continue;
                                const currentLuck = Number(actor.system.luck?.remaining) || 0;
                                const newLuck = Math.max(0, currentLuck - amt);
                                await actor.update({ "system.luck.remaining": newLuck });
                                setLuckValueDisplay(html, actorId, newLuck);
                            }
                            ui.notifications.info(`Undid the last Luck award for ${entries.length} actor(s).`);
                            activeAwardDialog.lastLuckAwardedMap = {};
                        } else if (type === "luck-reset") {
                            const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                            if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");
                            Dialog.confirm({
                                title: "Reset Luck",
                                content: `<p>Are you sure you want to remove all Luck tokens from ${actorIds.length} selected actor(s)?</p>`,
                                yes: async () => {
                                    for (const actorId of actorIds) {
                                        const actor = game.actors.get(actorId);
                                        if (!actor) continue;
                                        await actor.update({ "system.luck.remaining": 0 });
                                        setLuckValueDisplay(html, actorId, 0);
                                    }
                                    activeAwardDialog.lastLuckAwardedMap = {};
                                    ui.notifications.info("Luck reset to 0 for selected actor(s).");
                                },
                                no: () => {},
                                defaultYes: false
                            });
                        } else if (type === "currency-add") {
                            processCurrency({ [btn.dataset.currency]: parseInt(val) });
                        } else if (type === "currency-manual") {
                            const gp = parseInt(html.find("#award-currency-gp").val()) || 0;
                            const sp = parseInt(html.find("#award-currency-sp").val()) || 0;
                            const cp = parseInt(html.find("#award-currency-cp").val()) || 0;
                            processCurrency({ gp, sp, cp });
                        } else if (type === "currency-undo") {
                            const entries = Object.entries(activeAwardDialog.lastCurrencyAwardedMap || {});
                            if (entries.length === 0) return ui.notifications.warn("No recent currency award to undo!");
                            for (const [actorId, amt] of entries) {
                                const actor = game.actors.get(actorId);
                                if (!actor) continue;
                                const currentGp = Number(actor.system.coins?.gp) || 0;
                                const currentSp = Number(actor.system.coins?.sp) || 0;
                                const currentCp = Number(actor.system.coins?.cp) || 0;
                                const newGp = Math.max(0, currentGp - (amt.gp || 0));
                                const newSp = Math.max(0, currentSp - (amt.sp || 0));
                                const newCp = Math.max(0, currentCp - (amt.cp || 0));
                                await actor.update({
                                    "system.coins.gp": newGp,
                                    "system.coins.sp": newSp,
                                    "system.coins.cp": newCp
                                });
                                setCurrencyValueDisplay(html, actorId, { gp: newGp, sp: newSp, cp: newCp });
                            }
                            ui.notifications.info(`Undid the last currency award for ${entries.length} actor(s).`);
                            activeAwardDialog.lastCurrencyAwardedMap = {};
                        } else if (type === "currency-reset") {
                            const actorIds = Array.from(activeAwardDialog.selectedActorIds);
                            if (actorIds.length === 0) return ui.notifications.warn("Select at least one actor!");
                            Dialog.confirm({
                                title: "Reset Currency",
                                content: `<p>Are you sure you want to remove all Gold, Silver, and Copper from ${actorIds.length} selected actor(s)?</p>`,
                                yes: async () => {
                                    for (const actorId of actorIds) {
                                        const actor = game.actors.get(actorId);
                                        if (!actor) continue;
                                        await actor.update({ "system.coins.gp": 0, "system.coins.sp": 0, "system.coins.cp": 0 });
                                        setCurrencyValueDisplay(html, actorId, { gp: 0, sp: 0, cp: 0 });
                                    }
                                    activeAwardDialog.lastCurrencyAwardedMap = {};
                                    ui.notifications.info("Currency reset to 0 for selected actor(s).");
                                },
                                no: () => {},
                                defaultYes: false
                            });
                        } else if (type === "treasure-undo") {
                            const last = activeAwardDialog.lastTreasureAward;
                            if (!last) return ui.notifications.warn("No recent treasure award to undo!");

                            for (const [actorId, itemId] of Object.entries(last.createdIds)) {
                                const actor = game.actors.get(actorId);
                                if (actor?.items.get(itemId)) {
                                    await actor.deleteEmbeddedDocuments("Item", [itemId]);
                                }
                            }

                            activeAwardDialog.treasureItems.push(last.treasure);
                            activeAwardDialog.lastTreasureAward = null;
                            renderTreasureList(html);
                            ui.notifications.info(`Undid the award of ${last.treasure.name}.`);
                        } else if (type === "treasure-reset") {
                            const count = activeAwardDialog.treasureItems.length;
                            if (count === 0) return ui.notifications.warn("No treasure to remove!");
                            Dialog.confirm({
                                title: "Remove All Treasure",
                                content: `<p>Are you sure you want to remove all ${count} item(s) from the Available Treasure box? This does not award them to anyone.</p>`,
                                yes: () => {
                                    activeAwardDialog.treasureItems = [];
                                    renderTreasureList(html);
                                    ui.notifications.info("Cleared the Available Treasure box.");
                                },
                                no: () => {},
                                defaultYes: false
                            });
                        }
                    });
                },
                buttons: {},
                close: () => { activeAwardDialog = null; window.activeAwardDialog = null; }
            }, {
                classes: dialogClasses,
                width: getAwardDialogWidth(),
                height: "auto"
            }).render(true);

            window.activeAwardDialog = activeAwardDialog;
};

export const setupAwardButton = (tokenControls) => {
    tokenControls.tools['award-button'] = {
        name: 'award-button',
        title: 'Rewards',
        icon: 'fas fa-gift',
        button: true,
        onClick: async () => {
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            openAwardDialog();
        }
    };
};