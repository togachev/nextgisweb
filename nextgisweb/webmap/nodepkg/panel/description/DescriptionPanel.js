import { useEffect, useMemo, useRef } from "react";
import parse, { Element, domToReact } from 'html-react-parser';
import { CloseButton } from "../header/CloseButton";
import { Image } from "@nextgisweb/gui/antd";

import "./DescriptionPanel.less";

const zoomToFeature = (display, resourceId, featureId) => {
    display.featureHighlighter
        .highlightFeatureById(featureId, resourceId)
        .then((feature) => {
            display.map.zoomToFeature(feature);
        });
};

export function DescriptionPanel({ display, close, content, upath_info }) {

    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name == 'img') {
                return <Image src={item.attribs.src}>item</Image>;
            }
            if (item instanceof Element && item.name == 'a' && !upath_info) {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<a onClick={
                        () => {
                            const [resId, fid] = item.attribs.href.split(":");
                            zoomToFeature(display, resId, fid);
                        }
                    }>{domToReact(item.children, options)}</a>);
                }
            }
            /*
                Если открыты свойства ресурса, ссылка на объект удаляется, остается заголовок.
                Можно оставить ссылку, и добавить переход к объекту в таблице ресурса или к объекту на карте.
            */ 
            if (item instanceof Element && item.name == 'a' && upath_info) {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<>{domToReact(item.children, options)}</>);
                }
            }
        }
    };
    const data = parse(
        content === undefined
        ? display.config.webmapDescription
        : content, options);

    return (
        <div className="ngw-webmap-description-panel">
            <CloseButton {...{ close }} />
            {data}
        </div>
    )
}
