/*** {
    "revision": "44e6ed9f", "parents": ["00000000"],
    "date": "2024-06-02T19:07:22",
    "message": "Add position_map_group"
} ***/

ALTER TABLE wmg_resource ADD COLUMN position_map_group jsonb NULL;
