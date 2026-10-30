class_name Kingdoms
# The kingdoms of the world, their people and their beasts of war. Who rules each city changes as cities are taken;
# what they look like comes from the role and the city's style.
const FACTIONS := {
	"blue": {"name": "ממלכת אמזוניה", "short": "אמזוניה", "color": Color(0.22, 0.45, 0.9), "chief": "ראש השבט"},
	"red": {"name": "ממלכת הצפון", "short": "הצפון", "color": Color(0.82, 0.18, 0.15), "chief": "מלך הצפון"},
	"green": {"name": "שבט האי האבוד", "short": "שבט האי", "color": Color(0.25, 0.62, 0.25), "chief": "ראש השבט הירוק"},
	"black": {"name": "השודדים", "short": "השודדים", "color": Color(0.16, 0.16, 0.19), "chief": "רב החובל"},
}
# each city: who held it first, the people by role, its beasts of war and its horses
const CITIES := {
	"home": {"owner": "blue", "plan": {"knight": 40, "warrior": 70, "archer": 40, "farmer": 20, "builder": 12, "lumberjack": 10, "smith": 8,
		"merchant": 12, "cook": 10, "fisher": 12, "sailor": 25, "groom": 10, "healer": 6, "hunter": 25}, "horses": 48, "beasts": {}},
	"north": {"owner": "red", "plan": {"knight": 24, "warrior": 50, "archer": 24, "farmer": 24, "builder": 8, "smith": 6, "merchant": 10, "cook": 8,
		"fisher": 10, "groom": 8, "healer": 4, "sailor": 6}, "horses": 34, "beasts": {"warwolf": 12}, "gold": 900},
	"lost": {"owner": "green", "plan": {"warrior": 60, "archer": 22, "farmer": 20, "hunter": 15, "fisher": 10, "healer": 5}, "horses": 0,
		"beasts": {"raptor": 10, "triceratops": 3, "trex": 1}, "gold": 500},
	"pirate": {"owner": "black", "plan": {"warrior": 55, "archer": 20, "sailor": 15, "cook": 5, "merchant": 5, "fisher": 5}, "horses": 0,
		"beasts": {"wardog": 12}, "gold": 1200},
}
const ROLES := {
	"knight": {"name": "אביר", "pl": "אבירים", "mil": true, "hp": 170.0, "dmg": 19.0, "speed": 3.6, "spots": ["drill", "train", "guard"]},
	"warrior": {"name": "לוחם", "pl": "לוחמים", "mil": true, "hp": 115.0, "dmg": 14.0, "speed": 3.8, "spots": ["drill", "train", "gate", "guard"]},
	"archer": {"name": "קשת", "pl": "קשתים", "mil": true, "hp": 80.0, "dmg": 9.5, "speed": 3.8, "range": 28.0, "spots": ["archer", "gate", "train"]},
	"farmer": {"name": "חקלאי", "pl": "חקלאים", "spots": ["farm"]},
	"builder": {"name": "בנאי", "pl": "בנאים", "spots": ["build"]},
	"lumberjack": {"name": "חוטב עצים", "pl": "חוטבי עצים", "spots": ["chop"]},
	"smith": {"name": "נפח", "pl": "נפחים", "spots": ["smith"]},
	"merchant": {"name": "סוחר", "pl": "סוחרים", "spots": ["trade"]},
	"cook": {"name": "טבח", "pl": "טבחים", "spots": ["drink"]},
	"fisher": {"name": "דייג", "pl": "דייגים", "spots": ["fish"]},
	"sailor": {"name": "מלח", "pl": "מלחים", "spots": ["dock"]},
	"groom": {"name": "סייס", "pl": "סייסים", "spots": ["groom"]},
	"healer": {"name": "מרפא", "pl": "מרפאים", "spots": ["pray"]},
	"hunter": {"name": "צייד", "pl": "ציידים", "spots": ["hunt"]},
}
const MILITARY := ["knight", "warrior", "archer"]

