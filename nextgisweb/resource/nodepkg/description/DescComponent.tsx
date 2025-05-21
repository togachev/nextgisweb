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

const msgWebmap = gettext("Webmap");
const msgLayer = gettext("Layer");
const msgStyle = gettext("Style");
const msgActiveLink = gettext("Links are active only in the open web map");
const msgZoomToFeature = gettext("Tap to move closer to the object");
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

const destroyPopup = (display) => {
    display.imodule._visible({ hidden: true, overlay: undefined, key: "popup" });
    display.imodule.iStore.setFullscreen(false)
    display.imodule.iStore.setValueRnd({ ...display.imodule.iStore.valueRnd, x: -9999, y: -9999 });
}

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

interface GetDataProps {
    type: string;
    item: Element;
    options: HTMLReactParserOptions;
    layerId: number | string;
    styleId?: number;
    fid?: number | string;
    styles: number[];
    display: Display;
}

const GetData = ({ type, item, options, layerId, styleId, fid, styles, display }: GetDataProps) => {
    const { data: data } = useRouteGet("resource.permission", { id: layerId }, { cache: true });

    if (type === "v") {
        if (data?.data.read) {
            return (
                <div
                    className="link-type-active"
                    title={msgZoomToFeature}
                    onClick={() => {
                        zoomToFeature(display, layerId, fid, styles)
                        display.imodule && display.imodule.iStore && destroyPopup(display);
                    }}>
                    <Space direction="horizontal"><SvgIcon icon={`rescls-vector_layer`} />{domToReact(item.children, options)}</Space>
                </div>
            );
        } else {
            return <></>;
        }
    } else if (type === "r") {
        if (data?.data.read) {
            return (
                <div
                    className="link-type-active"
                    title={msgZoomToRaster}
                    onClick={() => {
                        zoomToRasterExtent(display, styleId, styles);
                        display.imodule && display.imodule.iStore && destroyPopup(display);
                    }}
                >
                    <Space direction="horizontal"><SvgIcon icon={`rescls-raster_layer`} />{domToReact(item.children, options)}</Space>
                </div>
            );
        } else {
            return <></>;
        }
    } else {
        if (!data?.data.read) {
            return <></>
        } else {
            return (<Space className="link-type" title={msgActiveLink} direction="horizontal">{domToReact(item.children, options)}<Info /></Space>);
        }
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

            if (display) {
                if (item instanceof Element && item.name === "a") {
                    if (/^[a-z]:\d+:.*$/.test(item.attribs.href)) {
                        const [type, layerId, val, styles] = item.attribs.href.split(":");
                        const styles_ = Array.from(styles.split(","), Number)
                        return <GetData type={type} item={item} options={options} layerId={layerId} fid={val} styleId={val} styles={styles_} display={display} />
                    }
                }
            } else if (display === undefined) {
                if (item instanceof Element && item.name === "a") {
                    if (/^[a-z]:\d+:.*$/.test(item.attribs.href)) {
                        const array = item.attribs.href.split(":");
                        return <GetData item={item} options={options} layerId={array[1]} />
                    }
                }
            }
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