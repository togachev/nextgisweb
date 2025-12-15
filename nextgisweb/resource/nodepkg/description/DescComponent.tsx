import parse, { attributesToProps, Element, domToReact, HTMLReactParserOptions } from "html-react-parser";
import { useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Image, Divider, Space } from "@nextgisweb/gui/antd";
import { transform } from "ol/proj";
import Info from "@nextgisweb/icon/material/info/outline";

import type { Display } from "@nextgisweb/webmap/display";
import type { HighlightEvent } from "@nextgisweb/webmap/highlight-store/HighlightStore";

import "./DescComponent.less";

interface VectorProps {
    featureId: number;
    vector: string;
}

interface RasterProps {
    zoom: number;
    raster: string;
}

interface GetDataProps {
    type: string | null;
    item: Element;
    options: HTMLReactParserOptions;
    styleId: number;
    layerId: number;
    styles: number[];
    display: Display;
    reset: ResetProps;
    setReset: (reset: ResetProps) => void;
    props: VectorProps | RasterProps;
}

export interface ResetProps {
    [key: string]: boolean;
}

const msgWebmap = gettext("Webmap");
const msgLayer = gettext("Layer");
const msgStyle = gettext("Style");
const msgActiveLink = gettext("Links are active only in the open web map");
const msgZoomToFeature = gettext("Click to move closer to the object");
const msgToHome = gettext("Return to the original web map coverage");
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
    const lonlat = raster && Array.from(raster.split(":"), Number).slice(2, 4);
    const coordinates = lonlat && transform(lonlat, display.lonlatProjection, display.displayProjection);
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

const GetData = ({ type, item, options, styles, display, reset, setReset, layerId, styleId, props }: GetDataProps) => {
    if (type === "vector") {
        const { featureId, vector } = props as VectorProps;
        const enabled = reset && Object.keys(reset)[0] === vector && Object.values(reset)[0] === true;
        return (
            <span
                className="link-type-wrap"
                title={enabled ? msgToHome : msgZoomToFeature}
                style={enabled ? { color: "var(--text-base)", backgroundColor: "var(--divider-color)" } : { color: "var(--primary)" }}
                onClick={() => {
                    if (Object.keys(reset).length === 0) {
                        zoomToFeature(display, layerId, featureId, styles, styleId).then(i => vector && setReset({ ...{ [vector]: i.value } }))
                    } else {
                        if (enabled) {
                            cancelZoomToFeature(display, styleId).then(i => vector && setReset({ ...{ [vector]: i.value } }))
                        } else if (Object.keys(reset)[0] === vector && Object.values(reset)[0] === false) {
                            zoomToFeature(display, layerId, featureId, styles, styleId).then(i => vector && setReset({ ...{ [vector]: i.value } }))
                        } else if (Object.keys(reset)[0] !== vector) {
                            zoomToFeature(display, layerId, featureId, styles, styleId).then(i => vector && setReset({ ...{ [vector]: i.value } }))
                        }
                    }
                }}>
                {domToReact(item.children, options)}
            </span >
        );
    } else if (type === "raster") {
        const { raster, zoom } = props as RasterProps;
        const enabled = reset && Object.keys(reset)[0] === raster && Object.values(reset)[0] === true;
        return (
            <span
                className="link-type-wrap"
                title={enabled ? msgToHome : msgZoomToRaster}
                style={enabled ? { color: "var(--text-base)", backgroundColor: "var(--divider-color)" } : { color: "var(--primary)" }}
                onClick={() => {
                    if (Object.keys(reset).length === 0) {
                        zoomToRasterExtent(display, raster, styles, zoom, styleId).then(i => raster && setReset({ ...{ [raster]: i.value } }))
                    } else {
                        if (enabled) {
                            cancelZoomToFeature(display, styleId).then(i => raster && setReset({ ...{ [raster]: i.value } }))
                        } else if (Number(Object.keys(reset)[0]) === styleId && Object.values(reset)[0] === false) {
                            zoomToRasterExtent(display, raster, styles, zoom, styleId).then(i => raster && setReset({ ...{ [raster]: i.value } }))
                        } else if (Number(Object.keys(reset)[0]) !== styleId) {
                            zoomToRasterExtent(display, raster, styles, zoom, styleId).then(i => raster && setReset({ ...{ [raster]: i.value } }))
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
        const layerId = Number(urlParams.get("lid"));
        const featureId = Number(urlParams.get("fid"));
        const zoom = Number(urlParams.get("zoom"));
        const styles = urlParams.get("styles");
        const type = urlParams.get("type");
        const styleId = Number(urlParams.get("styleId"));
        const vector = urlParams.get("vector");
        const raster = urlParams.get("raster");

        if (request !== "feature") { return; }
        if (display) {
            const styles_ = Array.from(styles.split(","), Number)
            if (featureId && vector && type === "vector") {
                return <GetData
                    reset={reset} setReset={setReset} type={type} item={item} options={options} layerId={layerId} styleId={styleId} props={{ featureId: featureId, vector: vector }} styles={styles_} display={display}
                />
            } else if (raster && zoom && type === "raster") {
                return <GetData
                    reset={reset} setReset={setReset} type={type} item={item} options={options} styleId={styleId} props={{ zoom: zoom, raster: raster }} styles={styles_} display={display}
                />
            }
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