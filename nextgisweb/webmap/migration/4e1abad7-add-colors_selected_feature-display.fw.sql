/*** {
    "revision": "4e1abad7", "parents": ["4c7fd4c2"],
    "date": "2025-09-05T08:08:22",
    "message": "Add colors_selected_feature display"
} ***/

ALTER TABLE webmap ADD COLUMN colors_selected_feature jsonb DEFAULT '{"fill": "rgba(255,255,255,0.1)","stroke_primary": "rgba(255,255,0,1)","stroke_secondary": "rgba(0, 0, 0, 1)"}'::jsonb;
UPDATE webmap SET colors_selected_feature = '{
    "stroke_primary": "rgba(255,255,0,1)",
    "stroke_secondary": "rgba(0, 0, 0, 1)",
    "fill": "rgba(255,255,255,0.1)"
}'::jsonb;