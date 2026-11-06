class_name Player
extends CharacterBody3D
# The chief, as a physics body (CharacterBody3D on Jolt, against scripts/world/world_collision.gd): he walks and runs on
# the ground and on the piers, goes up gentle slopes, steps up onto low ledges, is stopped by walls, buildings and
# trunks, swims in deep water and climbs out onto the shore. He strikes with what he holds, rolls away, eats what he
# hunted and drinks from the river. He boards boats (then the stick steers the boat), throws harpoons from the whaling
# ship, and rides horses (then the stick steers the horse). His body is an Avatar in the look he chose.
#
# The physics runs at fixed ticks; his body (the Avatar) is drawn between the last two ticks every frame, so he moves
# smoothly whatever the screen's frame rate (scripts/world/smooth.gd).
signal died(cause: String)
signal said(text: String)

const HEIGHT := 1.8
const RADIUS := 0.32
const WALK := 3.4
const RUN := 6.8
const SWIM := 2.3
const GRAV := 22.0
const ACCEL := 36.0          # m/s²: how fast he reaches the speed the stick asks for
const STEP := 0.55           # the highest ledge he steps up onto
const CLIMB := 1.6           # from the water: the highest bank he climbs onto
const SWIM_DEPTH := 1.05     # deeper than this, he swims
const SWIM_FEET := -1.25     # his feet while swimming, below the surface
const DEEP := 6.0            # deeper than this (the sea), swimming wears him out
const FOOD_DRAIN := 100.0 / (960.0 * 1.4)
const WATER_DRAIN := 100.0 / (960.0 * 0.9)

var hd := HeightData.new()
var game: Node
var avatar: Avatar
var look: Dictionary = {}
var shape: CollisionShape3D

# input, set by the controls
var move_in := Vector2.ZERO      # x: right, y: forward (camera space), length up to 1
var want_run := false
var cam_yaw := 0.0

var hp := 100.0
var food := 85.0
var water := 85.0
var stam := 100.0
var vy: float:                   # (the vertical speed: kept for the code that sets it)
	get: return velocity.y
	set(v): velocity.y = v
var face := 0.0                  # the direction the body looks at (radians, 0 = +z)
var speed_now := 0.0             # how fast he really moves (after walls and slopes)
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
var _push_t := 0.0               # how long the stick has pushed without him getting anywhere
var _push_from := Vector3.ZERO
var smooth := Smooth.new()       # draws the Avatar between physics ticks

func _ready():
	collision_layer = WorldCollision.L_PLAYER
	collision_mask = WorldCollision.SOLID
	shape = CollisionShape3D.new()
	var cap := CapsuleShape3D.new(); cap.radius = RADIUS; cap.height = 1.72
	shape.shape = cap; shape.position.y = 0.88
	add_child(shape)
	floor_snap_length = 0.45
	floor_max_angle = deg_to_rad(50.0)
	floor_constant_speed = true
	floor_block_on_wall = true
	max_slides = 5
	safe_margin = 0.02
	if look.is_empty(): look = Skins.player_look(0)
	_make_body()

func _make_body():
	if avatar: avatar.queue_free()
	avatar = Avatar.new(); avatar.setup(look, HEIGHT); add_child(avatar)
	avatar.top_level = true          # (placed every frame by the smoothing, between physics ticks)
	smooth.snap(self, avatar)
	if horse: avatar.set_riding(true)

func _process(_dt: float):
	smooth.draw(avatar)

# where he is drawn now (between ticks): what the camera follows
func visual_position() -> Vector3: return avatar.global_position if avatar else global_position

func set_look(l: Dictionary):
	look = l
	_make_body()

# puts him at (x, z) on whatever is there to stand on, out of anything solid
func place(p: Vector3):
	velocity = Vector3.ZERO
	global_position = Vector3(p.x, hd.ground(p.x, p.z) + 0.03, p.z)
	unstick()
	smooth.snap(self, avatar)

# puts him exactly at p (a pier's planks, a beach chosen by the game)
func put(p: Vector3):
	velocity = Vector3.ZERO
	global_position = p + Vector3.UP * 0.03
	unstick()
	smooth.snap(self, avatar)

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
	if state != "move": return
	if swimming: said.emit("במים אי אפשר להילחם"); return
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
		if act_target is Node3D and boat == null: face = atan2((act_target as Node3D).global_position.x - global_position.x, (act_target as Node3D).global_position.z - global_position.z)
		_play("interact", 0.15)
		return
	game.do_action(what)

