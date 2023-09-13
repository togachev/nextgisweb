import { useEffect, useState, useMemo } from "react";
import { route } from "@nextgisweb/pyramid/api";
import './webgis.less';
import { Select, Menu } from "@nextgisweb/gui/antd";
import { SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import { Avatar, Card } from 'antd';
const { Meta } = Card;


const MapTile = ({name}) => (
    <Card
    style={{
      width: 300,
    }}
    cover={
      <img
        alt="example"
        src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
      />
    }
    actions={[
      <SettingOutlined key="setting" />,
      <EditOutlined key="edit" />,
      <EllipsisOutlined key="ellipsis" />,
    ]}
  >
    <Meta
      avatar={<Avatar src="https://xsgames.co/randomusers/avatar.php?g=pixel" />}
      title={name}
      description="This is the description"
    />
  </Card>
)


export function WebgisHome() {
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

    console.log(itemsMaps);
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
                        style={{ width: '50%' }}
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
                            defaultSelectedKeys={['1']}
                        />
                    </div>
                    <div className="content-maps-grid">
                        {itemsMaps.map((item, index) => {
                            return (
                                <MapTile key={index} name={item.display_name} />
                            )
                        })}
                        {itemsSearch.map((item, index) => {
                            return (
                                <MapTile key={index} name={item.display_name} />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}