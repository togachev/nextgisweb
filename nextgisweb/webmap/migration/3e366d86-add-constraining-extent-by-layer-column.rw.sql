/*** { "revision": "3e366d86" } ***/

ALTER TABLE public.webmap ADD COLUMN extent_constrained boolean;

UPDATE public.webmap
SET extent_constrained = CASE
    WHEN
        extent_const_left IS NOT NULL OR
        extent_const_right IS NOT NULL OR
        extent_const_bottom IS NOT NULL OR
        extent_const_top IS NOT NULL
    THEN true ELSE false END;


ALTER TABLE public.webmap DROP COLUMN extent_const_left;
ALTER TABLE public.webmap DROP COLUMN extent_const_right;
ALTER TABLE public.webmap DROP COLUMN extent_const_bottom;
ALTER TABLE public.webmap DROP COLUMN extent_const_top;