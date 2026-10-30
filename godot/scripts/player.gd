class_name Player
extends Node3D
# The chief: walks, runs, swims, rolls away, strikes with what he holds, eats what he hunted and drinks from the
# river. He boards boats (then the stick steers the boat), throws harpoons from the whaling ship, and rides horses
# (then the stick steers the horse). His body is an Avatar in the look he chose (scripts/people/skins.gd).
# Movement is kinematic on the height map (no physics); trunks and buildings push him aside, piers carry him.
signal died(cause: String)
signal said(text: String)

const HEIGHT := 1.8
const WALK := 3.4
const RUN := 6.8
const SWIM := 2.3
const GRAV := 22.0
const SWIM_DEPTH := 1.05     # deeper than this, he swims
const DEEP := 6.0            # deeper than this (the sea), swimming wears him out
const FOOD_DRAIN := 100.0 / (960.0 * 1.4)
const WATER_DRAIN := 100.0 / (960.0 * 0.9)

var hd := HeightData.new()
var game: Node
var avatar: Avatar
var look: Dictionary = {}

# input, set by the controls
var move_in := Vector2.ZERO      # x: right, y: forward (camera space), length up to 1
var want_run := false
var cam_yaw := 0.0

var hp := 100.0
var food := 85.0
var water := 85.0
var stam := 100.0
var vy := 0.0
var face := 0.0                  # the direction the body looks at (radians, 0 = +z)
var speed_now := 0.0
var swimming := false
var state := "move"              # move, attack, roll, act, hit, dead
var state_t := 0.0
var hit_done := false
var act_kind := ""
var act_target = null
var roll_dir := Vector3.ZERO
var hurt_cool := 0.0
var starve_said := 0.0
var boat: Boat = null            # the boat he is in
var horse: Horse = null          # the horse he rides
var harpoon_cool := 0.0
var deep_said := 0.0
var swing := 0

func _ready():
	if look.is_empty(): look = Skins.player_look(0)
	_make_body()

func _make_body():
	if avatar: avatar.queue_free()
	avatar = Avatar.new(); avatar.setup(look, HEIGHT); add_child(avatar)
	if horse: avatar.set_riding(true)

func set_look(l: Dictionary):
	look = l
	_make_body()

func place(p: Vector3):
	position = Vector3(p.x, hd.ground(p.x, p.z), p.z)

func _play(mv: String, blend := 0.18, spd := 1.0, restart := false):
	if avatar: avatar.play(mv, blend, spd, restart)

func forward() -> Vector3: return Vector3(sin(face), 0, cos(face))

func is_dead() -> bool: return state == "dead"

# ---------- actions ----------
func attack():
	if boat != null:
		if state != "move": return
		if boat.kind != "ship": said.emit("צדים לווייתנים מספינת הציד שבנמל"); return
		if harpoon_cool > 0.0: return
		harpoon_cool = 1.3
		state = "attack"; state_t = 0.0; hit_done = false
		_play("throw", 0.08, 1.2, true)
		return
	if state != "move" or swimming: return
	if stam < 8.0: said.emit("אין כוח. צריך לנוח רגע"); return
	stam -= 8.0
	state = "attack"; state_t = 0.0; hit_done = false
	swing += 1
	if horse: _play("attack", 0.08, 1.3, true)
	else: _play(avatar.attack_move(swing) if avatar else "attack", 0.08, 1.35, true)

func roll():
	if state != "move" or swimming or boat != null or horse != null or stam < 15.0: return
	stam -= 15.0
	state = "roll"; state_t = 0.0
	var d := _move_dir()
	roll_dir = d if d.length() > 0.1 else forward()
	face = atan2(roll_dir.x, roll_dir.z)
	_play("roll", 0.08, 1.25, true)

# whatever is close: eat, drink, board, ride, and the city's things (game.extra_action)
func act():
	if state != "move": return
	var what := action_here()
	if what.is_empty(): return
	act_kind = what.kind; act_target = what.get("target")
	if act_kind == "board": game.board(act_target); return
	if act_kind == "leave": game.leave_boat(); return
	if act_kind == "mount": mount(act_target); return
	if act_kind == "dismount": game.dismount(); return
	if act_kind in ["eat", "drink", "butcher"]:
		state = "act"; state_t = 0.0
		if act_target is Node3D and boat == null: face = atan2((act_target as Node3D).position.x - position.x, (act_target as Node3D).position.z - position.z)
		_play("interact", 0.15)
		return
	game.do_action(what)

