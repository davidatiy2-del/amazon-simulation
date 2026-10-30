class_name Sound
extends Node
# The game's sounds: battle music while the army fights, and short sounds for blows, arrows, the fallen, the gate
# breaking, a victory, gold and the screens. Sounds far from the camera are quieter, or not heard at all; the same
# sound is not played again too soon, so a big battle does not become noise. (Kenney's sound packs and
# "Battle Theme A" by cynicmusic, CC0.)
const DIR := "res://assets/audio/"
var music: AudioStreamPlayer
var players: Array[AudioStreamPlayer] = []
var streams := {}
var last := {}
var cam: Camera3D
var music_on := false
var music_vol := -80.0
var t := 0.0
var enabled := true

func _ready():
	music = AudioStreamPlayer.new(); add_child(music)
	var ms = load(DIR + "battle_theme_a.mp3")
	if ms is AudioStreamMP3: (ms as AudioStreamMP3).loop = true
	music.stream = ms
	music.volume_db = -80.0
	for i in 8:
		var p := AudioStreamPlayer.new(); add_child(p); players.append(p)

func _stream(n: String) -> AudioStream:
	if not streams.has(n): streams[n] = load(DIR + n + ".ogg")
	return streams[n]

# a short sound; at: where it happened (INF: everywhere, like the screens)
func play(n: String, at := Vector3.INF, vol := 0.0, gap := 0.08) -> void:
	if not enabled: return
	if t - float(last.get(n, -10.0)) < gap: return
	var db := vol
	if at != Vector3.INF and cam:
		var d := cam.global_position.distance_to(at)
		if d > 70.0: return
		db += -d * 0.35
	last[n] = t
	for p in players:
		if not p.playing:
			p.stream = _stream(n); p.volume_db = db; p.pitch_scale = randf_range(0.92, 1.08); p.play()
			return

func battle(on: bool) -> void:
	music_on = on and enabled
	if music_on and not music.playing: music.play()

func _process(dt: float):
	t += dt
	var want := -9.0 if music_on else -80.0
	music_vol = move_toward(music_vol, want, dt * (20.0 if music_on else 12.0))
	music.volume_db = music_vol
	if not music_on and music_vol <= -79.0 and music.playing: music.stop()
