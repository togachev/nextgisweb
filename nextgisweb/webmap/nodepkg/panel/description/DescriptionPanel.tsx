import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { DescriptionHtml } from "@nextgisweb/gui/description";
import type { Display } from "@nextgisweb/webmap/display";

import { PanelContainer } from "../component";
import type { PanelPluginWidgetProps } from "../registry";
import { DescComponent } from "@nextgisweb/resource/description";
import type DescriptionStore from "./DescriptionStore";

import "./DescriptionPanel.less";

interface DescProps {
    description?: string;
    type?: string;
}

interface ContentProps {
    content?: DescProps[] | [];
    type?: string;
}

const loadDescripton = async (id) => {
    const value = await route("resource.item", {
        id: id,
    }).get({
        cache: true,
        query: {
            description: true,
            serialization: "resource",
        }
    });
    return value?.resource?.description
}

const DescriptionPanel = observer<PanelPluginWidgetProps<DescriptionStore>>(
    ({ store, display }) => {
        const [desc, setDesc] = useState<ContentProps>();

        const content = store.content;
        useEffect(() => {
            loadDescripton(display.config.webmapId)
                .then(i => {
                    const lsw = content?.content ? content?.content : [];
                    const webmap_desc = lsw.length > 0 ?
                        [] : display.config.webmapDescription === true ?
                            [{ description: i, type: "webmap_desc", }] : []
                    const union = [...Array.from(
                        new Set([
                            ...lsw,
                            ...webmap_desc
                        ])
                    )]
                    setDesc({
                        content: union,
                        type: "map"
                    });
                })
        }, [store.content]);

        const handleOnLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            const href = e?.currentTarget.getAttribute("href");
            e?.currentTarget.setAttribute("target", "_blank");

            if (href && /^\d+:\d+$/.test(href)) {
                e.preventDefault();
                e.stopPropagation();
                const [resourceId, featureId] = href.split(":");
                zoomToFeature(display, Number(resourceId), Number(featureId));
                return true;
            }
            return false;
        };

        return (
            <PanelContainer
                title={store.title}
                close={store.close}
                components={{
                    content: PanelContainer.Unpadded,
                    epilog: PanelContainer.Unpadded,
                }}
            >
                { desc && <DescComponent display={display} content={desc} /> }
                {/* <DescriptionHtml
                    className="content"
                    variant="compact"
                    content={content ?? ""}
                    elementRef={nodeRef}
                    onLinkClick={handleOnLinkClick}
                /> */}
            </PanelContainer >
        );
    }
);

DescriptionPanel.displayName = "DescriptionPanel";
export default DescriptionPanel;
