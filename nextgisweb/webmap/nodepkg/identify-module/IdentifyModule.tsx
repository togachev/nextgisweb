import React, { Component, createRef, RefObject } from "react";
import { createRoot } from "react-dom/client";
import { pointClick } from "./icons/icon";
import type { DojoDisplay } from "@nextgisweb/webmap/type";
import { Map, MapBrowserEvent, Overlay } from "ol";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { Interaction } from "ol/interaction";
import { fromExtent } from "ol/geom/Polygon";
import { WKT } from "ol/format";
import { boundingExtent } from "ol/extent";
import { route } from "@nextgisweb/pyramid/api";
import { Point } from "ol/geom";
import PopupComponent from "./component/PopupComponent";
import ContextComponent from "./component/ContextComponent";
import spatialRefSysList from "@nextgisweb/pyramid/api/load!api/component/spatial_ref_sys/";
import type { RequestProps } from "@nextgisweb/webmap/panel/diagram/type";
import "./IdentifyModule.less";
import { positionContext } from "./positionContext"
import OlGeomPoint from "ol/geom/Point";

interface StylesRequest {
    id: number;
    label: string;
    idm: number;
}

interface VisibleProps {
    hidden: boolean;
    overlay: number[] | undefined;
    key: string;
}

interface SelectedFeatureProps {
    layerId: number;
    featureId: number;
    styleId: number;
    label: string;
}

interface EventProps {
    request: RequestProps | undefined;
    point: number[];
}

const settings = webmapSettings;
const wkt = new WKT();

const srsCoordinates = {};
if (spatialRefSysList) {
    spatialRefSysList.forEach((srsInfo) => {
        srsCoordinates[srsInfo.id] = srsInfo;
    });
}

const Control = function (options) {
    this.tool = options.tool;
    Interaction.call(this, {
        handleEvent: Control.prototype.handleClickEvent,
    });
};

Control.prototype = Object.create(Interaction.prototype);
Control.prototype.constructor = Control;

Control.prototype.handleClickEvent = function (e: MapBrowserEvent) {
    if (e.type === "singleclick" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === false) {
        this.tool._overlayInfo(e, "popup", false);
        e.preventDefault();
    }
    else if (e.type === "singleclick" && e.originalEvent.shiftKey === true) {
        this.tool._popupMultiple(e, "multi", false);
        e.preventDefault();
    }
    else if (e.type === "contextmenu" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === false) {
        this.tool._overlayInfo(e, "context", false);
        e.preventDefault();
    }
    return true;
};

export class IdentifyModule extends Component {
    private display: DojoDisplay;
    private displaySrid: number;
    private lonlat: number[];
    private olmap: Map;
    private params: EventProps;
    private paramsSelected: SelectedFeatureProps[] = [];
    private overlay_popup: Overlay;
    private overlay_context: Overlay;
    private control: Interaction;
    private popup: HTMLDivElement;
    private point_popup: HTMLDivElement;
    private point_context: HTMLDivElement;
    private root_popup: React.ReactElement;
    private root_context: React.ReactElement;
    private refPopup: RefObject<Element>;
    private refContext: RefObject<Element>;

    constructor(props: DojoDisplay) {
        super(props)

        this.display = props;
        this.displaySrid = 3857;
        this.olmap = this.display.map.olMap;
        this.control = new Control({ tool: this });
        this.control.setActive(false);
        this.olmap.addInteraction(this.control);

        this._addOverlay();

        this.popup = document.createElement("div");
        this.point_popup = document.createElement("div");
        this.point_popup.innerHTML = `<span class="icon-position">${pointClick}</span>`;
        this.root_popup = createRoot(this.popup);
        this.point_context = document.createElement("div");
        this.root_context = createRoot(this.point_context);

        this.refPopup = createRef();
        this.refContext = createRef();
    };

    activate = () => {
        this.control.setActive(true);
    };

    deactivate = () => {
        this.control.setActive(false);
    };

