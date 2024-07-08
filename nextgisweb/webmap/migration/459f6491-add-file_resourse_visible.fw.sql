/*** {
    "revision": "459f6491", "parents": ["44e12141"],
    "date": "2024-07-08T18:43:11",
    "message": "Add file_resourse_visible"
} ***/

ALTER TABLE webmap_item ADD COLUMN file_resourse_visible boolean;
UPDATE webmap_item SET file_resourse_visible = false WHERE item_type = 'layer'