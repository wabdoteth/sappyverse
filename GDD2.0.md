# Game Design Document (GDD)

## 0. Working Title

**“Shards of the Withering Wilds”**
*(Placeholder; subject to change during production.)*

---

## 1. High Concept

A **2.5D, pixel-art, roguelite hack-and-slash** inspired by *Don’t Starve*’s skewed top-down world view and survivalist tone. Players begin each run in a cozy-but-eerie **starting town hub**, interact with quirky NPCs through dialog bubbles and menus, and venture into procedurally generated "rooms" of the **Withering Wilds**. Combat layers a **rock–paper–scissors (RPS) combat triangle** atop real-time action, ensuring tactical variety. Skillful play lets players optimize each run, but depth scaling and statistical impossibility guarantee eventual defeat—fueling a compelling **meta-progression loop** of permanent upgrades, unlocks, and narrative breadcrumbs.

---

## 2. Pillars & Vision

1. **Turn‑Based RPS Skirmishes:** Strategic, simultaneous Rock‑Paper‑Scissors turns (Sword, Shield, Magic) where winning applies full attack and shield restoration, while managing 3‑charge weapons.
2. **Endless Depth, Eventual Demise:** Procedural rooms escalate difficulty beyond human limits, creating tense decision-making and thrilling close calls.
3. **Meta-Progression that Matters:** Between runs, players invest resources to unlock gear, traits, and town upgrades that shape their build strategies.
4. **Hand-Crafted Feel in Procedural Spaces:** While rooms are generated, curated rule sets ensure strong pacing, varied biomes, and meaningful choices.
5. **Don’t Starve–Inspired Visual Identity in Pixel Art:** A skewed 2.5D perspective, bleak whimsy, and expressive animation—filtered through chunky pixels and limited palettes for readability and performance.
6. **Talkative Town & Diegetic UI:** NPCs communicate via diegetic speech bubbles; menus feel like in-world artifacts. Systems are discoverable through playful interactions.
7. **Tooling for AI-Assisted Dev:** Clear, modular code architecture (Phaser 3), JSON-driven content, and promptable systems designed to work well with Claude (or other LLMs) for rapid iteration.

---

## 3. Inspirations & Differentiators

* **Primary Inspiration:** *Don’t Starve* – The angled, paper-doll view and survivalist melancholy; however, we pivot to pixel art and action combat.
* **Secondary Inspirations:** *Hades* (meta-progression & combat feel), *Dead Cells* (roguelite loop & gear variety), *RuneScape* (combat triangle), *Binding of Isaac* (room-based progression & near-impossible late-game odds).
* **Differentiators:**

  * RPS dynamic embedded in real-time combat (not turn-based choice menus).
  * Durability & consumable economy complicate loadout decisions mid-run.
  * A talkative, evolving hub town reflecting meta-progression and run history.
  * Pixel art aesthetic with skewed pseudo-isometric camera—rare combo.

---

## 4. Target Audience & Platforms

* **Audience:** Fans of roguelites who enjoy high skill ceilings, build crafting, and stylized survival atmospheres; ages 13+.
* **Platforms:** Web (desktop browsers), with possible packaging for desktop (Electron/Tauri) and mobile later.
* **Monetization (TBD):** Premium purchase or F2P with cosmetic-only microtransactions. (Decide post-prototype.)

---

## 5. Art Direction

### 5.1 Visual Style

* **Pixel Art Resolution:** Base internal resolution (e.g., 320x180 or 400x225) scaled up (x3/x4) for chunky pixels and crisp UI.
* **Palette:** Muted earth tones, desaturated greens/browns in the Wilds; warm lamplight oranges in town. Occasional saturated accent colors for VFX (magic, hitsparks) to maintain clarity.
* **Perspective:** Skewed top-down 2.5D. Ground tiles angled to give parallax-like depth; characters with slight vertical squash to imply height.
* **Animation:** Limited-frame animations with strong silhouettes. Exaggerated key frames for attacks and enemy telegraphs.

### 5.2 UI & UX Visuals

* **Diegetic UI:** Speech bubbles for dialogue; hand-drawn (pixel) panels for menus. Inventory laid out like a rucksack grid.
* **Icons:** Simple, high-contrast silhouettes for items/status effects.
* **HUD:** Minimalist—HP bar, stamina/energy bar, active weapon & durability, consumables count, room depth.