    _setValue = (value: HTMLElement, key: string) => {
        key === "popup" ?
            this.overlay_popup.setElement(value) :
            this.overlay_context.setElement(value)
    };

    _addOverlay = () => {
        this.overlay_popup = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay_popup);

        this.overlay_context = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay_context);
    };

    _visible = ({ hidden, overlay, key }: VisibleProps) => {
        if (key === "popup") {
            if (this.refPopup.current) {
                this.refPopup.current.hidden = hidden
            }
            this.overlay_popup.setPosition(overlay);
        } else {
            if (this.refContext.current) {
                this.refContext.current.hidden = hidden
            }
            this.overlay_context.setPosition(overlay);
        }
    };

    isNumeric = (string) => Number.isFinite(+string);

    displayFeatureInfo = async (event: MapBrowserEvent, op: string, p) => {
        this.lonlat = await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: this.displaySrid,
                    srs_to: Object.keys(srsCoordinates).map(Number),
                    geom: wkt.writeGeometry(new Point(this.params.point)),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== this.displaySrid)
                const wktPoint = wkt.readGeometry(t.geom);
                const transformedCoord = wktPoint.getCoordinates();
                return transformedCoord;
            });

        let count, response;

        if (this.params.request !== null) {
            response = await route("feature_layer.identify_module")
                .post({
                    json: this.params.request,
                })
                .then(item => {
                    return { data: item.data, featureCount: item.featureCount };
                });
            count = response.featureCount;
        } else if (op === "popup" && p.value.attribute === true) {
            response = await route("feature_layer.feature_selected")
                .post({
                    json: this.paramsSelected,
                })
                .then(item => {
                    return { data: item, featureCount: item.length };
                });
            count = response.featureCount;
        } else {
            count = 0;
            response = { data: [], featureCount: 0 }
        }

        const offset = op === "context" ? 0 : settings.offset_point;

        const array_context = [ //для создания кнопок в контекстном меню
            { key: 1, title: 'Действие 1', result: 'Действие 1 выполнено', visible: false },
            { key: 2, title: 'Действие 2', result: 'Действие 2 выполнено', visible: false },
            { key: 3, title: 'Действие 3', result: 'Действие 3 выполнено', visible: false },
            { key: 4, title: 'Действие 4', result: 'Действие 4 выполнено', visible: false },
        ];

        const position = positionContext(event, offset, op, count, settings, p, array_context);

        if (op === "popup") {
            console.log(this.display);

            const sortedArray = this.display._layer_order;
            const orderObj = this.params.request.styles.reduce((a, c, i) => { a[c.id] = i; return a; }, {});
            console.log(this.display.config);

            this.display.config.identify_order_enabled === true ?
                response.data.sort((a, b) => sortedArray.indexOf(a.idm) - sortedArray.indexOf(b.idm)) :
                response.data.sort((l, r) => orderObj[l.styleId] - orderObj[r.styleId]);

            this._visible({ hidden: true, overlay: undefined, key: "context" })
            this._setValue(this.point_popup, "popup");
            this.root_popup.render(<PopupComponent params={{ position, response }} display={this.display} visible={this._visible} ref={this.refPopup} />);
            this._visible({ hidden: false, overlay: this.params.point, key: "popup" });
        } else {
            this._setValue(this.point_context, "context")
            this.root_context.render(<ContextComponent array_context={array_context} params={{ position }} display={this.display} visible={this._visible} ref={this.refContext} />);
            this._visible({ hidden: false, overlay: this.params.point, key: "context" });
        }
    };

    _isEditEnabled = (display, item) => {
        const pluginName = "ngw-webmap/plugin/FeatureLayer";

        if (display.isTinyMode() && !display.isTinyModePlugin(pluginName)) {
            return false;
        }

        const configLayerPlugin = item?.itemConfig.plugin["ngw-webmap/plugin/FeatureLayer"];
        const readOnly = configLayerPlugin?.readonly;
        return !readOnly;
    };

    _render = () => {
        this.display.identify_module.root_popup.render();
    };

    _popupMultiple = (e: MapBrowserEvent, op: string, p) => {
        console.log(e.pixel, op, p);
    };

    _overlayInfo = (e: MapBrowserEvent, op: string, p) => {
        let request;
        if (op === "popup" && p === false) {
            const styles: StylesRequest[] = [];
            this.display.getVisibleItems()
                .then(items => {
                    const itemConfig = this.display.getItemConfig();
                    const mapResolution = this.olmap.getView().getResolution();
                    items.map(i => {
                        const item = itemConfig[i.id];
                        if (
                            !item.identifiable ||
                            mapResolution >= item.maxResolution ||
                            mapResolution < item.minResolution
                        ) {
                            return;
                        }
                        styles.push({ id: item.styleId, label: item.label, idm: item.id });
                    });
                })

            request = {
                srs: this.displaySrid,
                geom: this._requestGeomString(e.pixel),
                styles: styles,
            }

        } else {
            request = null;
        }

        if (op === "popup" && p && p.value.attribute === true) {
            this.display.getVisibleItems()
                .then(items => {
                    const itemConfig = this.display.getItemConfig();

                    p.value.params.map(itm => {
                        items.some(x => {
                            if (itemConfig[x.id].styleId === itm.styleId) {
                                const label = items.find(x => itemConfig[x.id].styleId === itm.styleId).label[0]
                                itm.label = label;
                            }
                        });
                    })

                    this.paramsSelected = p.value.params
                })
        }

        this.params = {
            point: e.coordinate,
            request: request,
        }

        this.displayFeatureInfo(e, op, p);
    };

    _requestGeomString = (pixel: number[]) => {
        const pixelRadius = settings.identify_radius;

        return new WKT().writeGeometry(
            fromExtent(
                boundingExtent([
                    this.olmap.getCoordinateFromPixel([
                        pixel[0] - pixelRadius,
                        pixel[1] - pixelRadius,
                    ]),
                    this.olmap.getCoordinateFromPixel([
                        pixel[0] + pixelRadius,
                        pixel[1] + pixelRadius,
                    ]),
                ])
            )
        )
    };

    identifyModuleUrlParams = async (lon, lat, attribute, lsf) => {
        const lsf_ = new String(lsf);
        if (attribute && attribute === "false") {
            this._responseContext({ lon, lat, attribute: false });
        } else if (lsf_ instanceof String) {
            this._responseContext({ lon, lat, attribute: true, lsf });
        }
        return true;
    };

    _responseContext = async (val) => {
        await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: 4326,
                    srs_to: Object.keys(srsCoordinates).map(Number),
                    geom: wkt.writeGeometry(new OlGeomPoint([val.lon, val.lat])),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== 4326)
                const wktPoint = wkt.readGeometry(t.geom);
                const transformedCoord = wktPoint.getCoordinates();
                return transformedCoord;
            })
            .then((transformedCoord) => {
                const params: SelectedFeatureProps[] = [];
                val.lsf?.split(",").map(i => {
                    params.push({
                        styleId: Number(i.split(":")[0]),
                        layerId: Number(i.split(":")[1]),
                        featureId: Number(i.split(":")[2]),
                        label: "",
                    });
                })

                const value = {
                    attribute: val.attribute,
                    lat: val.lat,
                    lon: val.lon,
                    params,
                }

                const p = { value, coordinate: transformedCoord };
                const offHP = 40;

                const W = window.innerWidth;
                const H = window.innerHeight;

                const simulateEvent = {
                    coordinate: p && p.coordinate,
                    map: this.olmap,
                    target: 'map',
                    pixel: [
                        this.display.panelsManager._activePanelKey ? (W + this.display.leftPanelPane.w + offHP) / 2 : (W + offHP) / 2,
                        (H + offHP) / 2
                    ],
                    type: 'singleclick'
                };

                this._overlayInfo(simulateEvent, "popup", p)
            });
    };
}
