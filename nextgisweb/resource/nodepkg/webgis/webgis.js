import React, { useState, useMemo } from "react";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import './webgis.less';
import { Empty, Select, Menu, Typography, Card, FloatButton, Tooltip, Button } from "@nextgisweb/gui/antd";
import { SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import { gettext } from "@nextgisweb/pyramid/i18n";
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
                <div className="img_preview"

                    style={{ background: `url(${preview}) center center / cover no-repeat` }}
                ></div>
                :
                <div className="img_preview_none">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
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


export const Content = () => {
    const [mapsSearch, setMapsSearch] = useState(); // выбрана карта при поиске
    const [loading, setLoading] = useState(true);

    const [listMaps, setListMaps] = useState([]); // список карт
    const [listMapsSearch, setListMapsSearch] = useState([]); // список карт
    const [groupMaps, setGroupMaps] = useState([]); // группы карт
    const [itemsMaps, setItemsMaps] = useState([]); // вывод карт при выборе конкретной группы

    const [itemsSearch, setItemsSearch] = useState([]);
    const [open, setOpen] = useState(false);
    const [clickMenu, setClickMenu] = useState(undefined);

    const onChange = (value) => {
        setMapsSearch(value);
    };

    const onSearch = (value) => {
        setMapsSearch(value);
        setClickMenu(null)
        setItemsMaps([])
    };

    const onClickGroupMaps = (e) => {
        setItemsSearch([])
        setClickMenu(null)
        setItemsMaps(listMaps.filter(item => item.webmap_group_id === parseInt(e.key)))
    }

    useMemo(() => {
        setItemsMaps([])
        setItemsSearch(listMapsSearch.filter(item => item.id === mapsSearch))
    }, [mapsSearch])

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const filteredOptions = listMapsSearch.filter((o) => !itemsSearch.includes(o));

    useMemo(() => {
        (async () => {
            try {
                const maplist = await route('resource.maplist').get(); // список карт
                setListMaps(maplist.result);
                setListMapsSearch([...new Map(maplist.result.map(item => [item['id'], item])).values()]);

                const data = [...new Map(maplist.result.map(item =>
                    [item.webmap_group_id, item])).values()]; // группы карт

                let items = []
                data.map((item) => {
                    items.push({ key: item.webmap_group_id, label: item.webmap_group_name });
                    items.push({ type: 'divider' });
                })

                setItemsMaps(maplist.result.filter(item => item.webmap_group_id === parseInt(items[0].key)))
                setGroupMaps(items);

            } catch {
                // ignore error
            }
        })();
    }, [])

    let suffixIcon;
    if (open) {
        suffixIcon = <LoadingOutlined />;
    } else {
        suffixIcon = <SearchOutlined className="search-icon" />;
    }

    return (
        <div className="main">
            <div className="content">
                <div className="content-select">
                    <Select
                        open={open}
                        onDropdownVisibleChange={(o) => setOpen(o)}
                        suffixIcon={suffixIcon}
                        style={{ width: '50%', maxWidth: '550px' }}
                        value={clickMenu}
                        autoClearSearchValue={true}
                        onFocus={() => setClickMenu(undefined)}
                        maxTagPlaceholder={10}
                        allowClear={true}
                        showSearch
                        placeholder="Введите название карты"
                        optionFilterProp="children"
                        onChange={onChange}
                        onSearch={onSearch}
                        filterOption={filterOption}
                        options={filteredOptions}
                    />
                </div>
                <div className="menu-maps">
                    <div>
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
    )
}