import parse, { attributesToProps, Element, domToReact, HTMLReactParserOptions } from "html-react-parser";
import { useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Image, Divider, Space } from "@nextgisweb/gui/antd";
import { transform } from "ol/proj";
import Info from "@nextgisweb/icon/material/info/outline";

import type { Display } from "@nextgisweb/webmap/display";
import type { HighlightEvent } from "@nextgisweb/webmap/highlight-store/HighlightStore";

import "./DescComponent.less";

interface GetDataProps {
    type: string | null;
    item: Element;
    options: HTMLReactParserOptions;
    layerId: number | string | null;
    styleId?: number | string | null;
    featureId?: number | string | null;
    styles: number[];
    display: Display;
    raster?: string | null;
    zoom?: number | null;
    reset: boolean;
    setReset: (reset: boolean) => void;
}

export interface ResetProps {
    [key: number]: boolean;
}

const msgWebmap = gettext("Webmap");
const msgLayer = gettext("Layer");
const msgStyle = gettext("Style");
const msgActiveLink = gettext("Links are active only in the open web map");
const msgZoomToFeature = gettext("Click to move closer to the object");
const msgToHome = gettext("Click to return to the original web map coverage");
const msgZoomToRaster = gettext("Click to move closer to the raster layer");

const zoomToFeature = async (display: Display, layerId: number | string | null, featureId: number | string | null, styles: number[], styleId: number | string | null) => {
    await display.highlighter
        .highlightById(featureId, layerId, display.config.colorSF)
        .then(({ geom }: HighlightEvent) => {
            display.map.zoomToGeom(geom);
            display.treeStore.setVisibleIdsUseStyles(styles);
            display.popupStore.rootPopup.render();
            display.popupStore.overlayPoint.setPosition(undefined);
        });
    return { styleId, value: true };
};

const cancelZoomToFeature = async (display: Display, styleId: number | string | null) => {
    display.highlighter.unhighlight();
    const items = display.treeStore.items;
    const ids: number[] = [];
    display.config.checkedItems.forEach((key: number) => {
        ids.push(items.get(key).id);
    });
    display.treeStore.setVisibleIds(ids);
    display.map.zoomToExtent(display.config.initialExtent, {
        projection: "EPSG:4326",
    });
    return { styleId, value: false };
};

const zoomToRasterExtent = async (display: Display, raster: string | null, styles: number[], zoom: number | null, styleId: number | string | null) => {
    const lonlat = Array.from(raster.split(":"), Number).slice(2, 4);
    const coordinates = transform(lonlat, display.lonlatProjection, display.displayProjection);
    const highlightEvent: HighlightEvent = {
        coordinates: coordinates,
        colorSF: display.config.colorSF,
    };
    display.highlighter.highlight(highlightEvent);
    display.popupStore.zoomToPoint(coordinates, { maxZoom: zoom });
    display.treeStore.setVisibleIdsUseStyles(styles);
    display.popupStore.rootPopup.render();
    display.popupStore.overlayPoint.setPosition(undefined);
    return { styleId, value: true };
};

