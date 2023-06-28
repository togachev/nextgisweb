/*** { "revision": "3e17219c" } ***/

ALTER TABLE webmap DROP COLUMN extent_left_const;
ALTER TABLE webmap DROP COLUMN extent_right_const;
ALTER TABLE webmap DROP COLUMN extent_bottom_const;
ALTER TABLE webmap DROP COLUMN extent_top_const;
ALTER TABLE webmap DROP COLUMN layer_extent_id;
ALTER TABLE webmap DROP COLUMN layer_extent_const_id;