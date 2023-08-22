import Base from "antd/es/config-provider";
import { antd } from "@nextgisweb/jsrealm/locale-loader!";

import type { ParamsOf } from "../../type";

type Props = ParamsOf<typeof Base>;

const computed = window.getComputedStyle(document.body);
const cvar = (name: string): string => computed.getPropertyValue("--" + name);

const token: Props["theme"]["token"] = {
    borderRadius: 4,
    colorError: cvar("error"),
    colorInfo: cvar("primary"),
    colorPrimary: cvar("primary"),
    colorSuccess: cvar("success"),
    colorWarning: cvar("warning"),
    motion: false,
};

const components: Props["theme"]["components"] = {
    Modal: { titleFontSize: 20 },
};

const defaults: Props = {
    locale: antd,
    theme: { token, components },
};

export default function ConfigProvider(props: Props) {
    return <Base {...defaults} {...props} />;
}
