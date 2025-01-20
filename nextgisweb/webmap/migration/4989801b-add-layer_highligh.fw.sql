/*** {
    "revision": "4989801b", "parents": ["46d134a8"],
    "date": "2025-01-20T06:13:38",
    "message": "Add layer_highligh"
} ***/

ALTER TABLE webmap_item ADD COLUMN layer_highligh boolean;
UPDATE webmap_item SET layer_highligh = true WHERE item_type = 'layer'