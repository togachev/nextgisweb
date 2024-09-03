import { gettext } from "@nextgisweb/pyramid/i18n";
import type { IdentifyExtensionComponentProps } from "@nextgisweb/webmap/panel/identification/identification";

import DescriptionIcon from "@nextgisweb/icon/material/description/outline";
import { DescComponent } from "@nextgisweb/resource/description";
import "@nextgisweb/webmap/panel/identification/PanelContentContainer.less";

const DescriptionView = ({ display, featureItem }: IdentifyExtensionComponentProps) => {
    if (!featureItem.extensions || !featureItem.extensions["description"]) {
        return null;
    }

    const description = featureItem.extensions["description"];

    return (
        <>
            <div className="panel-content-container">
                <div className="fill">
                    <h3>
                        <DescriptionIcon /> {gettext("Description")}
                    </h3>
                </div>
            </div>
            <div className="panel-content-container">
                {/* <div dangerouslySetInnerHTML={{ __html: description }} /> */}
                <DescComponent display={display} content={description} />
            </div>
        </>
    );
};

DescriptionView.displayName = "DescriptionEditor";

export default DescriptionView;
