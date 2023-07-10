/*** {
    "revision": "3e53840b", "parents": ["37e63f22"],
    "date": "2023-07-10T09:59:27",
    "message": "Creating Foreign Key Relationships"
} ***/

ALTER TABLE vector_layer ADD COLUMN column_key int4 NULL;
ALTER TABLE vector_layer ADD COLUMN column_constraint character varying(255) NULL;
ALTER TABLE vector_layer ADD COLUMN column_from_const character varying(255) NULL;