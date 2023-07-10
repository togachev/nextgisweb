/*** {
    "revision": "3e555f7b", "parents": ["00000000"],
    "date": "2023-07-10T18:41:08",
    "message": "Creating Foreign Key Relationships"
} ***/

ALTER TABLE nogeom_layer ADD COLUMN column_key int4 NULL;
ALTER TABLE nogeom_layer ADD COLUMN column_constraint character varying(255) NULL;
ALTER TABLE nogeom_layer ADD COLUMN column_from_const character varying(255) NULL;