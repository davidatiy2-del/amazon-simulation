class_name Council
extends Control
# The chief's screens: the war council (only the chief decides on a war: which city, how many of each kind of
# soldier, which beasts, and what for), the city's state (its people by role, horses, beasts, gold, food, and
# buying horses or training recruits), and the choice after a victory (take the city, plunder it, or make it pay).
signal closed
const GOLD := Color(0.98, 0.82, 0.45)
var war: War
var panel: PanelContainer
var body: VBoxContainer
var mode := ""
var pick := ""                 # the target city
var want := {"knight": 0, "warrior": 0, "archer": 0}
var want_beasts := {}
var goal := "conquer"

func _ready():
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	visible = false
	var bg := ColorRect.new(); bg.color = Color(0.02, 0.03, 0.02, 0.72); bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT); add_child(bg)
	var cc := CenterContainer.new(); cc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT); add_child(cc)
	panel = PanelContainer.new()
	var sb := StyleBoxFlat.new(); sb.bg_color = Color(0.1, 0.09, 0.07, 0.96); sb.set_corner_radius_all(18); sb.border_color = Color(0.85, 0.65, 0.3, 0.6); sb.set_border_width_all(2)
	sb.content_margin_left = 22; sb.content_margin_right = 22; sb.content_margin_top = 16; sb.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", sb)
	panel.custom_minimum_size = Vector2(980, 560)
	cc.add_child(panel)
	var sc := ScrollContainer.new(); sc.custom_minimum_size = Vector2(940, 540); sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(sc)
	body = VBoxContainer.new(); body.add_theme_constant_override("separation", 10); body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(body)

func _label(t: String, fs := 20, col := Color(1, 1, 1)) -> Label:
	var l := Label.new(); l.text = t; l.add_theme_font_size_override("font_size", fs); l.add_theme_color_override("font_color", col)
	l.text_direction = Control.TEXT_DIRECTION_RTL; l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	return l

func _button(t: String, primary := false, w := 200.0, h := 54.0) -> Button:
	var b := Button.new(); b.text = t; b.add_theme_font_size_override("font_size", 21)
	b.custom_minimum_size = Vector2(w, h)
	var sb := StyleBoxFlat.new(); sb.bg_color = Color(0.85, 0.62, 0.22) if primary else Color(1, 1, 1, 0.1)
	sb.set_corner_radius_all(12); sb.border_color = Color(1, 1, 1, 0.25); sb.set_border_width_all(0 if primary else 2)
	var sh := sb.duplicate(); sh.bg_color = sb.bg_color.lightened(0.15)
	b.add_theme_stylebox_override("normal", sb); b.add_theme_stylebox_override("hover", sh); b.add_theme_stylebox_override("pressed", sh); b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	var fc := Color(0.12, 0.08, 0.02) if primary else Color(1, 1, 1)
	for k in ["font_color", "font_hover_color", "font_pressed_color"]: b.add_theme_color_override(k, fc)
	return b

func _row() -> HBoxContainer:
	var r := HBoxContainer.new(); r.add_theme_constant_override("separation", 10); r.alignment = BoxContainer.ALIGNMENT_END
	return r

func _clear():
	for c in body.get_children(): c.queue_free()

func close():
	visible = false; mode = ""
	closed.emit()

# ---------------------------------------------------------------- the war council
func open_council(w: War):
	war = w; mode = "council"; visible = true
	if war.busy():
		_clear()
		body.add_child(_label("מועצת המלחמה", 38, GOLD))
		body.add_child(_label("הצבא כבר במלחמה. רק אחרי שישוב הביתה אפשר לצאת למלחמה חדשה.", 22))
		var r := _row(); var b := _button("סגור", true); b.pressed.connect(close); r.add_child(b); body.add_child(r)
		return
	if pick == "" or not war.cities.has(pick) or war.cities[pick].is_mine():
		pick = ""
		for id in war.targets():
			if not war.cities[id].is_mine(): pick = id; break
	var h: City = war.home()
	var c := h.counts()
	want = {"knight": mini(20, mini(int(c.get("knight", 0)), h.horses_here())), "warrior": mini(40, int(c.get("warrior", 0))), "archer": mini(20, int(c.get("archer", 0)))}
	want_beasts = {}
	_draw_council()

