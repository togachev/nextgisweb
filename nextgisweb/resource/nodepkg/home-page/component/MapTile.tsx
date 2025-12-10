import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Button, Card, ConfigProvider, Empty, Typography } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Info from "@nextgisweb/icon/material/info";
import { DescComponent } from "@nextgisweb/resource/description";
import { ModalComponent } from ".";
import { ButtonSetting } from ".";
import MapIcon from "@nextgisweb/icon/material/map";
import "./MapTile.less";

const openMap = gettext("Open map");
const descTitle = gettext("Map description");

const { Meta } = Card;
const { Text, Link } = Typography;

export const MapTile = observer((props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [descValue, setDescValue] = useState(null);

    const { webmap_id, display_name, preview_fileobj_id, description_status, enabled } = props.item;

    const { store, size } = props;
    const { upath_info } = store.config;

    const preview = routeURL("maptile.preview", { id: webmap_id });
    const urlWebmap = routeURL("webmap.display", { id: webmap_id });

    const showDescription = async () => {
        const value = await route("resource.item", { id: webmap_id }).get({
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

    const TitleMap = () => (
        <div title={display_name} className="grid-card-meta-title grid-card-meta-title-min" >
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
                            <span title={display_name} className="title">
                                <div className="content-title" style={enabled === false ? { color: "var(--danger)" } : { color: "var(--text-base)" }}>
                                    {!size.min && display_name}
                                </div>
                            </span>
                            <div className={size.min ? "button-min control-button" : "control-button"} >
                                <div className="block">
                                    <Button
                                        size="small"
                                        href={urlWebmap}
                                        target="_blank"
                                        type="text"
                                        icon={<MapIcon />}
                                    >
                                        {!size.min && <Text >{openMap}</Text>}
                                    </Button>
                                    <div className="edit-block">
                                        {store.manage && (
                                            <ButtonSetting iconKey="map_edit" type="webmap" store={store} id={webmap_id} operation="update" mapprops={props.item}/>
                                        )}
                                        {description_status === true && (
                                            <Button
                                                size="small"
                                                title={descTitle}
                                                onClick={showDescription}
                                                type="text"
                                                icon={<Info />}
                                            />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />
            </Card>
            <ModalComponent title={display_name} form={contentDesc} open={isModalOpen} handleCancel={handleCancel} />
        </ConfigProvider >
    )
})