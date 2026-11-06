class_name Smooth
extends RefCounted
# Draws a body that moves in physics ticks smoothly at any frame rate. Its visual node is top_level (it does not follow
# the body by itself); every frame it is put where the body was between its last two ticks, by how much of the tick has
# passed. This is what physics interpolation does, kept to the few bodies that need it.
var prev := Transform3D()
var now := Transform3D()
var offset := Transform3D()      # the visual's own place and scale on the body

# after a jump (placed, boarded, landed): no sliding from the old place
func snap(body: Node3D, visual: Node3D, off = null) -> void:
	if off != null: offset = off
	now = body.global_transform if body.is_inside_tree() else body.transform
	prev = now
	if visual and visual.is_inside_tree(): visual.global_transform = now * offset

# at the end of each physics tick
func tick(body: Node3D) -> void:
	prev = now
	now = body.global_transform

# every frame
func draw(visual: Node3D) -> void:
	if visual == null or not visual.is_inside_tree(): return
	visual.global_transform = prev.interpolate_with(now, Engine.get_physics_interpolation_fraction()) * offset
