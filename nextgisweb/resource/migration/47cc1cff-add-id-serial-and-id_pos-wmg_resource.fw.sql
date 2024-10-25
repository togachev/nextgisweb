/*** {
    "revision": "47cc1cff", "parents": ["45f6d7cf"],
    "date": "2024-10-25T09:05:05",
    "message": "Add id serial and id_pos wmg_resource"
} ***/

ALTER TABLE public.wmg_resource ADD id serial4 NOT NULL;
ALTER TABLE public.wmg_resource ADD id_pos int4 NULL;