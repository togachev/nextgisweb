/*** {
    "revision": "4a4ce85e", "parents": ["4989801b"],
    "date": "2025-02-27T09:03:14",
    "message": "Remove identify_panel"
} ***/

DELETE FROM setting 
WHERE component = 'webmap' 
    AND name IN ('identify_panel','popup_width','popup_height');
