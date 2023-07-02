/*** {
    "revision": "3e2c2ebb", "parents": ["3cb1eabf"],
    "date": "2023-07-02T17:50:48",
    "message": "Add constraining extent by layer column"
} ***/

ALTER TABLE public.webmap ADD COLUMN extent_left_const float8 NULL;
ALTER TABLE public.webmap ADD COLUMN extent_right_const float8 NULL;
ALTER TABLE public.webmap ADD COLUMN extent_bottom_const float8 NULL;
ALTER TABLE public.webmap ADD COLUMN extent_top_const float8 NULL;

UPDATE public.webmap SET
    extent_left_const = extent_left,
    extent_right_const = extent_right,
    extent_bottom_const = extent_bottom,
    extent_top_const = extent_top
WHERE extent_constrained = true;