/*** { "revision": "3e2c2ebb" } ***/

UPDATE public.webmap
SET extent_constrained = CASE
    WHEN
        extent_left_const IS NOT NULL OR
        extent_right_const IS NOT NULL OR
        extent_bottom_const IS NOT NULL OR
        extent_top_const IS NOT NULL
    THEN true ELSE false END;


ALTER TABLE public.webmap DROP COLUMN extent_left_const;
ALTER TABLE public.webmap DROP COLUMN extent_right_const;
ALTER TABLE public.webmap DROP COLUMN extent_bottom_const;
ALTER TABLE public.webmap DROP COLUMN extent_top_const;