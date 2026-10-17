## The 30fps floor

Big animations (overlay, sheets, cascade, segmented selection,
prayer-transition UI) must hold frame gaps ≤33ms with no multi-frame
freezes. 60fps is a bonus, never required. Per-second countdown text is
