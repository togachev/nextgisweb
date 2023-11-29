/*** {
    "revision": "412b96c5", "parents": ["3e366d86"],
    "date": "2023-11-29T10:34:04",
    "message": "Creating timeline flag"
} ***/

-- TODO: Write code here and remove this placeholder line!

ALTER TABLE webmap_item ADD COLUMN layer_timeline boolean;
UPDATE webmap_item SET layer_timeline = false WHERE item_type = 'layer'