# beasts of war: their body (scripts/people/animal_puppet.gd) and how they fight
const BEASTS := {
	"warwolf": {"name": "זאב מלחמה", "pl": "זאבי מלחמה", "model": "res://assets/nf/wolf.glb", "size": 1.25, "hp": 95.0, "dmg": 15.0, "speed": 8.0, "reach": 2.2,
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "attack": "Attack", "die": "Death"},
		"colors": {"Main": Color(0.24, 0.24, 0.26), "Main_Light": Color(0.5, 0.5, 0.52)}},
	"wardog": {"name": "כלב מלחמה", "pl": "כלבי מלחמה", "model": "res://assets/nf/husky.glb", "size": 1.05, "hp": 70.0, "dmg": 12.0, "speed": 8.5, "reach": 2.0,
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "attack": "Attack", "die": "Death"}},
	"raptor": {"name": "דורס", "pl": "דורסים", "model": "res://assets/nf/raptor.glb", "size": 1.45, "hp": 90.0, "dmg": 17.0, "speed": 9.0, "reach": 2.3,
		"anims": {"idle": "Velociraptor_Idle", "walk": "Velociraptor_Walk", "run": "Velociraptor_Run", "attack": "Velociraptor_Attack", "die": "Velociraptor_Death"}},
	"triceratops": {"name": "טריצרטופס", "pl": "טריצרטופסים", "model": "res://assets/nf/triceratops.glb", "size": 2.7, "hp": 480.0, "dmg": 32.0, "speed": 5.2, "reach": 3.6, "charge": true,
		"anims": {"idle": "Triceratops_Idle", "walk": "Triceratops_Walk", "run": "Triceratops_Run", "attack": "Triceratops_Attack", "die": "Triceratops_Death"}},
	"trex": {"name": "טירנוזאורוס", "pl": "טירנוזאורוסים", "model": "res://assets/nf/trex.glb", "size": 4.8, "hp": 1100.0, "dmg": 48.0, "speed": 6.0, "reach": 4.6, "charge": true,
		"anims": {"idle": "TRex_Idle", "walk": "TRex_Walk", "run": "TRex_Run", "attack": "TRex_Attack", "die": "TRex_Death"}},
}
const HORSE_COLORS := [["חום", Color(0.41, 0.27, 0.21), Color(0.13, 0.13, 0.13)], ["שחור", Color(0.12, 0.11, 0.11), Color(0.05, 0.05, 0.05)],
	["לבן", Color(0.86, 0.85, 0.82), Color(0.75, 0.74, 0.7)], ["אפור", Color(0.5, 0.5, 0.52), Color(0.25, 0.25, 0.26)],
	["ערמוני", Color(0.58, 0.3, 0.14), Color(0.35, 0.16, 0.07)], ["זהוב", Color(0.85, 0.66, 0.38), Color(0.95, 0.9, 0.78)]]

static func horse_def(color: int, blanket: Color) -> Dictionary:
	var c: Array = HORSE_COLORS[color % HORSE_COLORS.size()]
	return {"type": "animal", "model": "res://assets/animals/Horse.fbx", "size": 2.0, "saddle": blanket.a > 0.0, "blanket": blanket,
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Run", "attack": "Jump", "die": "Death"},
		"colors": {"Material.003": c[1], "Material.006": c[2]}}

static func beast_def(kind: String) -> Dictionary:
	var b: Dictionary = BEASTS[kind].duplicate()
	b["type"] = "animal"
	return b