---

## 6. Audio Direction

* **Music:** Sparse, ambient tracks in town; tense, percussive loops in dungeon rooms. Dynamic layering as danger escalates.
* **SFX:** Crunchy, retro-inspired effects softened to fit the melancholic tone. Distinct cues for RPS hits (e.g., when you land a counter-advantage hit).
* **Voice:** No voiced dialogue; NPCs use short “blips” or tonal chirps accompanying text.

---

## 7. Gameplay Systems

### 7.1 Core Loop

1. **Hub Prep:** Talk to NPCs, upgrade gear/skills, craft consumables.
2. **Enter Wilds:** Choose a gate/portal and begin run.
3. **Room Progression:** Clear room → choose next branch/reward → deeper room (repeat).
4. **Death/Retreat:** On defeat (or voluntary exit), return to town; resources converted to meta-progress.
5. **Spend & Plan:** Invest in permanent upgrades (town facilities, traits, gear unlocks), then repeat.

### 7.2 Room Skirmish System

* **Battle Setup:** At the start of every room the player sprite stands on the middle‑left, the enemy on the middle‑right in a side‑view standoff.

* **Actions:** Each turn both combatants secretly pick **Sword**, **Shield**, or **Magic**.

  | Action         | Beats  | Attack ⬆ | Shield ⬆ | Notes            |
  | -------------- | ------ | -------- | -------- | ---------------- |
  | **Sword** 🗡️  | Shield | High     | Low      | Pure aggression  |
  | **Shield** 🛡️ | Magic  | Low      | High     | Defensive stance |
  | **Magic** ✨    | Sword  | Mid      | Mid      | Versatile        |

* **Resolution Rules**

  1. Reveal selections simultaneously.
  2. **Win:** If your action beats the opponent’s, apply your full *Attack* to their HP and your *Shield* gain to your Barrier. Opponent’s values are cancelled.
  3. **Loss:** Opposite of win.
  4. **Draw:** Both sets of values apply.
  5. Barrier absorbs damage before HP. Barrier cannot exceed its max value.

* **Charge (Durability) Economy**

  * Each weapon type has **3 charges**.
  * Using an action consumes **1** charge.
  * A depleted action is unavailable until it spends **one full turn recharging** (charge +1 per idle turn).
  * Players must rotate options and read the enemy to maintain pressure.

* **Victory & Defeat**

  * Reduce enemy HP to **0** → Room cleared, proceed to reward selection.
  * If player HP hits **0** the run ends.

* **Feel & Feedback**
  Quick (<3 s) decision timers, big sprite animations, hit‑sparks, and color‑coded numbers (green = advantage win, yellow = draw, red = loss).

### 7.3 Enemy Design Enemy Design

* **Archetypes:**

  * **Melee Brute:** Charges, short-range bursts; vulnerable to magic slows.
  * **Ranged Hunter:** Kites, lays traps; weak to rapid melee gap-closing.
  * **Magic Wisp:** Area denial, shields; arrows disrupt casting.
* **Hybrids/Bosses:** Shift types mid-fight; layered defenses requiring gear swaps.
* **Scaling:** Health/damage scale per depth; new modifiers (e.g., “Armored”, “Regenerating”, “Explosive Death”) appear at thresholds.

### 7.4 Rooms & Biomes

* **Room Structure:** Each room is a self-contained combat arena with obstacles. Procedurally assembled from prefabs (tiles + prop sets).
* **Biomes:** Rotating themes: Rotwood Thicket (poison spores), Shiver Marsh (slow floors), Ember Caverns (lava hazards). Each biome favors certain enemy types (but never exclusively).
* **Branching Paths:** After clearing, player chooses between 2–3 door options: e.g., “Weapon Cache Room”, “Elite Fight”, “Healing Fountain”. Icons above exits communicate reward type.
* **Impossible Scenarios:** At high depths, rooms may combine tough modifiers and enemy mixes that are statistically overwhelming, ending the run.

### 7.5 Gear & Charge System (formerly Durability)

* **Gear Slots & Actions**

  * **Blade** → Sword action
  * **Bulwark** → Shield action
  * **Focus** → Magic action

