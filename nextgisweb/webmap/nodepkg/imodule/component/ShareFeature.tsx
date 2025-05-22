import { routeURL } from "@nextgisweb/pyramid/api";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, Input, Space, Typography } from "@nextgisweb/gui/antd";
import { getPermalink } from "@nextgisweb/webmap/utils/permalink";
import Copy from "@nextgisweb/icon/mdi/content-copy";

import "./ShareFeature.less"

import type { ContentProps } from "../type";

const { TextArea } = Input;
const { Link, Text } = Typography;

export const ShareFeature = observer((props) => {
    
    const { display, store } = props as ContentProps
    console.log(store.contextUrl);
    console.log(routeURL("webmap.display", display.config.webmapId));
    // console.log(display);

    const handleClick = () => {
        display.getVisibleItems().then((visibleItems) => {
            const permalink = getPermalink({ display, visibleItems });
            window.history.pushState({}, "", decodeURIComponent(permalink));
        });
    }

    return (<>
    <Space direction="vertical">
        <Space>{gettext("Ссылка на объект:")}<Link href={store.contextUrl} target="_self">{gettext("перейти")}</Link></Space>
        <Text
            code
            className="context-url"
            editable
            copyable={{ text: store.contextUrl }}>
            {store.contextUrl}
        </Text>
    </Space>


        {/* <TextArea style={{ wordBreak: "break-all", overflow: "hidden" }} rows={3} value={store.contextUrl} />
        <Button
            type="text"
            icon={<Copy />}
            title={gettext("copy url")}
            className="link-button"
            onClick={handleClick}
            onContextMenu={handleClick}
        /> */}
    </>)
});
