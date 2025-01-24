import parse, { attributesToProps, Element, domToReact } from "html-react-parser";
import { PanelHeader } from "@nextgisweb/webmap/panel/header";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Divider } from "@nextgisweb/gui/antd";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import type { WebmapItemConfig } from "@nextgisweb/webmap/type";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";

import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";
import ZoomOut from "@nextgisweb/icon/material/zoom_out/outline";
import RotateRight from "@nextgisweb/icon/material/rotate_right/outline";
import RotateLeft from "@nextgisweb/icon/material/rotate_left/outline";

import "./DescComponent.less";
import "./react-photo-view.less";

const title = gettext("Description");
const msgLayer = gettext("Layer description");
const msgStyle = gettext("Style description");

const zoomToFeature = (display, resourceId, featureId, result) => {
    display.featureHighlighter
        .highlightFeatureById(featureId, resourceId)
        .then((feature) => {
            const styles: number[] = [];
            const itemConfig: WebmapItemConfig = display.getItemConfig();
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


const GetData = ({ item, options, resourceId, fid, result, display }) => {
    const { data: data } = useRouteGet("resource.permission", { id: resourceId }, { cache: true });
    if (fid) {
        if (data?.data.read) {
            return (<a onClick={() => { zoomToFeature(display, resourceId, fid, result); }}>{domToReact(item.children, options)}</a>);
        } else {
            return <></>;
        }
    } else {
        if (!data?.data.read) {
            return <></>
        } else {
            return (<span>{domToReact(item.children, options)}</span>);
        }
    }
}

const Image = (props) => (
    <PhotoProvider maskOpacity={0.5}
        toolbarRender={({ onScale, scale, rotate, onRotate }) => {
            return (
                <>
                    <span className="icon-desc-symbol" onClick={() => onRotate(rotate + 90)}><RotateRight /></span>
                    <span className="icon-desc-symbol" onClick={() => onRotate(rotate - 90)}><RotateLeft /></span>
                    <span className="icon-desc-symbol" onClick={() => onScale(scale + 1)}><ZoomIn /></span>
                    <span className={scale > 1 ? "icon-desc-symbol" : "icon-desc-disabled"} onClick={() => onScale(scale - 1)}><ZoomOut /></span>
                </>
            );
        }}
    >
        <PhotoView src={props.src}>
            <img src={props.src} style={{ objectFit: "cover", cursor: "pointer" }} alt="" />
        </PhotoView>
    </PhotoProvider>
)

export const DescComponent = (props) => {
    const { display, content, type, close } = props;

    const DescComp = ({ content }) => {
        return (
            <>{
                content?.map((item, index) => {
                    const title = item.type === "layer" ? msgLayer : msgStyle;
                    return (
                        <div key={index}>
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
            const props = attributesToProps(item.attribs);
            const types = ["map", undefined, "home_page"];

            if (item instanceof Element && item.attribs && item.name === "img" && props.width > webmapSettings.popup_width && type === "feature") {
                return (<Image {...props} />);
            }

            if (item instanceof Element && item.attribs && item.name === "img" && props.width > 350 && types.includes(type)) {
                return (<Image {...props} />);
            }

            if (item instanceof Element && item.attribs && item.name === "p") {
                return <div {...props} >{domToReact(item.children, options)}</div>;
            }

            if (display === undefined) {
                if (item instanceof Element && item.name === "a") {
                    if (/^\d+:\d+:\d+.*$/.test(item.attribs.href)) {
                        const [resId] = item.attribs.href.split(":");
                        return <GetData item={item} options={options} resourceId={resId} />
                    }
                }
            }

            if (display) {
                if (item instanceof Element && item.name === "a") {
                    if (/^\d+:\d+:\d+.*$/.test(item.attribs.href)) {
                        const [resId, fid, styles] = item.attribs.href.split(":");
                        const result = Array.from(styles.split(","), Number)
                        return <GetData item={item} options={options} resourceId={resId} fid={fid} result={result} display={display} />
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
        <div className="desc-component">
            {type === "map" && (<PanelHeader {...{ title, close }} />)}
            <div className="ck-content">{data_}</div>
        </div>
    )
};