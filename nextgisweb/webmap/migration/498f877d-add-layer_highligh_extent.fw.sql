/*** {
    "revision": "498f877d", "parents": ["4989801b"],
    "date": "2025-01-21T10:27:08",
    "message": "Add layer_highligh_extent"
} ***/

ALTER TABLE webmap_item ADD COLUMN layer_highligh_extent boolean;
UPDATE webmap_item SET layer_highligh_extent = false WHERE item_type = 'layer'