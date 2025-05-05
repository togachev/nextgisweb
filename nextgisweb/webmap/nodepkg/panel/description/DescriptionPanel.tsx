import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
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

        return (
            <PanelContainer
                title={store.title}
                close={store.close}
                components={{
                    content: PanelContainer.Unpadded,
                    epilog: PanelContainer.Unpadded,
                }}
            >
                {desc && <DescComponent display={display} content={desc} />}
            </PanelContainer>
        );
    }
);

DescriptionPanel.displayName = "DescriptionPanel";
export default DescriptionPanel;
