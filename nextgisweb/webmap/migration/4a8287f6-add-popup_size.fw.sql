/*** {
    "revision": "4a8287f6", "parents": ["4a4ce85e"],
    "date": "2025-03-09T20:05:58",
    "message": "Add popup_size"
} ***/

INSERT INTO setting (component, "name", value)
VALUES ('webmap', 'popup_size', '{"width": 350,"height": 350}')
ON CONFLICT DO NOTHING;
