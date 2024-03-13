import { ModelLogoForm } from "@nextgisweb/gui/model-logo-form";
import { gettext } from "@nextgisweb/pyramid/i18n";

// prettier-ignore
const msgHelp = gettext("We recommend height of 45 px and width of up to 200 px.");

export function LogoForm() {
    return (
        <ModelLogoForm
            component="pyramid"
            model="pyramid.csettings"
            settingName="header_logo"
            messages={{ helpText: msgHelp }}
            accept=".png"
        />
    );
}
