import { observer } from "mobx-react-lite";
import type { MapBrowserEvent } from "ol";
import Interaction from "ol/interaction/Interaction";
import { useEffect, useMemo } from "react";

import { useDisplayContext } from "@nextgisweb/webmap/display/context";
import type { ControlProps } from "./MapControl";
import { useToggleGroupItem } from "./toggle-group/useToggleGroupItem";

import { isMobile as isM } from "@nextgisweb/webmap/mobile/selectors";
import topic from "@nextgisweb/webmap/compat/topic";

type PopupStoreControlProps = ControlProps<{
    label?: string;
    groupId?: string;
    isDefaultGroupId?: boolean;
}>;

const PopupStoreControl = observer(
    ({
        groupId,
        isDefaultGroupId = false,
    }: PopupStoreControlProps) => {
        const { display } = useDisplayContext();
        const { isActive, makeDefault } = useToggleGroupItem(groupId);

        useEffect(() => {
            if (isDefaultGroupId) {
                makeDefault();
            }
        }, [isDefaultGroupId, makeDefault]);

        const interaction = useMemo(() => {
            const handleEvent = (e: MapBrowserEvent<any>) => {
                if (e.type === "click" && !isM) {
                    if (display.panelManager.getActivePanelName() !== "custom-layer") {
                        display.popupStore.overlayInfo(e, { type: "click" });
                        display.popupStore.setMode("click");
                        e.preventDefault?.();
                    } else {
                        topic.publish("feature.unhighlight");
                    }
                } else if (e.type === "contextmenu") {
                    display.popupStore.overlayInfo(e, { type: "contextmenu" });
                    display.popupStore.setContextHidden(false);
                    e.preventDefault();
                }
                return true;
            };
            return new Interaction({ handleEvent });
        }, [display.popupStore]);

        useEffect(() => {
            if (!isActive) {
                display.popupStore.setControl(null);
                return;
            }

            display.popupStore.setControl(interaction);

            return () => {
                display.popupStore.setControl(null);
            };
        }, [isActive, interaction, display.popupStore]);

        return null;
    }
);

PopupStoreControl.displayName = "PopupStoreControl";

export default PopupStoreControl;
