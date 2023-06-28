/*** {
    "revision": "3e17219c", "parents": ["3cb1eabf"],
    "date": "2023-06-28T15:17:32",
    "message": "Add constrining extent by layer column"
} ***/

ALTER TABLE webmap ADD COLUMN extent_left_const float8 NULL;
ALTER TABLE webmap ADD COLUMN extent_right_const float8 NULL;
ALTER TABLE webmap ADD COLUMN extent_bottom_const float8 NULL;
ALTER TABLE webmap ADD COLUMN extent_top_const float8 NULL;
ALTER TABLE webmap ADD COLUMN layer_extent_id integer NULL;
ALTER TABLE webmap ADD COLUMN layer_extent_const_id integer NULL;
