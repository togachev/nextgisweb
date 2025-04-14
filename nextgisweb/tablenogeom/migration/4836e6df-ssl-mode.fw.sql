/*** {
    "revision": "4836e6df", "parents": ["461283a2"],
    "date": "2024-11-15T05:01:50",
    "message": "SSL mode"
} ***/

ALTER TABLE tablenogeom_connection ADD COLUMN sslmode character varying(50);
