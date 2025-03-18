import parse, { attributesToProps, Element, domToReact } from "html-react-parser";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Image, Divider } from "@nextgisweb/gui/antd";

import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";

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

export const DescComponent = (props) => {
    const { display, content, type } = props;

    const DescComp = ({ content }) => {
        return (
            <>{
                content?.map((item, index) => {
                    const title = item.type === "webmap_desc" ? msgWebmap : item.type === "layer" ? msgLayer : msgStyle;
                    return (
                        <span key={index}>
                            {content.length > 1 && (
                                <Divider style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }} orientationMargin={0} orientation="right" plain>{title}</Divider>
                            )}
                            {parse(item.description, options)}
                        </span >
                    )
                })
            }</>
        )
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

            // if (item instanceof Element && item.attribs && item.name === "p") {
            //     return <span {...props} >{domToReact(item.children, options)}</span>;
            // }

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
    else if (content.content instanceof Array && content.type === "map") {
        console.log(type);

        data_ = (<DescComp content={content.content} />)
    }
    else {
        data_ = parse(content, options)
    }

    return (
        <div className="desc-component">
            <div className="ck-content">{data_}</div>
        </div>
    )
};