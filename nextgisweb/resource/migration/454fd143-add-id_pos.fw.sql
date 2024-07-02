/*** {
    "revision": "454fd143", "parents": ["00000000"],
    "date": "2024-06-23T06:10:35",
    "message": "Add id_pos"
} ***/

ALTER TABLE wmg_resource ADD COLUMN id serial4;
ALTER TABLE wmg_resource ADD COLUMN id_pos INTEGER null;