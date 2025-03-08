/*** {
    "revision": "4a4ce85e", "parents": ["46cfda20"],
    "date": "2025-02-27T09:03:14",
    "message": "Remove identify_panel"
} ***/

DELETE FROM setting 
WHERE component = 'webmap' 
    AND name IN ('identify_panel');
