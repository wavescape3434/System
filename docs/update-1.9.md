# Version 1.9 — Character appearances

Choose from **24 original adult character designs** with slimmer proportions, detailed costumes, varied hairstyles and complexions, and distinct silhouettes. The roster uses original characters inspired by the variety of HD-2D JRPG parties.

Open **Settings → Appearance**, **Adventures → Party → Character appearance**, or the appearance chooser during registration. Search by name or outfit, filter by style or silhouette, preview a look, then press **Use**. Every appearance is available without a cost or class requirement.

| Arms | Arcana | Wilds | Court & Craft |
|---|---|---|---|
| Dawnblade | Moonsilk Dancer | Wildwood Archer | Gilded Minstrel |
| Iron Valkyrie | Velvet Enchantress | Falcon Huntress | Sapphire Songstress |
| Dusk Ronin | Starlit Savant | Nightblade | Brass Artificer |
| Rose Duelist | Ivory Cleric | Ash Assassin | Wandering Apothecary |
| Amber Sentinel | Ember Arcanist | Frost Warden | Silver Courtier |
| Desert Lancer | | | Pearl Merchant |
| Crimson Corsair | | | |
| Sunborne Monk | | | |

Moonsilk Dancer, Velvet Enchantress, and Crimson Corsair provide the alluring heroine options. The wider roster includes armored women, mature warriors, scholars, hunters, artisans, travelers, a monk, a courtier, and a merchant.

A selected appearance remains independent of class. Switching to Bard can retain the Dawnblade or Moonsilk Dancer look while using the Bard's own combat abilities. Selection updates the battle sprite and turn-order portrait; it can update an ongoing battle without resetting HP, MP, inventory, damage, or the turn. Appearance does not affect real-world stats, combat stats, class requirements, equipment, progression, or assessment reference groups.

Each of the seven recruitable companions has a distinct design from the new visual roster. Existing saves without an appearance use a default matching their class family until a look is explicitly selected. The engraved Guild Card is unchanged.

The original transparent atlas is bundled for offline use. Per-character alpha boundaries prevent neighboring artwork from appearing inside a frame. The atlas PNG is kept intact; the optional art-preparation script reads its alpha to produce render metadata. Running that script requires Pillow, NumPy, and SciPy; normal app installation and builds use the committed metadata and require no Python art tooling.

These are full-body standing battle sprites, with existing hit, damage, and defeat effects. Dedicated walking and attack-animation frames remain future work.

Version **1.9.0**, Android version code **11**. The package, signing certificate, and local storage key remain stable. [Roster and battle previews](screenshots/README.md).
