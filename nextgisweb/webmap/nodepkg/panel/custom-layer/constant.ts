import GPX from "ol/format/GPX";
import KML from "ol/format/KML";
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style } from "ol/style";

export const TYPE_FILE = [
    { label: "GPX", title: "GPX", value: "application/gpx+xml", extension: ".gpx", format: new GPX(), disabled: false },
    { label: "GeoJSON", title: "GeoJSON", value: "application/geo+json", extension: ".geojson", format: new GeoJSON(), disabled: false },
    { label: "KML", title: "KML", value: "application/vnd.google-earth.kml+xml", extension: ".kml", format: new KML(), disabled: false },
];

export const style = [
    new Style({
        stroke: new Stroke({
            width: 2,
            color: "#FF2128",
        }),
        image: new Circle({
            stroke: new Stroke({
                width: 1,
                color: "#000000",
            }),
            radius: 5,
            fill: new Stroke({
                width: 4,
                color: "#106a9020",
            }),
        }),
        fill: new Fill({
            color: "#106a9020",
        }),
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 1,
                color: "#ffffff",
            }),
            radius: 6,
        }),
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 1,
                color: "#ffffff",
            }),
            radius: 2,
            fill: new Stroke({
                width: 2,
                color: "#fff",
            }),
        }),
    }),
    new Style({
        image: new Circle({
            radius: 1,
            fill: new Stroke({
                width: 2,
                color: "#000",
            }),
        }),
    }),
];

export const styleDraw = [
    new Style({
        stroke: new Stroke({
            width: 2,
            color: "#FF0000",
            lineDash: [5, 5]
        }),
        zIndex: 1000
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 2,
                color: "#1400FF",
            }),
            radius: 6,
        }),
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 2,
                color: "#1400FF",
            }),
            radius: 2,
            fill: new Stroke({
                width: 2,
                color: "#fff",
            }),
        }),
    }),
];

export const customStyle = new Style({
    stroke: new Stroke({
        width: 3,
        color: "#009DFF",
    }),
    image: new Circle({
        anchor: [0.5, 46],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        stroke: new Stroke({
            width: 2,
            color: "#fff",
        }),
        radius: 5,
        fill: new Stroke({
            width: 2,
            color: "#106a90",
        }),
    }),
    fill: new Fill({
        color: "#106a9020",
    }),
});

export const clickStyle = new Style({
    stroke: new Stroke({
        width: 4,
        color: "#FFE900"
    }),
    fill: new Fill({
        color: "rgba(0, 0, 255, 0.5)",
    }),
    image: new Circle({
        anchor: [0.5, 46],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        stroke: new Stroke({
            width: 1,
            color: "#000000"
        }),
        radius: 6,
        fill: new Stroke({
            width: 1,
            color: "#FFE900"
        }),
    }),
    zIndex: 100,
});