import parse, { attributesToProps, Element, domToReact, HTMLReactParserOptions } from "html-react-parser";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, Image, Divider, Space } from "@nextgisweb/gui/antd";
import { transform } from "ol/proj";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import Info from "@nextgisweb/icon/material/info/outline";

import type { Display } from "@nextgisweb/webmap/display";
import type { HighlightEvent } from "@nextgisweb/webmap/highlight-store/HighlightStore";

import "./DescComponent.less";

interface GetDataProps {
    type: string | null;
    item: Element;
    options: HTMLReactParserOptions;
    lid: number | string | null;
    styleId?: number | string | null;
    fid?: number | string | null;
    styles: number[];
    display: Display;
    raster?: string | null;
    zoom?: number | null;
}

const msgWebmap = gettext("Webmap");
const msgLayer = gettext("Layer");
const msgStyle = gettext("Style");
const msgActiveLink = gettext("Links are active only in the open web map");
const msgZoomToFeature = gettext("Click to move closer to the object");
const msgZoomToRaster = gettext("Click to move closer to the raster layer");

const zoomToFeature = (display: Display, layerId: number | string | null, featureId: number | string | null, styles: number[]) => {
    display.highlighter
        .highlightById(featureId, layerId, display.config.colorSF)
        .then(({ geom }: HighlightEvent) => {
            display.map.zoomToGeom(geom);
            display.treeStore.setVisibleIdsUseStyles(styles);
        });
};

const cancelZoomToFeature = (display: Display) => {
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
};

const zoomToRasterExtent = async (display: Display, raster: string | null, styles: number[], zoom: number | null) => {
    const lonlat = [...raster.split(":")].slice(2, 4);
    const coordinates = transform(lonlat, display.lonlatProjection, display.displayProjection);

    const highlightEvent: HighlightEvent = {
        coordinates: coordinates,
        colorSF: display.config.colorSF,
    };
    console.log(highlightEvent);
    
    display.highlighter.highlight(highlightEvent);

    display.popupStore.zoomToPoint(coordinates, { maxZoom: zoom });

    display.treeStore.setVisibleIdsUseStyles(styles);
};

const GetData = ({ type, item, options, lid, fid, styles, display, raster, zoom }: GetDataProps) => {
    if (type === "vector") {
        return (
            <>
                <div
                    className="link-type-active"
                    title={msgZoomToFeature}
                    onClick={() => {
                        zoomToFeature(display, lid, fid, styles);
                        display.popupStore.pointDestroy();
                    }}>
                    <Space direction="horizontal" style={{ display: "flex", alignItems: "flex-start" }}>
                        <SvgIcon icon={`rescls-vector_layer`} />{domToReact(item.children, options)}
                    </Space>
                </div >
                <Button onClick={() => { cancelZoomToFeature(display) }}>cancel</Button>
            </>
        );
    } else if (type === "raster") {
        return (
            <div
                className="link-type-active"
                title={msgZoomToRaster}
                onClick={() => {
                    zoomToRasterExtent(display, raster, styles, zoom);
                    display.popupStore.pointDestroy();
                }}
            >
                <Space direction="horizontal" style={{ display: "flex", alignItems: "flex-start" }}>
                    <SvgIcon icon={`rescls-raster_layer`} />{domToReact(item.children, options)}
                </Space>
            </div>
        );
    } else {
        return (<Space className="link-type" title={msgActiveLink} direction="horizontal">{domToReact(item.children, options)}<Info /></Space>);
    }
}

export const DescComponent = (props) => {
    const { display, content, type } = props;

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
        const lid = urlParams.get("lid");
        const fid = urlParams.get("fid");
        const zoom = urlParams.get("zoom");
        const styles = urlParams.get("styles");
        const type = urlParams.get("type");

        const raster = urlParams.get("raster");

        if (request !== "feature") { return; }
        if (display) {
            const styles_ = Array.from(styles.split(","), Number)
            return <GetData type={type} item={item} options={options} lid={lid} fid={fid} zoom={zoom} styles={styles_} display={display} raster={raster} />
        } else if (display === undefined) {
            return <GetData item={item} options={options} lid={lid} />
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