# what can be done here: {kind, label, target}
func action_here() -> Dictionary:
	if state == "dead" or game == null: return {}
	var w: Node3D = game.dead_whale_near(boat.position if boat else position, boat.K.reach if boat else 3.0)
	if w and (boat != null or swimming): return {"kind": "butcher", "label": "לבתר", "target": w}
	var extra: Dictionary = game.extra_action(self)
	if not extra.is_empty() and extra.get("first", false): return extra
	if boat != null:
		if absf(boat.speed) < 1.6 and game.landing_spot() != Vector3.INF: return {"kind": "leave", "label": "לרדת"}
		return extra
	if horse != null:
		if not extra.is_empty(): return extra
		if horse.speed < 3.0: return {"kind": "dismount", "label": "לרדת מהסוס"}
		return {}
	var b: Boat = game.boat_near(position, 4.6)
	if b: return {"kind": "board", "label": "לעלות", "target": b}
	var hz: Horse = game.horse_near(position, 3.2)
	if hz: return {"kind": "mount", "label": "לרכוב", "target": hz}
	if not extra.is_empty(): return extra
	var c: Node3D = game.corpse_near(position, 2.6)
	if c and food < 99.0: return {"kind": "eat", "label": "לאכול", "target": c}
	if water < 99.0 and _fresh_water(position.z):
		var f := position + forward() * 1.4
		if hd.water_depth(position.x, position.z) > 0.05 or hd.water_depth(f.x, f.z) > 0.08: return {"kind": "drink", "label": "לשתות"}
	return {}

# rivers and lakes are fresh; the sea (and the river's mouth) is salt
static func _fresh_water(z: float) -> bool:
	return z < 395.0 or z > 1700.0

func hurt(dmg: float, cause: String, from := Vector3.INF):
	if state == "dead" or (state == "roll" and state_t < 0.45): return
	if look.get("helmet", false): dmg *= 0.85
	if look.get("shield", "") != "": dmg *= 0.85
	hp -= dmg
	if game and game.has_method("on_player_hurt"): game.on_player_hurt()
	if from != Vector3.INF and horse == null: position += (position - from).normalized() * 0.25
	if hp <= 0.0:
		hp = 0.0; state = "dead"; state_t = 0.0
		if horse: game.dismount()
		_play("die", 0.1)
		died.emit(cause)
		return
	if state == "move" or state == "act":
		state = "hit"; state_t = 0.0
		if horse == null: _play("hit", 0.06, 1.3, true)

# ---------- riding ----------
func mount(h: Horse):
	if h == null or h.rider != null: return
	horse = h; h.rider = self
	state = "move"; swimming = false
	if avatar: avatar.set_riding(true)
	face = h.yaw
	said.emit("על הסוס. המקל מוביל אותו, \"ריצה\" דוהר")

func unmount_body():
	if horse: horse.rider = null
	horse = null
	if avatar: avatar.set_riding(false)

# ---------- every frame ----------
func _move_dir() -> Vector3:
	var f := Vector3(sin(cam_yaw), 0, cos(cam_yaw))       # camera forward on the ground
	var r := Vector3(-f.z, 0, f.x)                        # the screen's right, on the ground
	var d := f * move_in.y + r * move_in.x
	return d.limit_length(1.0)

func _physics_process(dt: float):
	if dt > 0.1: dt = 0.1
	state_t += dt
	harpoon_cool -= dt
	if boat != null:
		_on_boat(dt); return
	if horse != null:
		_on_horse(dt); return
	var depth := maxf(0.0, WorldShape.WATER - hd.ground(position.x, position.z))
	swimming = depth > SWIM_DEPTH
	_needs(dt)
	if swimming and depth > DEEP and state != "dead":
		# out in the deep sea: swimming wears him out, and with no strength left he drowns
		stam = maxf(0.0, stam - 2.6 * dt)
		deep_said -= dt
		if deep_said <= 0.0:
			deep_said = 30.0; said.emit("המים כאן עמוקים: בלי סירה הכוח ייגמר")
		if stam <= 0.0: hp -= 7.0 * dt
		if hp <= 0.0: hp = 1.0; hurt(5.0, "טבעת בים")
	var d := _move_dir()
	var running := want_run and d.length() > 0.3 and stam > 1.0 and not swimming
	match state:
		"move":
			var sp := (SWIM if swimming else (RUN if running else WALK)) * d.length()
			if depth > 0.4 and not swimming: sp *= 0.7
			speed_now = move_toward(speed_now, sp, dt * 18.0)
			if d.length() > 0.05:
				var want := atan2(d.x, d.z)
				face = lerp_angle(face, want, minf(1.0, dt * 11.0))
				position += d.normalized() * speed_now * dt
			if swimming: _play("walk", 0.25, 0.7)
			elif speed_now > 4.6: _play("run", 0.18, speed_now / RUN * 1.0)
			elif speed_now > 0.3: _play("walk", 0.18, maxf(0.6, speed_now / WALK * 1.05))
			else: _play("idle", 0.25)
			if running: stam = maxf(0.0, stam - 9.0 * dt)
			else: stam = minf(100.0, stam + (6.0 if speed_now > 0.3 else 12.0) * dt)
		"attack":
			speed_now = 0.0
			if not hit_done and state_t > 0.32:
				hit_done = true
				if game and game.has_method("player_strike"): game.player_strike(position + Vector3.UP * 1.0, forward(), 2.8, _damage())
			if state_t > 0.75: state = "move"
		"roll":
			var k := 1.0 - smoothstep(0.35, 0.75, state_t)
			position += roll_dir * 7.5 * k * dt
			if state_t > 0.8: state = "move"
		"act":
			speed_now = 0.0
			if state_t > 2.0:
				_finish_act(); state = "move"
		"hit":
			if state_t > 0.45: state = "move"
		"dead":
			speed_now = 0.0
	# trunks, buildings and the ground
	position = hd.push_out(position, 0.35)
	position = hd.clamp_pos(position)
	var g := hd.ground(position.x, position.z)
	if swimming:
		vy = 0.0
		position.y = lerpf(position.y, WorldShape.WATER - 1.25, minf(1.0, dt * 5.0))
	else:
		vy -= GRAV * dt
		position.y += vy * dt
		if position.y <= g: position.y = g; vy = 0.0
	rotation.y = face

