class_name Skins
# Everything a person can look like. A look is a base model (the KayKit adventurers, or the classic smoothed ones),
# what shows of its outfit (helmet, cape), what it holds (a weapon, a shield) and its colors (clothes, metal, skin).
# Colors are painted into a copy of the model's palette texture: each swatch of the palette is a soft vertical
# gradient of one color, so a swatch is recolored by keeping its shading and changing its color.
const KK := "res://assets/kaykit/chars/"
const GEAR_DIR := "res://assets/kaykit/gear/"

# own: the outfit pieces built into the model (they follow the bones); the rest are hidden
const BASES := {
	"knight": {"name": "אביר", "file": KK + "Knight.glb", "fam": "kk", "tex": "knight", "female": false,
		"acc": {"helmet": "Knight_Helmet", "cape": "Knight_Cape"},
		"own": {"sword": "1H_Sword", "sword2": "2H_Sword", "sword_off": "1H_Sword_Offhand", "shield_badge": "Badge_Shield",
			"shield_square": "Rectangle_Shield", "shield_round": "Round_Shield", "shield_spike": "Spike_Shield"}},
	"barbarian": {"name": "לוחם", "file": KK + "Barbarian.glb", "fam": "kk", "tex": "barbarian", "female": false,
		"acc": {"helmet": "Barbarian_Hat", "cape": "Barbarian_Cape"},
		"own": {"axe": "1H_Axe", "axe2": "2H_Axe", "axe_off": "1H_Axe_Offhand", "shield_round": "Barbarian_Round_Shield", "mug": "Mug"}},
	"mage": {"name": "חכם", "file": KK + "Mage.glb", "fam": "kk", "tex": "mage", "female": false,
		"acc": {"helmet": "Mage_Hat", "cape": "Mage_Cape"},
		"own": {"wand": "1H_Wand", "staff": "2H_Staff", "book": "Spellbook", "book_open": "Spellbook_open"}},
	"rogue": {"name": "סיירת", "file": KK + "Rogue.glb", "fam": "kk", "tex": "rogue", "female": true,
		"acc": {"cape": "Rogue_Cape"},
		"own": {"dagger": "Knife", "dagger_off": "Knife_Offhand", "crossbow": "1H_Crossbow", "crossbow2": "2H_Crossbow", "throwable": "Throwable"}},
	"hooded": {"name": "קשתית", "file": KK + "Rogue_Hooded.glb", "fam": "kk", "tex": "rogue", "female": true,
		"acc": {"cape": "Rogue_Cape"},
		"own": {"dagger": "Knife", "dagger_off": "Knife_Offhand", "crossbow": "1H_Crossbow", "crossbow2": "2H_Crossbow", "throwable": "Throwable"}},
	# the classic models of the earlier versions, with smooth shading now
	"adventurer": {"name": "הצייד", "file": "res://assets/nf/adventurer.glb", "fam": "q", "female": false, "acc": {}, "own": {}},
	"hooded_adv": {"name": "הנווד", "file": "res://assets/nf/hooded_adventurer.glb", "fam": "q", "female": false, "acc": {}, "own": {}},
	"elf": {"name": "השומר", "file": "res://assets/nf/rogue.glb", "fam": "q", "female": false, "acc": {}, "own": {}},
	"monarch": {"name": "המלך", "file": "res://assets/nf/monarch.glb", "fam": "q", "female": false, "acc": {}, "own": {}},
}

# held things from the gear folder, for bases that do not have them built in
const GEAR := {"sword": "sword_1handed", "sword2": "sword_2handed", "axe": "axe_1handed", "axe2": "axe_2handed",
	"crossbow": "crossbow_1handed", "crossbow2": "crossbow_2handed", "dagger": "dagger", "staff": "staff", "wand": "wand",
	"mug": "mug_full", "book": "spellbook_closed", "shield_round": "shield_round_color", "shield_square": "shield_square_color",
	"shield_spike": "shield_spikes_color", "shield_badge": "shield_badge_color"}
const TWO_HANDED := ["sword2", "axe2", "crossbow2", "staff"]

const SKIN_TONES := [Color(0.98, 0.78, 0.62), Color(0.9, 0.66, 0.48), Color(0.76, 0.52, 0.36), Color(0.55, 0.36, 0.24), Color(0.38, 0.25, 0.17)]
const SKIN_NAMES := ["בהיר", "חיטה", "שזוף", "שחום", "כהה"]
const METALS := {"": Color(0, 0, 0, 0), "gold": Color(0.96, 0.76, 0.32), "dark": Color(0.27, 0.29, 0.33), "bronze": Color(0.72, 0.47, 0.26)}

