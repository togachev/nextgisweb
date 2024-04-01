import GPX from "ol/format/GPX";
import KML from "ol/format/KML";
import GeoJSON from "ol/format/GeoJSON";

export const TYPE_FILE = [
    { label: "GPX", title: "GPX", value: "application/gpx+xml", extension: ".gpx", format: new GPX(), disabled: false },
    { label: "GeoJSON", title: "GeoJSON", value: "application/geo+json", extension: ".geojson", format: new GeoJSON(), disabled: false },
    { label: "KML", title: "KML", value: "application/vnd.google-earth.kml+xml", extension: ".kml", format: new KML(), disabled: false },
];