* **Base Stats**

  | Action | Base Attack | Base Shield Gain |
  | ------ | ----------- | ---------------- |
  | Sword  | **4**       | 0                |
  | Shield | 0           | **4**            |
  | Magic  | **2**       | **2**            |

* **Charges**

  * Each action starts with **3 charges**.
  * Charges regenerate at **+1 per unused turn** (to a max of 3).

* **On‑Run Upgrade Cards**
  See table and rules in section **On‑Run Upgrade Cards** above.

* **Out‑of‑Run Upgrades**

  * Spend gold in town to permanently increase base stats (capped at +4 each) or unlock charge/refresh perks.

### 7.6 Consumables Consumables Consumables

* **Types:** Healing tonics, stamina draughts, temporary damage buffs, resistance potions.
* **Run-Bound:** Reset after death. Encourage use (no hoarding between runs).
* **Crafting:** Alchemist NPC crafts better potions using run-earned reagents.

### 7.7 Meta-Progression

* **Currencies:** "Shards" (persistent), "Essence" (temporary score), “Gold” (resets each run unless banked via upgrade).
* **Upgrades:**

  * **Town Facilities:** Unlock new NPC services, improved shop stock, training dummies.
  * **Player Traits:** Permanent stat boosts (HP, speed) or passive abilities (extra dash, potion efficiency).
  * **Starting Loadouts:** Unlock new starter gear sets or extra consumable slots.
* **Narrative Unlocks:** Lore snippets, NPC story arcs, cosmetic changes in town.

---

## 8. Narrative & Worldbuilding

* **Tone:** Grim whimsy; dark forest fairy tale meets post-collapse alchemy. NPCs are eccentric survivors.
* **Loop Justification:** The Wilds "reset" due to a curse; death returns the soul to town (the last safe hearth).
* **NPC Roles:**

  * **The Tinkerer (Blacksmith):** Repairs gear, upgrades weapons.
  * **The Apothecary:** Crafts consumables, offers buffs for next run.
  * **The Archivist:** Stores lore, unlocks meta-traits via "Shards".
  * **The Gatekeeper:** Starts dungeon runs, tracks depth records.
  * **Misc. Flavor NPCs:** Provide world hints, side objectives.
* **Progressive Town Evolution:** Visual upgrades and new buildings appear as players invest, reinforcing progress.

---

## 9. Controls & Input (PC baseline)

* **Movement:** WASD / Arrow Keys
* **Primary Attack:** Left Mouse / J / Ctrl
* **Secondary/Skill:** Right Mouse / K / Alt
* **Dodge/Roll:** Spacebar / Shift
* **Interact/Talk:** E / Enter
* **Inventory/Map:** I / Tab
* **Consumable Quick-Use:** 1–4 hotkeys
* **Gamepad:** Stick for movement, face buttons for attacks/roll, shoulder buttons for consumables.

(Actual bindings customizable via settings.)

---

## 10. UI/UX Flow

* **Town HUD:** Minimal—quest markers over NPCs, player stats in a corner.
* **Dialogue:** Speech bubble appears over NPC; player choices shown as a vertical list underneath.
* **Menus:**

  * **Inventory/Equipment:** Grid with drag/drop or key-based navigation; durability bars shown on items.
  * **Shop/Upgrade Menus:** Scrollable lists with categories; confirm/cancel prompts.
  * **Run Summary Screen:** After death: depth reached, enemies slain, shards earned, notable events.
* **Onboarding:** Interactive tooltips first time a system appears (e.g., first durability loss, first counter hit). Hints can be toggled off.

---

## 11. Technical Design (Phaser.js)

### 11.1 Engine Choice

* **Phaser 3 (Stable):** Mature, well-documented, large ecosystem (plugins, RexUI, etc.) — recommended for production.
* **Phaser 4 (Beta):** Consider only if specific new features are essential; otherwise keep to 3 until 4 is stable.

### 11.2 Project Structure

```
/src
  /scenes
    BootScene.js
    PreloadScene.js
    TownScene.js
    DungeonScene.js
    UIScene.js
    MenuScene.js
  /systems
    DialogueSystem.js
    InventorySystem.js
    CombatSystem.js
    RPSLogic.js
    DurabilitySystem.js
    ProceduralGen.js
    MetaProgression.js
  /entities
    Player.js
    Enemy.js
    NPC.js
    Item.js
  /data
    items.json
    enemies.json
    dialogues.json
    rooms.json (prefabs)
  /utils
    StateMachine.js
    RNG.js
    SaveLoad.js
```

