# Changelog

All notable changes to this module will be documented in this file.

## [1.0.1] - 2026-07-11

### Security
- Escaped actor names, item/treasure names, and image paths before inserting them into dialog HTML and chat cards. These values are player-controlled (character/item names), and were previously interpolated unescaped, which could allow a maliciously-named actor or item to inject HTML/JS that ran in the GM's client (or in every connected client, for the chat-broadcast case). No known exploit occurred; found during a security review.

## [1.0.0] - 2026-07-11

### Added
- Initial release.
- Combined Rewards dialog for awarding XP, Luck, Treasure, and Currency.
- Undo/Redo controls on XP and Luck chat cards.
- Light Tracker window for monitoring active light sources across the party.
- "Turn Out the Lights" bulk light-extinguish tool.
- Seven selectable color themes (Default, Light, Dark, Black & Gold, Verdant, Blood, Arcane, Frost).
- Configurable quick-add values, sound effects, chat card visibility, and Light Tracker warning threshold.
- Keybinds to open the Rewards and Light Tracker windows.
