/*** {
    "revision": "461283a2", "parents": ["37e639a6"],
    "date": "2024-07-31T05:40:36",
    "message": "Creating Foreign Key Relationships"
} ***/

ALTER TABLE postgis_layer ADD COLUMN resource_field_name character varying(255) NULL;
ALTER TABLE postgis_layer ADD COLUMN external_field_name character varying(255) NULL;
ALTER TABLE postgis_layer ADD COLUMN external_resource_id int4 NULL;
ALTER TABLE postgis_layer ADD CONSTRAINT postgis_layer_external_resource_id_fkey FOREIGN KEY (external_resource_id) REFERENCES resource(id);