# colors a player can pick for clothes (name, color); a = 0 keeps the model's own
const CLOTHS := [["מקורי", Color(0, 0, 0, 0)], ["כחול", Color(0.2, 0.42, 0.85)], ["אדום", Color(0.8, 0.16, 0.14)], ["ירוק", Color(0.2, 0.6, 0.28)],
	["סגול", Color(0.5, 0.25, 0.75)], ["זהב", Color(0.95, 0.72, 0.2)], ["שחור", Color(0.16, 0.16, 0.19)], ["לבן", Color(0.93, 0.93, 0.9)],
	["כתום", Color(0.95, 0.5, 0.15)], ["טורקיז", Color(0.15, 0.68, 0.7)]]

# the factions' colors, for the people of each city
const TEAM := {"blue": Color(0.2, 0.42, 0.88), "red": Color(0.8, 0.15, 0.13), "green": Color(0.22, 0.58, 0.25), "yellow": Color(0.9, 0.7, 0.15), "black": Color(0.17, 0.17, 0.2)}

# ready-made looks for the player to pick from (all can be changed after)
const PLAYER_SKINS := [
	{"name": "אביר כחול", "base": "knight", "helmet": true, "cape": true, "weapon": "sword", "shield": "shield_badge", "cloth": 1, "metal": "", "skin": 0},
	{"name": "אביר הזהב", "base": "knight", "helmet": true, "cape": true, "weapon": "sword2", "shield": "", "cloth": 2, "metal": "gold", "skin": 1},
	{"name": "ראש שבט", "base": "barbarian", "helmet": true, "cape": true, "weapon": "axe", "shield": "shield_round", "cloth": 0, "metal": "", "skin": 2},
	{"name": "לוחם צפוני", "base": "barbarian", "helmet": false, "cape": true, "weapon": "axe2", "shield": "", "cloth": 6, "metal": "dark", "skin": 0},
	{"name": "הסיירת", "base": "rogue", "helmet": false, "cape": true, "weapon": "dagger", "shield": "", "cloth": 0, "metal": "", "skin": 1},
	{"name": "הקשתית", "base": "hooded", "helmet": false, "cape": true, "weapon": "crossbow", "shield": "", "cloth": 3, "metal": "", "skin": 3},
	{"name": "החכם", "base": "mage", "helmet": true, "cape": true, "weapon": "staff", "shield": "", "cloth": 4, "metal": "", "skin": 2},
	{"name": "אבירה בשחור", "base": "rogue", "helmet": false, "cape": true, "weapon": "sword", "shield": "shield_spike", "cloth": 6, "metal": "dark", "skin": 4},
	{"name": "הצייד הקלאסי", "base": "adventurer", "weapon": "spear"},
	{"name": "הנווד", "base": "hooded_adv", "weapon": "spear"},
	{"name": "השומר", "base": "elf", "weapon": "spear"},
	{"name": "המלך", "base": "monarch", "weapon": "spear"},
]

static func look(base: String, o := {}) -> Dictionary:
	var l := {"base": base, "helmet": false, "cape": false, "weapon": "", "shield": "", "cloth": Color(0, 0, 0, 0), "metal": "", "skin": 0}
	for k in o: l[k] = o[k]
	return l

# a player skin (from PLAYER_SKINS, with cloth as an index) as a look
static func player_look(i: int, over := {}) -> Dictionary:
	var p: Dictionary = PLAYER_SKINS[clampi(i, 0, PLAYER_SKINS.size() - 1)].duplicate()
	for k in over: p[k] = over[k]
	var l := look(p.base, p)
	l.cloth = CLOTHS[int(p.get("cloth", 0))][1] if p.get("cloth", 0) is int else p.cloth
	return l

static func is_kk(base: String) -> bool: return BASES.get(base, {}).get("fam", "") == "kk"

# ---------------------------------------------------------------- the palette, recolored
static var _src := {}      # tex name -> Image (RGBA8)
static var _tex := {}      # key -> ImageTexture
static var _mat := {}      # key -> Material
static var _kinds := {}    # tex name -> PackedStringArray of swatch kinds

static func _src_image(tex: String) -> Image:
	if _src.has(tex): return _src[tex]
	var img: Image
	var t = load(GEAR_DIR + tex + "_texture.png")
	if t is Texture2D: img = (t as Texture2D).get_image()
	if img == null: img = Image.create(256, 256, false, Image.FORMAT_RGBA8); img.fill(Color(0.8, 0.8, 0.8))
	if img.is_compressed(): img.decompress()
	img.convert(Image.FORMAT_RGBA8)
	if img.get_width() > 256: img.resize(256, 256, Image.INTERPOLATE_BILINEAR)
	_src[tex] = img
	return img

