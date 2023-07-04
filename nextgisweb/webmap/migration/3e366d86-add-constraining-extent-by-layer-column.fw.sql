/*** {
    "revision": "3e366d86", "parents": ["3cb1eabf"],
    "date": "2023-07-04T17:48:41",
    "message": "Add constraining extent by layer column"
} ***/

ALTER TABLE public.webmap ADD COLUMN extent_const_left float8 NULL;
ALTER TABLE public.webmap ADD COLUMN extent_const_right float8 NULL;
ALTER TABLE public.webmap ADD COLUMN extent_const_bottom float8 NULL;
ALTER TABLE public.webmap ADD COLUMN extent_const_top float8 NULL;

UPDATE public.webmap SET
    extent_const_left = extent_left,
    extent_const_right = extent_right,
    extent_const_bottom = extent_bottom,
    extent_const_top = extent_top
WHERE extent_constrained = true;

ALTER TABLE public.webmap DROP COLUMN extent_constrained;