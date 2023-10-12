import React, { useEffect, useState, useMemo, useRef } from "react";
import { SearchOutlined } from '@ant-design/icons';
import debounce from "lodash/debounce";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { Input, AutoComplete, Empty, Menu, Typography, Card, FloatButton, Tooltip, ConfigProvider, } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import i18n from "@nextgisweb/pyramid/i18n";
import { Header } from "./header";
import { Footer } from "./footer";

import { useAbortController } from "@nextgisweb/pyramid/hook/useAbortController";

import './content.less';

import MapIcon from "@nextgisweb/icon/material/map";

const openMap = gettext("открыть карту");

const { Meta } = Card;
const { Text, Link } = Typography;

const MapTile = (props) => {
    const { id, display_name, preview_fileobj_id } = props.item;
    const preview = routeURL('resource.preview', id)

    return (
        <Card
            style={{
                width: 300,
                margin: 20,
                height: 320
            }}
            hoverable
            cover={preview_fileobj_id ?
                <Link style={{ padding: 0, display: 'contents' }} href={routeURL('webmap.display', id)} target="_blank">
                    <div className="img_preview"
                        style={{ background: `url(${preview}) center center / cover no-repeat` }}
                    ></div>
                </Link>
                :
                <Link style={{ padding: 0, display: 'contents' }} href={routeURL('webmap.display', id)} target="_blank">
                    <div className="img_preview_none">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                </Link>
            }
        >
            <Meta
                style={{
                    fontWeight: 500,
                    height: 125
                }}
                title={
                    <Tooltip placement="top" title={display_name} >
                        {display_name}
                    </Tooltip>
                }

                description={
                    <Link href={routeURL('webmap.display', id)} target="_blank">
                        <Text className="open-map" underline>{openMap}</Text>
                        <span className="icon-open-map"><MapIcon /></span>
                    </Link>
                }
            />
        </Card>
    )
}

const resourcesToOptions = (resourcesInfo) => {
    return resourcesInfo.map((resInfo) => {
        const { resource } = resInfo;
        const resourceUrl = routeURL("resource.show", {
            id: resource.id,
        });

        return {
            value: `${resource.display_name}`,
            key: `${resource.id}`,
            url: resourceUrl + '/display',
            target: '_self',
            label: (
                <div
                    className="item"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                    }}
                >
                    <svg className="icon">
                        <use xlinkHref={`#icon-rescls-${resource.cls}`} />
                    </svg>
                    <span className="title" title={resource.display_name}>
                        {resource.display_name}
                    </span>
                </div>
            ),
        };
    });
};

export const Content = ({ onChanges, ...rest }) => {

    const [listMaps, setListMaps] = useState([]); // список карт
    const [groupMaps, setGroupMaps] = useState([]); // группы карт
    const [itemsMaps, setItemsMaps] = useState([]); // вывод карт при выборе конкретной группы

    const [itemsSearch, setItemsSearch] = useState([]);

    const { makeSignal, abort } = useAbortController();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [acStatus, setAcSatus] = useState("");

    const makeQuery = useMemo(() => {
        if (search && search.length > 2) {
            const q = "";
            if (search) {
                console.log(search);
                const query = {
                    display_name__ilike: `%${search}%`, cls: 'webmap'
                };
                return query;
            }
            return q;
        }
        return null;
    }, [search]);

    const makeSearchRequest = useRef(
        async ({ query: q }) => {
            try {
                abort();
                const resources = await route("resource.search").get({ query: q, signal: makeSignal() })
                const options = resourcesToOptions(resources);
                console.log(options);
                setOptions(options);
                setAcSatus("");
            } catch (er) {
                setAcSatus("error");
            }
        }
    );

    useEffect(() => {
        if (makeQuery) {
            makeSearchRequest.current({ query: makeQuery });
        } else {
            setOptions([]);
        }
    }, [makeQuery]);

    const onSelect = (v, opt) => {
        if (onChanges) {
            onChanges(v, opt);
        }
    };

    const onClickGroupMaps = (e) => {
        setItemsSearch([])
        setItemsMaps(listMaps.filter(item => item.webmap_group_id === parseInt(e.key)))
    }

    useMemo(() => {
        (async () => {
            try {
                const maplist = await route('resource.maplist').get(); // список карт
                setListMaps(maplist.result);

                const data = [...new Map(maplist.result.map(item =>
                    [item.webmap_group_id, item])).values()]; // группы карт

                let items = []
                data.map((item) => {
                    items.push({ key: item.webmap_group_id, label: <Tooltip placement="topLeft" title={item.webmap_group_name}>{item.webmap_group_name}</Tooltip> });
                    items.push({ type: 'divider' });
                })

                setItemsMaps(maplist.result.filter(item => item.webmap_group_id === parseInt(items[0].key)))
                setGroupMaps(items);

            } catch {
                // ignore error
            }
        })();
    }, [])

    return (
        <>
            <ConfigProvider
                theme={{
                    token: {
                        controlItemBgActive: '#2a398c0d',
                        fontFamily: 'Montserrat',
                    },
                }}
            >
                <Header />
                <div className="main">
                    <div className="content">
                        <div className="search-block">
                            <AutoComplete
                                popupClassName="webgis-map-filter-dropdown"
                                // popupMatchSelectWidth={290}
                                style={{ width: "100%" }}
                                onSelect={onSelect}
                                options={options}
                                status={acStatus}
                                {...rest}
                            >
                                <Input
                                    prefix={<SearchOutlined />}
                                    size="middle"
                                    placeholder={i18n.gettext("Enter card name")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    allowClear
                                />
                            </AutoComplete>
                        </div>

                        <div className="menu-maps">
                            <div className="menu-list">
                                <Menu
                                    mode="inline"
                                    theme="light"
                                    items={groupMaps}
                                    onClick={onClickGroupMaps}
                                    defaultOpenKeys={['sub1']}
                                />
                            </div>
                            <div className="content-maps-grid">
                                <div className="content_group">
                                    {itemsMaps.map((item, index) => {
                                        return (
                                            <MapTile key={index} item={item} />
                                        )
                                    })}
                                    {itemsSearch.map((item, index) => {
                                        return (
                                            <MapTile key={index} item={item} />
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <FloatButton.BackTop />
                </div>
                <Footer />
            </ConfigProvider>
        </>

    )
}