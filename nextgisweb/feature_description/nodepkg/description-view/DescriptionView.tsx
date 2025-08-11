import { gettext } from "@nextgisweb/pyramid/i18n";
import { PanelSection } from "@nextgisweb/webmap/panel/component";
import type { IdentifyExtensionComponentProps } from "@nextgisweb/webmap/panel/identify/identification";

import DescriptionIcon from "@nextgisweb/icon/material/description/outline";
import { DescComponent } from "@nextgisweb/resource/description";

const DescriptionView = ({ display, featureItem }: IdentifyExtensionComponentProps) => {
    if (!featureItem.extensions || !featureItem.extensions["description"]) {
        return null;
    }

    const description = featureItem.extensions["description"];

    return (
        <PanelSection icon={<DescriptionIcon />} title={gettext("Description")}>
            <DescComponent display={display} content={description} />
        </PanelSection>
    );
};

DescriptionView.displayName = "DescriptionEditor";

export default DescriptionView;
