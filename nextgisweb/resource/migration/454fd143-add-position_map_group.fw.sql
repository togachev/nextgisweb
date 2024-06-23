/*** {
    "revision": "454fd143", "parents": ["00000000"],
    "date": "2024-06-23T06:10:35",
    "message": "Add position_map_group"
} ***/

ALTER TABLE wmg_resource ADD COLUMN position_map_group jsonb null;

UPDATE wmg_resource SET
    position_map_group = '{"h": 1,"w": 1,"x": 0,"y": 0,"static": true}';