# what each swatch of a palette is: skin, cloth, metal, leather, gold, or keep (the palette is 8 columns by 4 rows).
# The skin of every KayKit palette is the same peach color, so skin is found by that color alone.
static func _swatch_kinds(tex: String) -> PackedStringArray:
	if _kinds.has(tex): return _kinds[tex]
	var img := _src_image(tex)
	var w := img.get_width(); var h := img.get_height()
	var out := PackedStringArray()
	for row in 4:
		for col in 8:
			var c := img.get_pixel(int((col + 0.5) * w / 8.0), int((row + 0.5) * h / 4.0))
			var k := "keep"
			var hue := c.h; var sat := c.s; var val := c.v
			if absf(hue - 0.07) < 0.012 and absf(sat - 0.37) < 0.04 and val > 0.92: k = "skin"
			elif sat < 0.13 and val > 0.22 and val < 0.93: k = "metal"
			elif hue > 0.09 and hue < 0.18 and sat > 0.5 and val > 0.75: k = "gold"
			elif hue >= 0.0 and hue < 0.11 and sat > 0.35 and val < 0.8: k = "leather"
			elif sat > 0.35: k = "cloth"
			out.append(k)
	_kinds[tex] = out
	return out

static func _ckey(c: Color) -> String: return "%.2f,%.2f,%.2f,%.1f" % [c.r, c.g, c.b, c.a]

static func texture_for(tex: String, cloth: Color, metal: String, skin: int) -> Texture2D:
	var key := "%s|%s|%s|%d" % [tex, _ckey(cloth), metal, skin]
	if _tex.has(key): return _tex[key]
	var src := _src_image(tex)
	var img: Image = src.duplicate()
	var kinds := _swatch_kinds(tex)
	var w := img.get_width(); var h := img.get_height()
	var mc: Color = METALS.get(metal, Color(0, 0, 0, 0))
	var sk: Color = SKIN_TONES[clampi(skin, 0, SKIN_TONES.size() - 1)]
	# clothes turn by the hue, saturation and brightness that take the palette's main cloth color to the wanted one,
	# so trims and second colors stay apart from it
	var main := Color(0, 0, 0, 0)
	for i in kinds.size():
		if kinds[i] == "cloth": main = src.get_pixel(int(((i % 8) + 0.5) * w / 8.0), int(((i / 8) + 0.5) * h / 4.0)); break
	for row in 4:
		for col in 8:
			var kind := kinds[row * 8 + col]
			var to := Color(0, 0, 0, 0)
			var hsv := false
			if kind == "cloth" and cloth.a > 0.0 and main.a > 0.0: hsv = true
			elif kind == "metal" and mc.a > 0.0: to = mc
			elif kind == "skin": to = sk
			if to.a == 0.0 and not hsv: continue
			var x0 := int(col * w / 8.0); var x1 := int((col + 1) * w / 8.0)
			var y0 := int(row * h / 4.0); var y1 := int((row + 1) * h / 4.0)
			var mid := src.get_pixel((x0 + x1) / 2, (y0 + y1) / 2)
			var ml := maxf(0.05, mid.get_luminance())
			var dh := cloth.h - main.h
			var ks := cloth.s / maxf(0.05, main.s)
			var kv := cloth.v / maxf(0.05, main.v)
			for y in range(y0, y1):
				for x in range(x0, x1):
					var p := src.get_pixel(x, y)
					if hsv:
						img.set_pixel(x, y, Color.from_hsv(fposmod(p.h + dh, 1.0), clampf(p.s * ks, 0.0, 1.0), clampf(p.v * kv, 0.0, 1.0)))
					else:
						var g := clampf(p.get_luminance() / ml, 0.0, 1.8)
						img.set_pixel(x, y, Color(minf(1.0, to.r * g), minf(1.0, to.g * g), minf(1.0, to.b * g), 1.0))
	img.generate_mipmaps()
	var t := ImageTexture.create_from_image(img)
	_tex[key] = t
	return t

static func material_for(tex: String, cloth: Color, metal: String, skin: int) -> Material:
	var key := "%s|%s|%s|%d" % [tex, _ckey(cloth), metal, skin]
	if _mat.has(key): return _mat[key]
	var m := StandardMaterial3D.new()
	m.albedo_texture = texture_for(tex, cloth, metal, skin)
	m.roughness = 0.62; m.metallic = 0.0; m.metallic_specular = 0.35
	m.rim_enabled = true; m.rim = 0.18; m.rim_tint = 0.6
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_mat[key] = m
	return m

# ---------------------------------------------------------------- the classic models, smoothed
static var _smooth := {}   # mesh -> smoothed mesh

static func smooth_mesh(src: Mesh) -> Mesh:
	if src == null: return src
	if _smooth.has(src): return _smooth[src]
	var am := ArrayMesh.new()
	for s in src.get_surface_count():
		var st := SurfaceTool.new()
		st.create_from(src, s)
		if src.surface_get_format(s) & Mesh.ARRAY_FLAG_USE_8_BONE_WEIGHTS: st.set_skin_weight_count(SurfaceTool.SKIN_8_WEIGHTS)
		st.generate_normals()
		st.commit(am)
		am.surface_set_material(am.get_surface_count() - 1, src.surface_get_material(s))
	_smooth[src] = am
	return am

static func smooth_model(root: Node) -> void:
	for m in root.find_children("*", "MeshInstance3D", true, false):
		var mi := m as MeshInstance3D
		mi.mesh = smooth_mesh(mi.mesh)
