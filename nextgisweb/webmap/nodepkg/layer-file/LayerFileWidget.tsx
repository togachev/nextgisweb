import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Button } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type {
    EditorWidgetComponent,
    EditorWidgetProps,
} from "@nextgisweb/resource/type";

import type { LayerFileStore } from "./LayerFileStore";

import "./LayerFileWidget.less";

export const LayerFileWidget: EditorWidgetComponent<
    EditorWidgetProps<LayerFileStore>
> = observer(({ store }) => {

    useEffect(() => {
        store.layer_file !== null &&
            alert(store.layer_file);
    }, [store.layer_file])

    return (
        <div className="ngw-layer-file-widget">
            <Button
                onClick={() => {
                    store.update({ layer_file: "value" });
                }}
            >
                onClick button console log value
            </Button>
        </div>
    );
});

LayerFileWidget.title = gettext("LayerFile");
LayerFileWidget.order = 40;
