import { useEffect, useState, useMemo } from "react";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import './WebgisHome.less';
import { Select, Layout, Menu, Space } from "@nextgisweb/gui/antd";
import { SearchOutlined, LoadingOutlined } from '@ant-design/icons';

const { Header, Footer, Sider, Content } = Layout;

export function WebgisHome() {
    const [mapsSearch, setMapsSearch] = useState(); // выбрана карта при поиске

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

    const header_image = routeURL('pyramid.header_image')

    const onSearch = (value) => {
        setMapsSearch(value);
        // setClickMenu(null)
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
                setListMapsSearch(maplist.result);

                const data = [...new Map(maplist.result.map(item =>
                    [item.webmap_group_id, item])).values()]; // группы карт
                console.log(data);
                let items = []
                data.map(item => {
                    items.push({ key: item.webmap_group_id, label: item.webmap_group_name });
                    items.push({ type: 'divider' });
                })
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
        <Space
            direction="vertical"
            style={{
                width: '100%',
            }}
            size={[0, 48]}
        >
            <Layout>
                <Header className="header"><span style={{ backgroundImage: "url(" + header_image + ")" }} className="header-content"></span></Header>
                <Layout>
                    <Sider className="sider-left"></Sider>
                    <Content className="content">
                        <Layout className="content-all">
                            <Content>
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
                            </Content>
                            <Content>
                                <Layout hasSider>
                                    <Content className="content-menu">

                                        <Menu
                                            mode="inline"
                                            theme="light"
                                            items={groupMaps}
                                            onClick={onClickGroupMaps}
                                        />

                                    </Content>

                                    <Content className="content-maps-grid">
                                        <Layout>
                                            <Content className="content-grid">
                                                {itemsMaps.map((item, index) => {
                                                    return (
                                                        <div key={index}>{item.display_name}</div>
                                                    )
                                                })}
                                                {itemsSearch.map((item, index) => {
                                                    return (
                                                        <div key={index}>{item.display_name}</div>
                                                    )
                                                })}
                                            </Content>
                                        </Layout>
                                    </Content>
                                </Layout>
                            </Content>
                        </Layout>
                    </Content>
                    <Sider className="sider-right"></Sider>
                </Layout>
                <Footer className="footer"><Content className="footer-content">Footer</Content></Footer>
            </Layout>
        </Space>
    )
}