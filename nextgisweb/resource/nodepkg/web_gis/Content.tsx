import { useEffect, useState, useMemo, useRef } from "react";
import { SearchOutlined } from '@ant-design/icons';
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { Input, AutoComplete, Empty, Menu, Typography, Card, FloatButton, Tooltip, ConfigProvider, } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import i18n from "@nextgisweb/pyramid/i18n";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { GridLayout } from "./GridLayout";
import { observer } from "mobx-react-lite";
import { useAbortController } from "@nextgisweb/pyramid/hook/useAbortController";
import { WebGisStore } from "./WebGisStore";
import "./Content.less";

import MapIcon from "@nextgisweb/icon/material/map";

const openMap = gettext("открыть карту");

const { Meta } = Card;
const { Text, Link } = Typography;

const MapTile = (props) => {
    const { id, display_name, preview_fileobj_id } = props.item;
    const preview = routeURL('resource.preview', id)
    const urlWebmap = routeURL('webmap.display', id)

    return (
        <Card
            style={{
                width: 300,
                margin: 20,
                height: 320
            }}
            hoverable
            cover={preview_fileobj_id ?
                <Link style={{ padding: 0, display: 'contents' }} href={urlWebmap} target="_blank">
                    <div className="img_preview"
                        style={{ background: `url(${preview}) center center / cover no-repeat` }}
                    ></div>
                </Link>
                :
                <Link style={{ padding: 0, display: 'contents' }} href={urlWebmap} target="_blank">
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
                    <Link href={urlWebmap} target="_blank">
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
        const resourceUrl = routeURL('webmap.display', resource.id)

        return {
            key: `${resource.id}`,
            label: (
                <div
                    className="item"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        width: '100%'
                    }}
                >
                    <a
                        style={{ float: 'right', width: '100%' }}
                        href={resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <svg className="icon">
                            <use xlinkHref={`#icon-rescls-${resource.cls}`} />
                        </svg>
                        <span className="title" title={resource.display_name}>
                            {resource.display_name}
                        </span>
                    </a>
                </div>
            ),
        };
    });
};
export const Content = observer(({ onChanges, ...rest }) => {
    const [store] = useState(() => new WebGisStore({}));
    const [listMaps, setListMaps] = useState([]); // список карт
    const [groupMaps, setGroupMaps] = useState([]); // группы карт
    const [itemsMaps, setItemsMaps] = useState([]); // вывод карт при выборе конкретной группы

    const { makeSignal, abort } = useAbortController();
    const [options, setOptions] = useState([]);
    const [search, setSearch] = useState("");
    const [acStatus, setAcSatus] = useState("");

    const makeQuery = useMemo(() => {
        if (search && search.length > 2) {
            const q = "";
            if (search) {
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
        setItemsMaps(listMaps.filter(item => item.webmap_group_id === parseInt(e.key)))
        console.log(listMaps);
        
        const options = listMaps.filter(item => item.webmap_group_id === parseInt(e.key)).map((item) => {
            return {
                i: item.id + "/" + item.webmap_group_id,
                x: item.position_map_group.x,
                y: item.position_map_group.y,
                w: item.position_map_group.w,
                h: item.position_map_group.h,
                static: item.position_map_group.static,
            }
        });
        store.setlayout(options)
    }

    var firstValueSort = 'Открытые данные';

    useMemo(() => {
        (async () => {
            try {
                const maplist = await route('resource.maplist').get(); // список карт
                const maplist_action_map = maplist.result.filter(item => item.action_map === true);

                setListMaps(maplist_action_map);

                const data = [...new Map(maplist_action_map.map(item =>
                    [item.webmap_group_id, item])).values()]; // группы карт

                let items = []
                data.sort((x, y) => {
                    return x.webmap_group_name === firstValueSort ? -1 : y.webmap_group_name === firstValueSort ? 1 : 0;
                }).map((item) => {
                    items.push({ key: item.webmap_group_id, label: <Tooltip placement="topLeft" title={item.webmap_group_name}>{item.webmap_group_name}</Tooltip> });
                    items.push({ type: 'divider' });
                })
                setItemsMaps(maplist_action_map.filter(item => item.webmap_group_id === parseInt(items[0].key)));

                const options = maplist_action_map.filter(item => item.webmap_group_id === parseInt(items[0].key)).map((item) => {
                    return {
                        i: item.id + "/" + item.webmap_group_id,
                        x: item.position_map_group.x,
                        y: item.position_map_group.y,
                        w: item.position_map_group.w,
                        h: item.position_map_group.h,
                        static: item.position_map_group.static,
                    }
                });
                store.setlayout(options)
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
                                {store.layout.length > 0 && <GridLayout store={store} />}
                                {/* </div> */}
                            </div>
                        </div>
                    </div>
                    <FloatButton.BackTop />
                </div>
                <Footer />
            </ConfigProvider>
        </>

    )
});