/*** {
    "revision": "3f5debe3", "parents": ["37e63f22"],
    "date": "2023-08-31T09:12:22",
    "message": "Creating Foreign Key Relationships"
} ***/

ALTER TABLE vector_layer ADD COLUMN column_key int4 NULL;
ALTER TABLE vector_layer ADD COLUMN column_constraint character varying(255) NULL;
ALTER TABLE vector_layer ADD COLUMN column_from_const character varying(255) NULL;