# what a person of a role looks like in a faction's city; variant picks among a few looks
static func look_for(faction: String, role: String, variant: int) -> Dictionary:
	var team: Color = Skins.TEAM.get(faction, Color(0.5, 0.5, 0.5))
	var skins: Array = {"blue": [1, 3], "red": [0, 1], "green": [3, 4], "black": [2, 0]}.get(faction, [0, 2])
	var skin: int = skins[(variant / 3) % 2]
	var v := variant % 3
	match role:
		"knight":
			if faction == "red": return Skins.look("knight", {"helmet": true, "cape": true, "weapon": "sword" if v != 2 else "sword2", "shield": "shield_spike" if v != 2 else "", "cloth": team, "metal": "dark", "skin": skin})
			return Skins.look("knight", {"helmet": true, "cape": true, "weapon": "sword", "shield": "shield_badge", "cloth": team, "metal": "gold" if v == 2 else "", "skin": skin})
		"warrior":
			match faction:
				"green": return Skins.look(["barbarian", "rogue", "barbarian"][v], {"helmet": false, "weapon": ["axe2", "dagger", "axe"][v], "shield": "shield_round" if v == 2 else "", "cloth": team, "skin": skin})
				"black": return Skins.look(["rogue", "barbarian", "rogue"][v], {"helmet": v == 1, "cape": v != 1, "weapon": ["sword", "axe", "dagger"][v], "cloth": [team, Color(0.85, 0.7, 0.2), Color(0.6, 0.15, 0.15)][v], "metal": "dark", "skin": skin})
				"red": return Skins.look(["barbarian", "knight", "barbarian"][v], {"helmet": true, "cape": v == 1, "weapon": ["axe", "sword2", "axe2"][v], "shield": "shield_round" if v == 0 else "", "cloth": team, "metal": "dark", "skin": skin})
			return Skins.look(["barbarian", "knight", "barbarian"][v], {"helmet": true, "cape": v == 1, "weapon": ["axe", "sword2", "axe"][v], "shield": "shield_round" if v != 1 else "", "cloth": team, "skin": skin})
		"archer":
			return Skins.look(["hooded", "rogue", "hooded"][v], {"cape": true, "weapon": "crossbow", "cloth": team if v != 1 else team.darkened(0.25), "skin": skin})
		"farmer": return Skins.look(["barbarian", "rogue", "barbarian"][v], {"cloth": [Color(0.55, 0.45, 0.25), Color(0.4, 0.55, 0.3), Color(0.7, 0.6, 0.4)][v], "skin": skin})
		"builder": return Skins.look("barbarian", {"helmet": v == 0, "weapon": "axe", "cloth": [Color(0.6, 0.4, 0.2), Color(0.5, 0.5, 0.45), Color(0.45, 0.35, 0.25)][v], "skin": skin})
		"lumberjack": return Skins.look("barbarian", {"weapon": "axe2", "cloth": [Color(0.55, 0.2, 0.15), Color(0.3, 0.45, 0.25), Color(0.5, 0.3, 0.2)][v], "skin": skin})
		"smith": return Skins.look("barbarian", {"weapon": "axe", "cloth": Color(0.3, 0.28, 0.27), "metal": "dark", "skin": skin})
		"merchant": return Skins.look(["mage", "rogue", "mage"][v], {"cloth": [Color(0.55, 0.3, 0.7), Color(0.85, 0.65, 0.2), Color(0.25, 0.5, 0.6)][v], "weapon": "book" if v == 0 else "", "skin": skin})
		"cook": return Skins.look(["barbarian", "rogue", "barbarian"][v], {"weapon": "mug", "cloth": Color(0.9, 0.88, 0.82), "skin": skin})
		"fisher": return Skins.look(["rogue", "barbarian", "hooded"][v], {"cloth": [Color(0.2, 0.55, 0.6), Color(0.35, 0.45, 0.55), Color(0.25, 0.4, 0.5)][v], "skin": skin})
		"sailor": return Skins.look(["rogue", "barbarian", "rogue"][v], {"cape": v == 2, "weapon": "dagger" if v == 2 else "", "cloth": [Color(0.92, 0.92, 0.9), team, Color(0.2, 0.25, 0.45)][v], "skin": skin})
		"groom": return Skins.look(["rogue", "barbarian", "hooded"][v], {"cloth": [Color(0.5, 0.35, 0.2), Color(0.4, 0.3, 0.2), Color(0.45, 0.4, 0.3)][v], "skin": skin})
		"healer": return Skins.look("mage", {"helmet": v == 0, "weapon": "staff", "cloth": [Color(0.92, 0.92, 0.95), Color(0.85, 0.8, 0.6), team][v], "skin": skin})
		"hunter": return Skins.look(["hooded", "rogue", "hooded"][v], {"cape": true, "weapon": "crossbow", "cloth": [Color(0.3, 0.42, 0.22), Color(0.45, 0.35, 0.22), Color(0.25, 0.35, 0.2)][v], "skin": skin})
	return Skins.look("rogue", {"cloth": team, "skin": skin})

# the crowd's key for a look (registered there once)
static func look_key(faction: String, role: String, variant: int) -> String:
	return "%s_%s_%d" % [faction, role, variant % 6]

static func register_look(crowd: Crowd, faction: String, role: String, variant: int) -> String:
	var key := look_key(faction, role, variant)
	if not crowd.looks.has(key): crowd.register(key, {"type": "person", "look": look_for(faction, role, variant)})
	return key
