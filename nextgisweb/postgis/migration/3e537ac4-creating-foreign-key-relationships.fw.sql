/*** {
    "revision": "3e537ac4", "parents": ["37e639a6"],
    "date": "2023-07-10T09:49:16",
    "message": "Creating Foreign Key Relationships"
} ***/

ALTER TABLE postgis_layer ADD COLUMN column_key int4 NULL;
ALTER TABLE postgis_layer ADD COLUMN column_constraint character varying(255) NULL;
ALTER TABLE postgis_layer ADD COLUMN column_from_const character varying(255) NULL;
