import parse, { attributesToProps, Element, domToReact } from "html-react-parser";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Image, Divider, Space } from "@nextgisweb/gui/antd";
import OlGeomPoint from "ol/geom/Point";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import topic from "@nextgisweb/webmap/compat/topic";

import type { HighlightEvent } from "@nextgisweb/webmap/feature-highlighter/FeatureHighlighter";
import "./DescComponent.less";

const msgWebmap = gettext("Webmap");
const msgLayer = gettext("Layer");
const msgStyle = gettext("Style");

const zoomToFeature = (display, resourceId, featureId, result) => {
    display.featureHighlighter
        .highlightFeatureById(featureId, resourceId)
        .then((feature) => {
            const styles: number[] = [];
            const itemConfig = display.getItemConfig();
            Object.keys(itemConfig).forEach(function (key) {
                if (result.includes(itemConfig[key].styleId)) {
                    styles.push(itemConfig[key].id);
                }
            });

            display.map.zoomToFeature(feature);
            display.webmapStore.setChecked(styles);
            display.webmapStore._updateLayersVisibility(styles);
        });
};

const destroyPopup = (display) => {
    display.imodule._visible({ hidden: true, overlay: undefined, key: "popup" });
    display.imodule.iStore.setFullscreen(false)
    display.imodule.iStore.setValueRnd({ ...display.imodule.iStore.valueRnd, x: -9999, y: -9999 });
}

const zoomTo = (display, coords) => {
    const point = new OlGeomPoint(coords);
    display.map.zoomToExtent(point.getExtent());
    const highlightEvent: HighlightEvent = { coordinates: coords };
    topic.publish("feature.highlight", highlightEvent);
    
};

const GetData = ({ item, options, resourceId, fid, point, result, display }) => {

    const { data: data } = useRouteGet(
        "resource.permission",
        { id: resourceId },
        { cache: true }
    );

    if (fid) {
        if (data?.data.read) {
            return (<a onClick={() => {
                zoomToFeature(display, resourceId, fid, result);
                display.imodule && display.imodule.iStore && destroyPopup(display);
            }}>{domToReact(item.children, options)}</a>);
        } else {
            return <></>;
        }
    } else if (point) {
        if (data?.data.read) {
            return (<a onClick={() => {
                zoomTo(display, point.split(",").map(Number));
                display.imodule && display.imodule.iStore && destroyPopup(display);
            }}>{domToReact(item.children, options)}</a>);
        } else {
            return <></>;
        }
    } else {
        if (!data?.data.read) {
            return <></>
        } else {
            return (<>{domToReact(item.children, options)}</>);
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
                        const [type, resId, val, styles] = item.attribs.href.split(":");
                        if (type === "v") {
                            const result = Array.from(styles.split(","), Number)
                            return <GetData item={item} options={options} resourceId={resId} fid={val} result={result} display={display} />
                        } else if (type === "r") {
                            const result = Array.from(styles.split(","), Number)
                            return <GetData item={item} options={options} resourceId={resId} point={val} result={result} display={display} />
                        }
                    }
                }
            } else if (display === undefined) {
                if (item instanceof Element && item.name === "a") {
                    if (/^[a-z]:\d+:.*$/.test(item.attribs.href)) {
                        const array = item.attribs.href.split(":");
                        return <GetData item={item} options={options} resourceId={array[1]} />
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