func _draw_council():
	_clear()
	var h: City = war.home()
	var c := h.counts()
	body.add_child(_label("מועצת המלחמה", 38, GOLD))
	body.add_child(_label("רק ראש השבט מחליט על כיבוש. בחר עיר, צבא ומטרה.", 19, Color(1, 1, 1, 0.75)))
	var top := _row()
	body.add_child(top)
	# the cities
	var cards := _row()
	for id in war.targets():
		var city: City = war.cities[id]
		var e := war.estimate(id)
		var mine := city.is_mine()
		var fname: String = Kingdoms.FACTIONS.get(city.owner_f, {}).get("name", "")
		var txt := "%s\n%s\n%s" % [city.name_he(), "שלך" if mine else ("" if fname == city.name_he() else fname),
			"" if mine else ("%d לוחמים%s · %d זהב%s" % [int(e.soldiers), _beast_line(e.beasts), int(e.gold), " · חומות" if e.walls else ""])]
		if war.tribute.has(id): txt += "\nמשלמת לך מס"
		var b := _button(txt, id == pick, 290, 96)
		b.add_theme_font_size_override("font_size", 17)
		b.disabled = mine
		b.pressed.connect(func(): pick = id; _draw_council())
		cards.add_child(b)
	body.add_child(cards)
	if pick == "":
		body.add_child(_label("כל הערים כבר שלך! אמזוניה שולטת בים.", 24, GOLD))
		var r0 := _row(); var b0 := _button("סגור", true); b0.pressed.connect(close); r0.add_child(b0); body.add_child(r0)
		return
	# the army: steppers for each kind
	body.add_child(_label("הצבא", 26, GOLD))
	var room := war.fleet_room()
	for role in ["knight", "warrior", "archer"]:
		var have := int(c.get(role, 0))
		var cap := have
		if role == "knight": cap = mini(have, h.horses_here())
		body.add_child(_stepper(Kingdoms.ROLES[role].pl, want, role, cap, "יש %d%s" % [have, (" · סוסים באורווה: %d" % h.horses_here()) if role == "knight" else ""]))
	var ob := war.our_beasts()
	for k in ob:
		if not want_beasts.has(k): want_beasts[k] = 0
		body.add_child(_stepper(Kingdoms.BEASTS[k].pl, want_beasts, k, int(ob[k]), "יש %d" % int(ob[k])))
	var total := 0
	for r in want: total += int(want[r])
	for k in want_beasts: total += int(want_beasts[k])
	var ships_need := 0; var left := total; var hl := int(want.knight)
	for b in war.fleet:
		if b.is_sunk(): continue
		if left <= 0 and hl <= 0: break
		ships_need += 1; left -= b.capacity(); hl -= b.horse_room()
	var ok := left <= 0 and hl <= 0 and total > 0
	var info := "%d לוחמים, %d סוסים · הצי: %d ספינות (%d מקומות, %d לסוסים)" % [total, int(want.knight), room.ships, room.men, room.horses]
	body.add_child(_label(info, 19, Color(0.8, 0.95, 1.0) if ok else Color(1, 0.6, 0.5)))
	# the goal
	body.add_child(_label("מטרה", 26, GOLD))
	var gr := _row()
	for g in [["conquer", "לכבוש ולספח"], ["plunder", "לבזוז"], ["tribute", "לדרוש מס"]]:
		var b := _button(g[1], goal == g[0], 200, 52)
		b.pressed.connect(func(): goal = g[0]; _draw_council())
		gr.add_child(b)
	body.add_child(gr)
	var desc: String = {"conquer": "העיר תהיה שלך: התושבים, הזהב וחיות המלחמה שלה.", "plunder": "לקחת את הזהב, הסוסים וחיות המלחמה, ולחזור הביתה.", "tribute": "העיר תישאר שלהם, ותשלם לך מס כל יום."}[goal]
	body.add_child(_label(desc + " (אחרי הניצחון אפשר לבחור אחרת)", 17, Color(1, 1, 1, 0.7)))
	var go := _button("לצאת למלחמה!", true, 260, 56)
	go.disabled = not ok
	go.pressed.connect(func():
		if war.begin(pick, want.duplicate(), want_beasts.duplicate(), goal): close())
	var cancel := _button("ביטול", false, 160, 56); cancel.pressed.connect(close)
	top.add_child(cancel); top.add_child(go)

func _beast_line(b: Dictionary) -> String:
	var s := ""
	for k in b: s += " · %d %s" % [int(b[k]), Kingdoms.BEASTS[k].pl]
	return s

func _stepper(title: String, dict: Dictionary, key: String, cap: int, note: String) -> HBoxContainer:
	var r := _row()
	var lab := _label("%s: %d" % [title, int(dict.get(key, 0))], 22)
	lab.custom_minimum_size = Vector2(220, 0)
	var n := _label(note, 16, Color(1, 1, 1, 0.6)); n.custom_minimum_size = Vector2(260, 0)
	for step in [[-10, "−10"], [-1, "−"], [1, "+"], [10, "+10"]]:
		var b := _button(step[1], false, 64, 48)
		b.pressed.connect(func():
			dict[key] = clampi(int(dict.get(key, 0)) + int(step[0]), 0, cap)
			_draw_council())
		r.add_child(b)
	r.add_child(n); r.add_child(lab)
	return r

# ---------------------------------------------------------------- the city
func open_city(city: City, w: War):
	war = w; mode = "city"; visible = true
	_draw_city(city)