# how hard he hits: by what he holds
func _damage() -> float:
	var w: String = look.get("weapon", "")
	if w in ["sword2", "axe2"]: return 46.0
	if w in ["sword", "axe"]: return 38.0
	if w in ["crossbow", "crossbow2", "staff", "wand"]: return 30.0
	return 34.0

# on horseback: the stick steers the horse; he can strike from the saddle
func _on_horse(dt: float):
	swimming = false; vy = 0.0
	_needs(dt)
	var d := _move_dir()
	var fast := want_run and stam > 1.0
	if state == "dead": d = Vector3.ZERO
	horse.drive(d, fast, dt)
	speed_now = horse.speed
	stam = minf(100.0, stam + 5.0 * dt)
	match state:
		"attack":
			if not hit_done and state_t > 0.3:
				hit_done = true
				game.player_strike(position + Vector3.UP * 1.6, forward(), 3.4, _damage() * (1.0 + minf(1.0, horse.speed / 10.0) * 0.6))
			if state_t > 0.7: state = "move"
		"hit":
			if state_t > 0.45: state = "move"
		"move":
			_play("ride", 0.2)
	face = horse.yaw
	global_position = horse.saddle()
	rotation = Vector3(0, face, 0)

# on board: he stands where the boat keeps him; the stick steers the boat (scripts/boat.gd)
func _on_boat(dt: float):
	swimming = false; speed_now = 0.0; vy = 0.0
	_needs(dt)
	stam = minf(100.0, stam + (3.0 if want_run else 8.0) * dt)
	match state:
		"attack":
			if not hit_done and state_t > 0.3:
				hit_done = true
				var cf := Vector3(sin(cam_yaw), 0, cos(cam_yaw))
				game.throw_harpoon(global_position + Vector3.UP * 1.7, cf)
			if state_t > 0.7: state = "move"
		"act":
			if state_t > 2.4: _finish_act(); state = "move"
		"hit":
			if state_t > 0.45: state = "move"
		"move":
			_play("idle", 0.25)
	var st := boat.seat()
	global_position = st.origin
	face = boat.yaw if state != "attack" else cam_yaw
	rotation = Vector3(0, face, 0)

func _finish_act():
	if act_kind == "butcher":
		if is_instance_valid(act_target): game.butcher(act_target)
	elif act_kind == "drink":
		water = minf(100.0, water + 45.0); said.emit("שתית מהנהר")
	elif act_kind == "eat" and is_instance_valid(act_target) and act_target.has_method("take_meat"):
		var got: float = act_target.take_meat(40.0)
		food = minf(100.0, food + got); hp = minf(100.0, hp + got * 0.2)
		said.emit("אכלת בשר טרי")

func _needs(dt: float):
	if state == "dead": return
	var k := 1.6 if (want_run and speed_now > 4.0) else 1.0
	food = maxf(0.0, food - FOOD_DRAIN * k * dt)
	water = maxf(0.0, water - WATER_DRAIN * k * dt)
	if food <= 0.0 or water <= 0.0:
		hp -= 0.7 * dt
		starve_said -= dt
		if starve_said <= 0.0:
			starve_said = 25.0; said.emit("אתה גווע ברעב" if food <= 0.0 else "אתה צמא מאוד. חפש מים")
		if hp <= 0.0:
			hp = 1.0; hurt(5.0, "רעב" if food <= 0.0 else "צמא")
	elif food > 25.0 and water > 25.0 and hp < 100.0:
		hp = minf(100.0, hp + (1.2 if speed_now < 0.3 else 0.4) * dt)