# what can be done here: {kind, label, target}
func action_here() -> Dictionary:
	if state == "dead" or game == null: return {}
	var w: Node3D = game.dead_whale_near(boat.position if boat else global_position, boat.K.reach if boat else 3.0)
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
	var b: Boat = game.boat_near(global_position, 4.6)
	if b: return {"kind": "board", "label": "לעלות", "target": b}
	var hz: Horse = game.horse_near(global_position, 3.2)
	if hz: return {"kind": "mount", "label": "לרכוב", "target": hz}
	if not extra.is_empty(): return extra
	var c: Node3D = game.corpse_near(global_position, 2.6)
	if c and food < 99.0: return {"kind": "eat", "label": "לאכול", "target": c}
	if water < 99.0 and _fresh_water(global_position.z):
		var f := global_position + forward() * 1.4
		if hd.water_depth(global_position.x, global_position.z) > 0.05 or hd.water_depth(f.x, f.z) > 0.08: return {"kind": "drink", "label": "לשתות"}
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
	if from != Vector3.INF and horse == null and boat == null:
		var away := global_position - from; away.y = 0.0
		if away.length() > 0.01: velocity += away.normalized() * 3.5
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
	velocity = Vector3.ZERO
	if avatar: avatar.set_riding(true)
	face = h.yaw
	said.emit("על הסוס. המקל מוביל אותו, \"ריצה\" דוהר")

func unmount_body():
	if horse: horse.rider = null
	horse = null
	if avatar: avatar.set_riding(false)

# ---------- every tick ----------
func _move_dir() -> Vector3:
	var f := Vector3(sin(cam_yaw), 0, cos(cam_yaw))       # camera forward on the ground
	var r := Vector3(-f.z, 0, f.x)                        # the screen's right, on the ground
	var d := f * move_in.y + r * move_in.x
	return d.limit_length(1.0)

# his body takes part in the physics only when he is on his own feet
func _solid(on: bool):
	if shape and shape.disabled == on: shape.set_deferred("disabled", not on)

func _physics_process(dt: float):
	if dt > 0.1: dt = 0.1
	state_t += dt
	harpoon_cool -= dt
	if boat != null:
		_solid(false); _on_boat(dt); smooth.tick(self); return
	if horse != null:
		_solid(false); _on_horse(dt); smooth.tick(self); return
	_solid(true)
	var p := global_position
	var floor_y := hd.height(p.x, p.z)
	var depth := maxf(0.0, WorldShape.WATER - floor_y)
	# in the water when the bottom is deep and he is not up on the planks of a pier
	swimming = depth > SWIM_DEPTH and p.y < WorldShape.WATER - 0.3
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
	var want := Vector3.ZERO
	match state:
		"move":
			var sp := (SWIM if swimming else (RUN if running else WALK)) * d.length()
			if depth > 0.4 and not swimming and p.y < WorldShape.WATER: sp *= 0.7   # wading
			if d.length() > 0.05:
				face = lerp_angle(face, atan2(d.x, d.z), minf(1.0, dt * 11.0))
				want = d.normalized() * sp
			if running: stam = maxf(0.0, stam - 9.0 * dt)
			else: stam = minf(100.0, stam + (6.0 if speed_now > 0.3 else 12.0) * dt)
		"attack":
			if not hit_done and state_t > 0.32:
				hit_done = true
				if game and game.has_method("player_strike"): game.player_strike(global_position + Vector3.UP * 1.0, forward(), 2.8, _damage())
			if state_t > 0.75: state = "move"
		"roll":
			want = roll_dir * 7.5 * (1.0 - smoothstep(0.35, 0.75, state_t))
			if state_t > 0.8: state = "move"
		"act":
			if state_t > 2.0:
				_finish_act(); state = "move"
		"hit":
			if state_t > 0.45: state = "move"
	# the speed on the ground: toward what the stick asks for (slower to change in the water)
	var hv := Vector3(velocity.x, 0, velocity.z).move_toward(want, ACCEL * dt * (0.35 if swimming else 1.0))
	velocity.x = hv.x; velocity.z = hv.z
	if swimming:
		var target_y := WorldShape.WATER + SWIM_FEET + sin(state_t * 2.2) * 0.04
		velocity.y = clampf((target_y - p.y) * 5.0, -4.0, 3.0)
	elif is_on_floor():
		velocity.y = 0.0
	else:
		velocity.y -= GRAV * dt
	if hv.length() > 0.2 and (is_on_floor() or swimming): _step_up(hv * dt)
	move_and_slide()
	_keep_in_world()
	var moved := global_position - p; moved.y = 0.0
	speed_now = moved.length() / dt if dt > 0.0 else 0.0
	_anim(running)
	_watch_stuck(want, dt)
	rotation = Vector3(0, face, 0)
	smooth.tick(self)

