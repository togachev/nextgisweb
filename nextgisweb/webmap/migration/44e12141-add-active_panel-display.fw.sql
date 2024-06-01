/*** {
    "revision": "44e12141", "parents": ["43b50af4"],
    "date": "2024-06-01T15:58:38",
    "message": "Add active_panel display"
} ***/

ALTER TABLE webmap ADD COLUMN active_panel character varying(50);
UPDATE webmap SET active_panel = 'layers';