### 11.3 Scenes & State Flow

* **BootScene:** Configure game, load minimal assets.
* **PreloadScene:** Load bulk assets; show loading bar.
* **MenuScene:** Main menu, settings.
* **TownScene:** Overworld hub; NPC interactions; entry point to runs.
* **DungeonScene:** Core gameplay; generates rooms sequentially; handles combat, loot.
* **UIScene:** Persistent overlay for HUD, inventory, dialogs.
* **GameOver/RunSummary Scene:** Post-run results.

Phaser allows multiple active scenes; use UIScene as overlay (set to render on top). Pass data between scenes via `this.registry` or Phaser’s event emitter.

### 11.4 Combat Implementation

* **Physics:** Arcade Physics (no gravity). Colliders for player/enemy/walls; overlaps for hitboxes.
* **Hitboxes:** Create ephemeral sprites or bodies during attack frames to detect hits.
* **Damage Calc:** Check attackType vs enemyType → apply multiplier (e.g., 1.25x advantage, 0.8x disadvantage). Centralize in `RPSLogic.js`.
* **Cooldowns & i-Frames:** Timers or state flags; use Phaser’s time events.

### 11.5 Dialogue & Menus

* **DialogueSystem.js:** Reads dialogues.json (with NPC ids, lines, choices). Creates speech bubble graphics and text objects.
* **RexUI (optional):** For slick lists, sliders, scrolling panels.
* **Menus:** Implement as Containers with interactive Text/Button objects; toggle visibility, or open via dedicated UI Scene.

### 11.6 Inventory & Durability

* **InventorySystem.js:** Manages arrays of item objects; equip/unequip functions; emits events to UI.
* **DurabilitySystem.js:** Hooks into combat events to decrement. Handles break events (remove item, play FX).
* **UI:** Durability bars drawn via Graphics or pre-made bar sprites overlayed on item icons.

### 11.7 Procedural Generation

* **Rooms:** Prefab templates (tilemap chunks + prop spawn points). RNG picks a template; populates enemies based on depth and biome weighting.
* **Enemy Waves:** JSON defines enemy lists per depth bracket. Random modifiers applied per room (e.g., “All enemies are Ranged”, “Slippery floor”).
* **Rewards:** Weighted loot tables; ensure a steady drip of consumables/gear to support durability system.

### 11.8 Meta-Progression Data

* **Persistent Save:** LocalStorage or IndexedDB JSON blob.
* **Registry Use:** Keep run data (current depth, temp gold) in registry for easy cross-scene access.
* **Upgrade Trees:** JSON-driven; NPC menus read from these to display purchasable upgrades.

### 11.9 Tooling & AI Integration (Claude)

* **Prompt-Friendly JSON:** Content files (items, enemies, dialogs) structured cleanly. Example item JSON template that Claude can expand:

```json
{
  "id": "iron_sword",
  "type": "weapon",
  "rps": "melee",
  "baseDamage": 12,
  "durability": 100,
  "rarity": "common",
  "modifiers": []
}
```

* **Code Generation Guardrails:** Provide Claude with function signatures and subsystem APIs. Example: `CombatSystem.applyDamage(attacker, target, attackType)` docs.
* **Modularity:** Smaller files & classes so LLM can reason about them individually.

---

## 12. Content Plan

### 12.1 MVP Scope

* 1 biome (Rotwood Thicket)
* 10 enemy types (3 per RPS type + 1 hybrid boss)
* 15 weapons, 10 armors, 10 consumables
* 5 town NPCs with basic services
* Basic meta-upgrade tree (10 nodes)
* Procedural room generation with 20 room templates

### 12.2 Vertical Slice Goals

* Full loop (town → dungeon → death → meta upgrade → repeat)
* Polished combat feel (hitstop, VFX, audio cues)
* At least 1 RPS-clear advantage scenario the tutorial explains

### 12.3 Full Release Targets

* 3+ biomes, 40+ enemies, 60+ items, 30+ consumables
* Multiple bosses and mini-bosses
* Deep meta trees & visual town evolution
* Challenge modes / daily runs

