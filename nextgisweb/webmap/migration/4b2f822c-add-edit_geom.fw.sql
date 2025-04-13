/*** {
    "revision": "4b2f822c", "parents": ["4a6a7a01"],
    "date": "2025-04-12T13:55:03",
    "message": "Add edit_geom"
} ***/

ALTER TABLE webmap_item ADD COLUMN edit_geom boolean;
UPDATE webmap_item SET edit_geom = true WHERE item_type = 'layer'