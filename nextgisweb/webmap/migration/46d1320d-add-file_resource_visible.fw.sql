/*** {
    "revision": "46d1320d", "parents": ["46d12ee0"],
    "date": "2024-09-06T10:22:41",
    "message": "Add file_resource_visible"
} ***/

ALTER TABLE webmap_item ADD COLUMN file_resource_visible boolean;
UPDATE webmap_item SET file_resource_visible = false WHERE item_type = 'layer'