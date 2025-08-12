import parse, { attributesToProps, Element, domToReact, HTMLReactParserOptions } from "html-react-parser";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Image, Divider, Space } from "@nextgisweb/gui/antd";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import topic from "@nextgisweb/webmap/compat/topic";
import { route } from "@nextgisweb/pyramid/api";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import Info from "@nextgisweb/icon/material/info/outline";

import type { Display } from "@nextgisweb/webmap/display";

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
}

const msgWebmap = gettext("Webmap");
const msgLayer = gettext("Layer");
const msgStyle = gettext("Style");
const msgActiveLink = gettext("Links are active only in the open web map");
const msgZoomToFeature = gettext("Click to move closer to the object");
const msgZoomToRaster = gettext("Click to move closer to the raster layer");

const zoomToFeature = (display, layerId, featureId, styles) => {
    display.featureHighlighter
        .highlightFeatureById(featureId, layerId)
        .then((feature) => {
            const visibleStyles: number[] = [];
            const itemConfig = display.getItemConfig();
            Object.keys(itemConfig).forEach(function (key) {
                if (styles.includes(itemConfig[key].styleId)) {
                    visibleStyles.push(itemConfig[key].id);
                }
            });

            display.map.zoomToFeature(feature);
            display.webmapStore.setChecked(visibleStyles);
            display.webmapStore._updateLayersVisibility(visibleStyles);
        });
};

const zoomToRasterExtent = async (display, styleId, styles) => {
    topic.publish("feature.unhighlight");

    const { extent } = await route("layer.extent", {
        id: styleId,
    }).get({ cache: true });

    display.map.zoomToNgwExtent(extent, {
        displayProjection: display.displayProjection,
    });

    const visibleStyles: number[] = [];
    const itemConfig = display.getItemConfig();
    Object.keys(itemConfig).forEach(function (key) {
        if (styles.includes(itemConfig[key].styleId)) {
            visibleStyles.push(itemConfig[key].id);
        }
    });

    display.webmapStore.setChecked(visibleStyles);
    display.webmapStore._updateLayersVisibility(visibleStyles);
};

const GetData = ({ type, item, options, lid, styleId, fid, styles, display }: GetDataProps) => {
    if (type === "vector") {
        return (
            <div
                className="link-type-active"
                title={msgZoomToFeature}
                onClick={() => {
                    zoomToFeature(display, lid, fid, styles);
                    display.imodule && display.imodule.popup_destroy();
                }}>
                <Space direction="horizontal" style={{ display: "flex", alignItems: "flex-start" }}>
                    <SvgIcon icon={`rescls-vector_layer`} />{domToReact(item.children, options)}
                </Space>
            </div >
        );
    } else if (type === "raster") {
        return (
            <div
                className="link-type-active"
                title={msgZoomToRaster}
                onClick={() => {
                    zoomToRasterExtent(display, styleId, styles);
                    display.imodule && display.imodule.popup_destroy();
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
        const styleId = urlParams.get("styleId");
        const styles = urlParams.get("styles");
        const type = urlParams.get("type");

        if (request !== "feature") { return; }
        if (display) {
            const styles_ = Array.from(styles.split(","), Number)
            return <GetData type={type} item={item} options={options} lid={lid} fid={fid} styleId={styleId} styles={styles_} display={display} />
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