const GetData = ({ type, item, options, layerId, featureId, styles, display, raster, zoom, reset, setReset, styleId }: GetDataProps) => {
    const enabled = reset && Object.keys(reset)[0] === styleId && Object.values(reset)[0] === true;
    if (type === "vector") {
        return (
            <span
                className="link-type-wrap"
                title={enabled ? msgToHome : msgZoomToFeature}
                style={enabled ? { color: "red" } : { color: "var(--primary)" }}
                onClick={() => {
                    if (Object.keys(reset).length === 0) {
                        zoomToFeature(display, layerId, featureId, styles, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                    } else {
                        if (enabled) {
                            cancelZoomToFeature(display, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                        } else if (Object.keys(reset)[0] === styleId && Object.values(reset)[0] === false) {
                            zoomToFeature(display, layerId, featureId, styles, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                        } else if (Object.keys(reset)[0] !== styleId) {
                            zoomToFeature(display, layerId, featureId, styles, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                        }
                    }
                }}>
                {domToReact(item.children, options)}
            </span >
        );
    } else if (type === "raster") {
        return (
            <span
                className="link-type-wrap"
                title={enabled ? msgToHome : msgZoomToRaster}
                style={enabled ? { color: "red" } : { color: "var(--primary)" }}
                onClick={() => {
                    if (Object.keys(reset).length === 0) {
                        zoomToRasterExtent(display, raster, styles, zoom, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                    } else {
                        if (enabled) {
                            cancelZoomToFeature(display, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                        } else if (Object.keys(reset)[0] === styleId && Object.values(reset)[0] === false) {
                            zoomToRasterExtent(display, raster, styles, zoom, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                        } else if (Object.keys(reset)[0] !== styleId) {
                            zoomToRasterExtent(display, raster, styles, zoom, styleId).then(i => setReset({ ...{ [i.styleId]: i.value } }))
                        }
                    }
                }}
            >
                {domToReact(item.children, options)}
            </span>
        );
    } else {
        return (
            <span className="link-type" title={msgActiveLink} direction="horizontal">
                {domToReact(item.children, options)}
                <span style={{ padding: "0 2px" }}><Info /></span>
            </span>
        );
    }
}

export const DescComponent = (props) => {
    const { display, content, type } = props;
    const [reset, setReset] = useState<ResetProps>({});
    const DescComp = ({ content }) => {
        return content?.map((item, index) => {
            let title;
            switch (item.type) {
                case "webmap_desc":
                    title = msgWebmap;
                    break;
                case "layer":
                    title = msgLayer;
                    break;
                case "style":
                    title = msgStyle;
                    break;
            }

            if (item.description) {
                return (
                    <Space key={index} direction="vertical" style={{ width: "100%" }}>
                        {content.length > 1 && (
                            <Divider variant="dotted" style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }} orientationMargin={0} orientation="right" plain>{title}</Divider>
                        )}
                        {parse(item.description, options)}
                    </Space>
                )
            }
        })
    };

    const options = {
        replace: item => {
            const props = attributesToProps(item.attribs);
            if (item instanceof Element && item.attribs && item.name === "img") {
                return (<Image
                    preview={Number(props.width) < 350 ? false : {
                        transitionName: "",
                        maskTransitionName: "",
                    }}
                    {...props}
                />);
            }

            if (item instanceof Element && item.attribs && item.name === "p") {
                return <div style={{ width: "100%" }} {...props} >{domToReact(item.children, options)}</div>;
            }

            if (item instanceof Element && item.name === "a") {
                return checkUrl(display, item)
            }
        }
    };

    const checkUrl = (display, item) => {
        const urlParams = new URLSearchParams(item.attribs.href);

        const request = urlParams.get("request");
        const layerId = urlParams.get("lid");
        const featureId = urlParams.get("fid");
        const zoom = urlParams.get("zoom");
        const styles = urlParams.get("styles");
        const type = urlParams.get("type");
        const styleId = urlParams.get("styleId");
        const raster = urlParams.get("raster");

        if (request !== "feature") { return; }
        if (display) {
            const styles_ = Array.from(styles.split(","), Number)
            return <GetData
                reset={reset} setReset={setReset} type={type} item={item} options={options} layerId={layerId} featureId={featureId} zoom={zoom} styles={styles_} display={display} raster={raster} styleId={styleId}
            />
        } else if (display === undefined) {
            return <GetData item={item} options={options} layerId={layerId} />
        }
    };

    let data_;
    if (content === undefined && type === "map") {
        data_ = parse(display.config.webmapDescription, options)
    } else if (content?.content instanceof Array && content.type === "map") {
        data_ = (<DescComp content={content.content} />)
    } else {
        data_ = parse(content, options)
    }

    return (
        <div className="desc-component">
            <div className="ck-content">{data_}</div>
        </div>
    )
};