---

## 13. Production Roadmap (High-Level)

1. **Pre-Prod (2–4 weeks):** Prototyping combat feel, camera, basic room generation, RPS math.
2. **Core Systems (6–8 weeks):** Inventory, durability, dialogue, NPC services, meta-progression framework.
3. **Content Pass 1 (4–6 weeks):** Biome 1, enemy set, starter items, town NPCs.
4. **Vertical Slice (2–3 weeks):** Polish first biome, UX, tutorialization.
5. **Content Expansion (8–12 weeks):** Additional biomes, enemies, items, bosses.
6. **Polish & QA (4–6 weeks):** Balance, bug fixing, performance.
7. **Launch Prep (2 weeks):** Marketing assets, store pages, build deployment.

(Adjust timelines per team size.)

---

## 14. Risks & Mitigations

* **Procedural Boredom:** Randomness can feel samey. → Use handcrafted templates + rule-based variation, not pure RNG.
* **RPS Complexity Overload:** Players may ignore counters if unclear. → Clear UI cues, tutorial pop-ups, and big feedback on advantageous hits.
* **Durability Frustration:** Overly punishing breakage leads to annoyance. → Tune durability generously; provide repair kits; communicate durability early.
* **Performance on Web:** Too many particles or physics bodies can lag. → Pooling, culling, and minimalist FX options.
* **Scope Creep:** Feature creep in meta systems is tempting. → Lock MVP, iterate post-vertical slice.

---

## 15. QA & Telemetry

* **Analytics:** Track depth reached, cause of death, gear used, potion usage rate, counter-hit frequency.
* **Heatmaps (optional):** Where do players die most? Which rooms get skipped?
* **A/B Tests:** Different durability rates or RPS multipliers to find sweet spot.

---

## 16. Glossary

* **2.5D:** 2D art/logic with perspective tricks for depth.
* **RPS Triangle:** Rock–paper–scissors style counter system (Melee > Ranged > Magic > Melee).
* **Run:** A single attempt from entering the Wilds until death/exit.
* **Meta-Progression:** Persistent upgrades across runs.
* **Biome:** Themed set of rooms/enemies/hazards.

---

## 17. Future Extensions (Post-Launch Ideas)

* **Co-op Mode:** 2-player runs with combo attacks.
* **Daily Challenges:** Seeded runs with leaderboard.
* **Mod Support:** JSON content packs; community-made items/rooms.
* **Seasonal Events:** Time-limited biomes or NPC festivals.

---

## 18. Appendices

### 18.1 Example Dialogue JSON Snippet

```json
{
  "npcId": "blacksmith",
  "dialogues": [
    {
      "text": "Blades dull quick in the Wilds. Need a touch-up?",
      "choices": [
        { "label": "Repair gear", "action": "open_repair_menu" },
        { "label": "Upgrade weapon", "action": "open_upgrade_menu" },
        { "label": "Nevermind", "action": "close" }
      ]
    }
  ]
}
```

### 18.2 Example Item Data

```json
{
  "id": "ember_bow",
  "name": "Ember Bow",
  "type": "weapon",
  "rps": "ranged",
  "rarity": "rare",
  "baseDamage": 18,
  "attackSpeed": 0.9,
  "durability": 80,
  "modifiers": ["burn_chance"]
}
```

### 18.3 Attack Resolution Pseudocode

```js
function applyDamage(attacker, target, attackType) {
  const base = attacker.stats.damage;
  const mult = RPSLogic.getMultiplier(attackType, target.type); // returns 1.25, 1.0, or 0.8
  const dmg = Math.floor(base * mult * randomVariance());
  target.hp -= dmg;
  showDamageNumber(target, dmg, mult);
  if (attacker.weapon) DurabilitySystem.onUse(attacker.weapon);
}
```

---

## 19. Sign-Off & Living Document Note

This GDD is a living document. As systems evolve and playtests provide feedback, update sections (especially balance numbers, content lists, and timelines). Maintain clear versioning and changelogs.

**Next Steps:**

* Validate core combat prototype.
* Build content JSON schemas.
* Draft initial town & dungeon scenes in Phaser.
* Begin meta-progression economy balancing spreadsheet.

---

*End of Document*