func _draw_city(city: City):
	_clear()
	body.add_child(_label(city.name_he(), 38, GOLD))
	var c := city.counts()
	body.add_child(_label("%d תושבים · %d זהב · %d מזון · %d סוסים באורווה" % [city.population(), int(city.gold), int(city.food), city.horses_here()], 22, Color(0.85, 0.95, 1.0)))
	var mil := ""
	for r in Kingdoms.MILITARY: mil += "%d %s · " % [int(c.get(r, 0)), Kingdoms.ROLES[r].pl]
	body.add_child(_label("הצבא: " + mil.trim_suffix(" · "), 21))
	var civ := ""
	for r in Kingdoms.ROLES:
		if r in Kingdoms.MILITARY or int(c.get(r, 0)) == 0: continue
		civ += "%d %s · " % [int(c.get(r, 0)), Kingdoms.ROLES[r].pl]
	body.add_child(_label("בעלי תפקידים: " + civ.trim_suffix(" · "), 19, Color(1, 1, 1, 0.85)))
	var b := city.beasts_here()
	if b.size() > 0: body.add_child(_label("חיות מלחמה:" + _beast_line(b).replace(" · ", " ", ), 19, Color(1, 0.85, 0.6)))
	var others := ""
	for id in war.cities:
		var oc: City = war.cities[id]
		if id == city.id: continue
		var st := "שלך" if oc.is_mine() else ("משלמת מס" if war.tribute.has(id) else "אויב")
		others += "%s: %s · " % [oc.name_he(), st]
	body.add_child(_label(others.trim_suffix(" · "), 17, Color(1, 1, 1, 0.6)))
	if city.is_mine():
		body.add_child(_label("פעולות", 26, GOLD))
		var r := _row()
		var hb := _button("לקנות 4 סוסים (120 זהב)", false, 300, 56)
		hb.disabled = city.gold < 120.0 or city.data.get("stable", {}).is_empty()
		hb.pressed.connect(func(): city.gold -= 120.0; city.add_horses(4); _draw_city(city))
		var rb := _button("לאמן 10 טירונים (100 זהב)", false, 300, 56)
		var civs := 0
		for p in city.people: if not (p.role in Kingdoms.MILITARY) and p.state != "away": civs += 1
		rb.disabled = city.gold < 100.0 or civs < 40
		rb.pressed.connect(func():
			city.gold -= 100.0
			var n := 0
			for p in city.people:
				if n >= 10: break
				if p.role in ["hunter", "lumberjack", "builder", "fisher", "farmer"] and p.state != "away":
					p.role = "warrior"; p.key = Kingdoms.register_look(city.crowd, city.owner_f, "warrior", p.id); p.home = -1; n += 1
			_draw_city(city))
		var kb := _button("לקדם 5 לוחמים לאבירים (150 זהב)", false, 340, 56)
		kb.disabled = city.gold < 150.0 or city.count("warrior") < 5 or city.horses_here() < city.count("knight") + 5
		kb.pressed.connect(func():
			city.gold -= 150.0
			var n := 0
			for p in city.people:
				if n >= 5: break
				if p.role == "warrior" and p.state != "away":
					p.role = "knight"; p.key = Kingdoms.register_look(city.crowd, city.owner_f, "knight", p.id); n += 1
			_draw_city(city))
		r.add_child(kb); r.add_child(rb); r.add_child(hb)
		body.add_child(r)
		body.add_child(_label("טירונים באים מהחקלאים, הציידים, הדייגים והבנאים. אביר צריך סוס באורווה.", 16, Color(1, 1, 1, 0.6)))
	var r2 := _row(); var cb := _button("סגור", true); cb.pressed.connect(close); r2.add_child(cb); body.add_child(r2)

# ---------------------------------------------------------------- after a victory
func open_victory(w: War):
	war = w; mode = "victory"; visible = true
	_clear()
	var tc := war.target_city()
	body.add_child(_label("ניצחון!", 46, GOLD))
	body.add_child(_label("%s נפלה לידיך. %d מהאויב נפלו בקרב. מה תעשה בעיר?" % [tc.name_he(), war.killed], 23))
	var fell := 0
	for k in war.lost: fell += int(war.lost[k])
	if fell > 0: body.add_child(_label("מאנשינו נפלו %d" % fell, 19, Color(1, 0.7, 0.6)))
	var r := _row()
	for g in [["annex", "לספח לממלכה", "העיר, אנשיה, חצי מהזהב וחיות המלחמה שלה — שלך"], ["plunder", "לבזוז ולחזור", "כמעט כל הזהב, סוסים וחיות מלחמה הביתה"], ["tribute", "להטיל מס", "העיר נשארת שלהם ומשלמת לך כל יום"]]:
		var b := _button("%s\n%s" % [g[1], g[2]], g[0] == war.goal, 300, 110)
		b.pressed.connect(func(): if war.sound: war.sound.play("coin"))
		b.add_theme_font_size_override("font_size", 15)
		b.pressed.connect(func(): war.decide(g[0]); close())
		r.add_child(b)
	body.add_child(r)
	body.add_child(_label("אחר כך: פקודה \"לספינות\", עלה על ספינה, והצי יפליג הביתה איתך.", 17, Color(1, 1, 1, 0.65)))
