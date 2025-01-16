/*** {
    "revision": "4977ecd9", "parents": ["46d134a8"],
    "date": "2025-01-16T19:56:47",
    "message": "Add layer_highligh"
} ***/

ALTER TABLE webmap_item ADD COLUMN layer_highligh boolean;
UPDATE webmap_item SET layer_highligh = true WHERE item_type = 'layer'