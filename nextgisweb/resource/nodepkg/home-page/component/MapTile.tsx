import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Button, Card, ConfigProvider, Empty, Typography } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Cogs from "@nextgisweb/icon/mdi/cogs";
import Info from "@nextgisweb/icon/material/info";
import { DescComponent } from "@nextgisweb/resource/description";
import { ModalComponent } from ".";
import MapIcon from "@nextgisweb/icon/material/map";
import OpenInNew from "@nextgisweb/icon/mdi/open-in-new";
import DisabledVisible from "@nextgisweb/icon/material/disabled_visible";
import "./MapTile.less";

const openMap = gettext("Open map");
const descTitle = gettext("Map description");
const settingsTitle = gettext("Map settings");
const settingsWebMapsGroup = gettext("Setting up a web map in a group");

const { Meta } = Card;
const { Text, Link } = Typography;

export const MapTile = observer((props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [descValue, setDescValue] = useState(null);

    const { id, display_name, preview_fileobj_id, description_status, update, enabled, webmap_group_id } = props.item;
    const { store, size } = props;
    const { upath_info } = store.config;

    const preview = routeURL("maptile.preview", id);
    const urlWebmap = routeURL("webmap.display", id);

    const urlWebmapSettings = routeURL("resource.update", id);

    const showDescription = async () => {
        const value = await route("resource.item", id).get({
            cache: true,
            query: {
                serialization: "resource",
            },
        });
        setDescValue(value.resource.description)
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const contentDesc = (
        <DescComponent type="home_page" upath_info={upath_info} content={descValue} />
    )

    const TitleMap = ({ className }) => (
        <div title={display_name} className={className + " grid-card-meta-title grid-card-meta-title-min"} >
            {display_name}
        </div >
    )

    return (
        <ConfigProvider
            theme={{
                components: {
                    Card: {
                        paddingLG: 0,
                        colorBorderSecondary: "none"
                    },
                    Empty: {
                        marginXL: 0,
                    }
                },
            }}
        >
            <Card
                styles={{ cover: { height: size.cardCoverH }, body: { height: size.cardBodyH } }}
                hoverable
                cover={
                    preview_fileobj_id ?
                        <Link title={display_name} className="link-map" href={urlWebmap} target="_blank">
                            <div className="img_preview"
                                style={
                                    !size.min ?
                                        { background: `url(${preview}) center center / cover no-repeat` } :
                                        {
                                            background: `linear-gradient(to right, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${preview}) center center / cover no-repeat`
                                        }
                                }
                            >
                                {size.min && <TitleMap />}
                            </div>
                        </Link> :
                        <Link title={display_name} className="link-map" href={urlWebmap} target="_blank">
                            {size.min ? <TitleMap /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                        </Link>
                }
            >
                <Meta
                    className="meta-card"
                    title={
                        <div className="title-map">
                            <span style={!enabled ? { color: "var(--danger)" } : {color: "default"}} title={display_name} className="title">
                                <div className="content-title">
                                    {!size.min && display_name}
                                </div>
                                <span className="icon-disable" title={gettext("Disabled webmap")}>
                                    {!store.edit && !enabled ? <DisabledVisible /> : store.edit && update &&
                                        <Button
                                            title={settingsWebMapsGroup}
                                            className="button-update"
                                            href={routeURL("resource.update_mapgroup", webmap_group_id, "map")}
                                            icon={<OpenInNew />}
                                            target="_blank"
                                            type="text"
                                            color={!enabled ? "danger" : "default"}
                                            variant="link"
                                        />
                                    }
                                </span>
                            </span>
                            <div className={size.min ? "button-min control-button" : "control-button"} >
                                <Button
                                    href={urlWebmap}
                                    target="_blank"
                                    type="text"
                                    icon={<MapIcon />}
                                >
                                    {!size.min && <Text >{openMap}</Text>}
                                </Button>
                                {update && (
                                    <Button
                                        title={settingsTitle}
                                        href={urlWebmapSettings}
                                        target="_blank"
                                        type="text"
                                        icon={<Cogs />}
                                    />
                                )}
                                {description_status === true && (
                                    <Button
                                        title={descTitle}
                                        onClick={showDescription}
                                        type="text"
                                        icon={<Info />}
                                    />)}
                            </div>
                        </div>
                    }
                />
            </Card>
            <ModalComponent title={display_name} form={contentDesc} open={isModalOpen} handleCancel={handleCancel} />
        </ConfigProvider >
    )
})