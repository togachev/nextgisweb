import { Button } from "@nextgisweb/gui/antd";

import "./LayerFile.less";

export const LayerFile = ({ newValue }) => {

    return (
        <div className="ngw-layer-file-widget">
            <Button
                onClick={() => {
                    console.log(newValue.style_parent_id);
                }}
            >
                test button react js
            </Button>
        </div>
    );
};
