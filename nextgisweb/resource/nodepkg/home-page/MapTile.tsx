import { useEffect, useState } from "react";
import { Card, ConfigProvider, Empty, Modal, Typography } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import MapIcon from "@nextgisweb/icon/material/map";
import Cog from "@nextgisweb/icon/mdi/cog";
import Info from "@nextgisweb/icon/material/info";
import { DescComponent } from "@nextgisweb/resource/description";
import { useSource } from "./hook/useSource";

const openMap = gettext("открыть карту");
const descTitle = gettext("Описание карты");
const settingsTitle = gettext("Настройки карты");

const { Meta } = Card;
const { Text, Link } = Typography;

export const MapTile = (props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [descValue, setDescValue] = useState(null);
    const [perm, setPerm] = useState();
    const { id, display_name, preview_fileobj_id, description_status } = props.item;
    const { type, upath_info } = props.config;
    const { getPermission } = useSource();
    const preview = routeURL("resource.preview", id);
    const urlWebmap = routeURL("webmap.display", id);

    useEffect(() => {
        getPermission(id)
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
                                    <span title={settingsTitle} className="icon-info-map"><Cog /></span>
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
            <Modal
                width="max-content"
                className="modal-desc-home-page"
                centered
                title={display_name}
                footer={null}
                open={isModalOpen}
                onCancel={handleCancel}>
                <DescComponent type={type} upath_info={upath_info} content={descValue} />
            </Modal>
        </ConfigProvider>
    )
}


