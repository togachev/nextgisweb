import parse, { attributesToProps, Element, domToReact } from "html-react-parser";
import { useRef } from "react";
import { PanelHeader } from "@nextgisweb/webmap/panel/header";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Divider, Image } from "@nextgisweb/gui/antd";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import type { WebmapItemConfig } from "@nextgisweb/webmap/type";

import "./DescComponent.less";
const title = gettext("Description");
const msgLayer = gettext("Layer description");
const msgStyle = gettext("Style description");

const zoomToFeature = (display, resourceId, featureId, result) => {
    display.featureHighlighter
        .highlightFeatureById(featureId, resourceId)
        .then((feature) => {
            const styles: number[] = [];
            const itemConfig: WebmapItemConfig = display.getItemConfig();
            Object.keys(itemConfig).forEach(function (key, index) {
                if (result.includes(itemConfig[key].styleId)) {
                    styles.push(itemConfig[key].id);
                }
            });

            display.map.zoomToFeature(feature);
            display.webmapStore.setChecked(styles);
            display.webmapStore._updateLayersVisibility(styles);
        });
};

export const DescComponent = (props) => {
    const { display, content, type, close } = props;
    const previewRef = useRef<HTMLDivElement>(null);
    const DescComp = ({ content }) => {

        return (
            <>{
                content?.map((item, index) => {
                    const title = item.type === "layer" ? msgLayer : msgStyle;
                    return (
                        <div key={index} className="item-description">
                            {content.length > 1 && (
                                <Divider style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }} orientationMargin={0} orientation="right" plain>{title}</Divider>
                            )}
                            {parse(item.description, options)}
                        </div >
                    )
                })
            }</>
        )
    };

    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name === "img" && type === "home_page") {
                return (<Image src={item.attribs.src}>item</Image>);
            }

            if (item instanceof Element && item.attribs && item.name === "img" && type !== "home_page") {
                return (<Image src={item.attribs.src}>item</Image>);
            }

            if (item instanceof Element && item.attribs && item.name === "p") {
                const props = attributesToProps(item.attribs);
                return <div {...props} >{domToReact(item.children, options)}</div>;
            }

            if (display === undefined) {
                if (item instanceof Element && item.name === "a") {
                    if (/^\d+:\d+:\d+.*$/.test(item.attribs.href)) {
                        const [resId] = item.attribs.href.split(":");
                        const { data: data } = useRouteGet("resource.permission", { id: resId }, { cache: true });
                        if (!data?.data.read) {
                            return <></>
                        } else {
                            return (<span>{domToReact(item.children, options)}</span>);
                        }
                    }
                }
            }

            if (display) {
                if (item instanceof Element && item.name === "a") {
                    if (/^\d+:\d+:\d+.*$/.test(item.attribs.href)) {
                        const [resId, fid, styles] = item.attribs.href.split(":");
                        const result = Array.from(styles.split(','), Number)
                        const { data: data } = useRouteGet("resource.permission", { id: resId }, { cache: true });
                        if (data?.data.read) {
                            return (<a onClick={() => { zoomToFeature(display, resId, fid, result); }}>{domToReact(item.children, options)}</a>);
                        } else {
                            return <></>;
                        }
                    }
                }
            }
        }
    };
    let data_;
    if (content === undefined && type === "map") {
        data_ = parse(display.config.webmapDescription, options)
    }
    else if (content instanceof Array && type === "map") {
        data_ = (<DescComp content={content} />)
    }
    else {
        data_ = parse(content, options)
    }

    return (
        <div ref={previewRef} className="desc-component">
            {type === "map" && (<PanelHeader {...{ title, close }} />)}
            <div className="ck-content">{data_}</div>
        </div>
    )
};
