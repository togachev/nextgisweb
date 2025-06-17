/*** {
    "revision": "4c7fd4c2", "parents": ["4b2f822c"],
    "date": "2025-06-17T04:27:33",
    "message": "Add select_feature_panel display"
} ***/

ALTER TABLE webmap
    ADD COLUMN select_feature_panel boolean;
UPDATE webmap SET select_feature_panel = false;