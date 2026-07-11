# Shadowdark: Rewards

*XP, Luck, Treasure, and Currency — one dialog, zero fuss.*

[![Foundry Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Frcxzilla%2Fshadowdark-rewards%2Fmain%2Fmodule.json&query=$.compatibility.verified&logoColor=white&label=Foundry%20version&labelColor=whitesmoke&color=black)](https://foundryvtt.com)
[![System](https://img.shields.io/badge/system-shadowdark-black?labelColor=white)](https://foundryvtt.com/packages/shadowdark)
[![Latest Release](https://img.shields.io/github/v/release/rcxzilla/shadowdark-rewards?labelColor=white&color=black)](https://github.com/rcxzilla/shadowdark-rewards/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/rcxzilla/shadowdark-rewards/total?labelColor=white&color=black)](https://github.com/rcxzilla/shadowdark-rewards/releases)
[![License](https://img.shields.io/github/license/rcxzilla/shadowdark-rewards?labelColor=white&color=black)](LICENSE)

*A GM toolkit for the [Shadowdark](https://foundryvtt.com/packages/shadowdark) system in FoundryVTT. Award XP, Luck, Treasure, and Currency to your party from one combined dialog, and keep an eye on everyone's torches and lanterns with a live Light Tracker — complete with Undo/Redo, quick-add buttons, sound effects, and seven color themes.*

> **Screenshots below are placeholders — swap them out for your own.**

<!-- Replace this image with a real screenshot, e.g. screenshots/rewards-dialog.png -->
![Rewards dialog screenshot](https://placehold.co/1000x600?text=Rewards+Dialog+Screenshot)
*The Rewards dialog: XP, Luck, Treasure, and Currency behind one shared actor selection.*

---

## Features

- **One Rewards dialog, four tools** — Award XP, Luck (manual or rolled), Treasure (drag & drop from any item), and Currency (Gold/Silver/Copper) to any combination of party members at once.
- **Undo/Redo everywhere** — Every award posts a chat card with a collapsible Undo control, and the Rewards dialog itself has an "Undo Last" button for each category.
- **Light Tracker** — A live window showing every player character's active light sources and remaining burn time, with a red low-light warning, a pause/unpause status pill, and a one-click "Turn Out the Lights" to extinguish everything at once.
- **Player-facing option** — Optionally let players open their own read-only Light Tracker, scoped to just the characters they own.
- **Seven color themes** — Default (Purple), Light, Dark, Black & Gold, Verdant, Blood, Arcane, and Frost — switch live without reopening any windows.
- **Configurable everything** — Quick-add XP/Luck/Currency values, Luck roll formulas, chat card visibility (Public / GM only / Player + GM), sound effects per award type, Light Tracker warning threshold, and Rewards window width all live in Module Settings.
- **Keybinds** — Open the Rewards window (`Ctrl+A`, GM only) or the Light Tracker (`Ctrl+L`) without touching the token toolbar.

## Screenshots

<!-- Replace these with real screenshots, e.g. screenshots/light-tracker.png -->
![Light Tracker screenshot](https://placehold.co/1000x600?text=Light+Tracker+Screenshot)
*The Light Tracker keeping watch over the party's light sources.*

![Chat card screenshot](https://placehold.co/1000x600?text=Chat+Card+Screenshot)
*Award chat cards with a collapsible Undo/Redo control.*

## Installation

1. In Foundry's **Add-on Modules** tab, click **Install Module**.
2. Paste the manifest URL below and click **Install**:
   ```
   https://github.com/rcxzilla/shadowdark-rewards/releases/latest/download/module.json
   ```
3. Enable **Shadowdark: Rewards** in your world's Module Management.

## Usage

- Click the gift icon in the token controls (GM only) to open **Rewards**, or press `Ctrl+A`.
- Click the flame icon to open the **Light Tracker**, or press `Ctrl+L`.
- Select one or more actors in the Rewards dialog, pick a category (XP / Luck / Treasure / Currency), and award away.
- Drag any item onto the Treasure panel's drop zone to add it to the Available Treasure box before awarding it.

## Settings

All settings are under **Configure Settings → Module Settings → Shadowdark: Rewards**:

| Setting | Description |
| --- | --- |
| Popup Theme | Color theme for the Rewards and Light Tracker windows |
| Reward Window Width | Width of the Rewards dialog, in pixels |
| Light Warning Threshold | Minutes remaining before a light's timer turns red |
| Auto-Open Light Tracker | Automatically opens the Light Tracker for the GM on world load |
| Allow Players to View Light Tracker | Gives players a read-only Light Tracker for their own character(s) |
| Hide Actors Without Lights By Default | Starts the Light Tracker with lightless actors hidden |
| Chat Card Visibility | Public, GM only, or Receiving Player + GM |
| Luck Roll Dice Options | Quick-roll dice formulas for Award Luck |
| Add XP / Luck / Currency Values | Quick-add button amounts for each reward type |
| Sound Effects | Optional sound per award type (XP, Luck, Treasure, Currency, Light Expired) |

## Compatibility

Built and verified against Foundry VTT v14 with the Shadowdark system. Not tested against other systems, since it reads and writes Shadowdark-specific actor data (`system.level.xp`, `system.luck.remaining`, `system.coins`, `system.light`).

## AI Disclosure

Parts of this module (code and/or documentation) were written with the assistance of AI tools. It has been reviewed and tested by the author, but as with any Foundry module, **use at your own risk** — always keep a backup of your world before installing or updating modules. Please open an [issue](https://github.com/rcxzilla/shadowdark-rewards/issues) if you run into a bug.

## License

Released under the [MIT License](LICENSE). This module contains no Shadowdark RPG text or art assets — it only reads and writes data exposed by the Shadowdark system.

## Acknowledgments

- The [Shadowdark](https://www.thearcanelibrary.com/pages/shadowdark) RPG by The Arcane Library.
- The [Shadowdark FoundryVTT system](https://foundryvtt.com/packages/shadowdark) team.
