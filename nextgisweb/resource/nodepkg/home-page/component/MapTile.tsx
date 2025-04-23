import { useEffect, useRef, useState } from "react";
import { Card, ConfigProvider, Empty, Typography } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Cogs from "@nextgisweb/icon/mdi/cogs";
import Info from "@nextgisweb/icon/material/info";
import { DescComponent } from "@nextgisweb/resource/description";
import { ModalComponent } from ".";
import MapIcon from "@nextgisweb/icon/material/map";
import "./MapTile.less";

const openMap = gettext("Open map");
const descTitle = gettext("Map description");
const settingsTitle = gettext("Map settings");

const { Meta } = Card;
const { Text, Link } = Typography;

export const MapTile = (props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [descValue, setDescValue] = useState(null);
    const [perm, setPerm] = useState();
    const { id, display_name, preview_fileobj_id, description_status } = props.item;
    const { upath_info } = props.config;
    const { store } = props;

    const preview = routeURL("resource.preview", id);
    const urlWebmap = routeURL("webmap.display", id);
    const descRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        store.getPermission(id)
            .then(value => {
                setPerm(value);
            })
    }, [id])

    const urlWebmapSettings = routeURL("resource.update", id);

    const showDescription = async () => {
        const value = await route("resource.item", id).get({
            cache: true,
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
            <div ref={descRef}>
                <Card
                    hoverable
                    cover={
                        <>
                            <Link className="link-map" href={urlWebmap} target="_blank">
                                {
                                    preview_fileobj_id ?
                                        (<div className="img_preview"
                                            style={{
                                                background: `url(${preview}) center center / cover no-repeat`,
                                            }}
                                        ></div>) :
                                        (<div className="empty-block"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>)
                                }
                            </Link>
                        </>
                    }
                >
                    <Meta
                        className="meta-card"
                        style={{
                            fontWeight: 500,
                        }}
                        title={
                            <span title={display_name} className="grid-card-meta-title">
                                {display_name}
                            </span>
                        }
                        description={
                            <>
                                <Link href={urlWebmap} target="_blank">
                                    <Text className="open-map">{openMap}</Text>
                                    <span className="icon-open-map"><MapIcon /></span>
                                </Link>
                                {perm && perm.resource.update === true && (
                                    <Link className="settings-a" href={urlWebmapSettings} target="_blank">
                                        <span title={settingsTitle} className="icon-info-map"><Cogs /></span>
                                    </Link>
                                )}
                                {description_status === true && (
                                    <span title={descTitle} className="icon-info-map" onClick={showDescription}>
                                        <Info />
                                    </span>
                                )}
                            </>
                        }
                    />
                </Card>
                <ModalComponent title={display_name} form={contentDesc} open={isModalOpen} handleCancel={handleCancel} />
            </div>
        </ConfigProvider>
    )
}