func _anim(running: bool):
	match state:
		"move":
			if swimming: _play("walk", 0.25, 0.7)
			elif speed_now > 4.6: _play("run", 0.18, speed_now / RUN)
			elif speed_now > 0.35: _play("walk", 0.18, maxf(0.6, speed_now / WALK * 1.05))
			else: _play("idle", 0.25)

# a low ledge ahead (a pier's edge, a step, a bank out of the water): up onto it
func _step_up(motion: Vector3) -> void:
	var t := global_transform
	var col := KinematicCollision3D.new()
	if not test_move(t, motion, col, safe_margin): return
	if col.get_normal().y > 0.7: return                 # only a slope: walking deals with it
	var up := Vector3.UP * (CLIMB if swimming else STEP)
	if test_move(t, up, null, safe_margin): return      # no room above
	var t2 := t.translated(up)
	var ahead := motion.normalized() * maxf(motion.length(), RADIUS * 0.7)
	if test_move(t2, ahead, null, safe_margin): return  # still in the way up there
	t2 = t2.translated(ahead)
	var down := KinematicCollision3D.new()
	if not test_move(t2, -up * 1.1, down, safe_margin): return   # nothing to stand on
	if down.get_normal().y < 0.7: return
	t2 = t2.translated(down.get_travel())
	global_transform = t2
	velocity.y = 0.0
	swimming = false

func _keep_in_world():
	var p := global_position
	var c := hd.clamp_pos(p)
	if c.x != p.x or c.z != p.z: global_position = Vector3(c.x, p.y, c.z)
	# fallen through the ground (should not happen): back on top
	var g := hd.height(global_position.x, global_position.z)
	if global_position.y < g - 1.5: global_position.y = g + 0.05; velocity.y = 0.0

# the stick pushes and he gets nowhere for a while: he is wedged in something; get him out
func _watch_stuck(want: Vector3, dt: float):
	if want.length() < 0.5 or state != "move":
		_push_t = 0.0; _push_from = global_position; return
	_push_t += dt
	if _push_t > 1.5:
		if global_position.distance_to(_push_from) < 0.15 and _overlapping(global_position): unstick()
		_push_t = 0.0; _push_from = global_position

func _overlapping(p: Vector3) -> bool:
	return WorldCollision.overlaps(p, RADIUS - 0.05, 1.6, WorldCollision.L_BUILD | WorldCollision.L_PROPS)

# inside a wall or a building (put there by an old save, a landing, a horse): to the nearest free spot
func unstick() -> bool:
	if not is_inside_tree() or WorldCollision.inst == null: return false
	var p := global_position
	if not _overlapping(p): return false
	for ring in range(1, 30):
		var r := ring * 0.6
		var n := 8 + ring * 2
		for k in n:
			var a := TAU * float(k) / n
			var q := Vector3(p.x + cos(a) * r, 0, p.z + sin(a) * r)
			if WorldShape.WATER - hd.height(q.x, q.z) > SWIM_DEPTH and not hd.on_deck(q.x, q.z): continue
			q.y = hd.ground(q.x, q.z) + 0.03
			if not _overlapping(q):
				global_position = q; velocity = Vector3.ZERO
				smooth.snap(self, avatar)
				return true
	return false

# how hard he hits: by what he holds
func _damage() -> float:
	var w: String = look.get("weapon", "")
	if w in ["sword2", "axe2"]: return 46.0
	if w in ["sword", "axe"]: return 38.0
	if w in ["crossbow", "crossbow2", "staff", "wand"]: return 30.0
	return 34.0

# on horseback: the stick steers the horse; he can strike from the saddle
func _on_horse(dt: float):
	swimming = false; velocity = Vector3.ZERO
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
				game.player_strike(global_position + Vector3.UP * 1.6, forward(), 3.4, _damage() * (1.0 + minf(1.0, horse.speed / 10.0) * 0.6))
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
	swimming = false; speed_now = 0.0; velocity = Vector3.ZERO
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
