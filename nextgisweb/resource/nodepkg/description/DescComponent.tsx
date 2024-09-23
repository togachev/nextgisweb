import parse, { Element, domToReact } from "html-react-parser";
import { useMemo, useRef } from "react";
import { PanelHeader } from "@nextgisweb/webmap/panel/header";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Image } from "@nextgisweb/gui/antd";
import { observer } from "mobx-react-lite";
import { SvgIconLink } from "@nextgisweb/gui/svg-icon";

import "./DescComponent.less";
const title = gettext("Description");
const msgLayer = gettext("Layer description");
const msgStyle = gettext("Style description");

const zoomToFeature = (display, resourceId, featureId) => {
    display.featureHighlighter
        .highlightFeatureById(featureId, resourceId)
        .then((feature) => {
            display.map.zoomToFeature(feature);
        });
};

export const DescComponent = observer((props) => {
    const { display, content, type, close } = props;
    const previewRef = useRef<HTMLDivElement>(null);

    const DescComp = ({ content }) => {
        return (
            <>{
                content?.map((item, index) => {
                    const title = item.type === "layer" ? msgLayer : msgStyle;
                    return (
                        <div key={index} className="item-description">
                            <span className="title-desc">
                                {item.permissions ?
                                    (<SvgIconLink
                                        className="desc-link"
                                        href={item.url}
                                        icon={`rescls-${item.cls}`}
                                        fill="currentColor"
                                        target="_blank"
                                    >
                                        <span className="label-desc">{title}</span>
                                    </SvgIconLink>)
                                    : (<span className="label-desc-no">{title}</span>)
                                }
                            </span>
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
            return (<span className="img-style">
                <span className="img-item-home">
                    <Image src={item.attribs.src}>item</Image>
                </span>
            </span>);
        }

        if (item instanceof Element && item.attribs && item.name === "img" && type !== "home_page") {
            return (<span className="img-style">
                <span className="img-item">
                    <Image src={item.attribs.src}>item</Image>
                </span>
            </span>);
        }

        if (item instanceof Element && item.attribs && item.name === "p") {
            return <span className="p-padding">{domToReact(item.children, options)}</span>;
        }

        if (display === undefined) {
            if (item instanceof Element && item.name === "a") {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<span className="label-delete-link">{domToReact(item.children, options)}</span>);
                }
            }
        }
        if (display) {
            if (item instanceof Element && item.name === "a") {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<a onClick={
                        () => {
                            const [resId, fid] = item.attribs.href.split(":");
                            zoomToFeature(display, resId, fid);
                        }
                    }>{domToReact(item.children, options)}</a>);
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
        {data_}
    </div>
)
});
