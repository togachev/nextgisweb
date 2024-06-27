/*** {
    "revision": "4566f525", "parents": ["454fd143"],
    "date": "2024-06-27T18:30:37",
    "message": "Add position_group"
} ***/

ALTER TABLE resource_wmg ADD COLUMN position_group jsonb null;

UPDATE resource_wmg SET
    position_group = ('{"i": '::text || id || ', "h": 1,"w": 1,"x": 0,"y": 0,"static": true}')::jsonb;
