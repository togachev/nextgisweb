/*** {
    "revision": "46cfda20", "parents": ["45999710"],
    "date": "2024-09-06T04:05:18",
    "message": "Add active_panel display"
} ***/

ALTER TABLE webmap ADD COLUMN active_panel character varying(50);
UPDATE webmap SET active_panel = 'layers';