/*** {
    "revision": "3f5da7fc", "parents": ["00000000"],
    "date": "2023-08-31T07:57:52",
    "message": "Creating Foreign Key Relationships"
} ***/

ALTER TABLE nogeom_layer ADD COLUMN column_key int4 NULL;
ALTER TABLE nogeom_layer ADD COLUMN column_constraint character varying(255) NULL;
ALTER TABLE nogeom_layer ADD COLUMN column_from_const character varying(255) NULL;
