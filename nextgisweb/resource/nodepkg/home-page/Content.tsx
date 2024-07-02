import { useEffect, useState, useMemo, useRef } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { Input, AutoComplete, FloatButton, ConfigProvider } from "@nextgisweb/gui/antd";
import i18n from "@nextgisweb/pyramid/i18n";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ContainerMenu } from "./Container";
import { observer } from "mobx-react-lite";
import { useAbortController } from "@nextgisweb/pyramid/hook/useAbortController";
import { HomeStore } from "./HomeStore";
import "./Content.less";
import { useSource } from "./hook/useSource";

const resourcesToOptions = (resourcesInfo) => {
    return resourcesInfo.map((resInfo) => {
        const { resource } = resInfo;
        const resourceUrl = routeURL("webmap.display", resource.id)
        return {
            key: `${resource.id}`,
            label: (
                <div
                    className="item"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        width: "100%"
                    }}
                >
                    <a
                        style={{ float: "right", width: "100%" }}
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

export const Content = observer(({ onChanges, config, ...rest }) => {
    const [store] = useState(() => new HomeStore({
        sourceMaps: {
            coeff: 1,
        },
        sourceGroup: {
            update: false,
        }
    }));

    const { getListMap, getGroupMap } = useSource();

    const { makeSignal, abort } = useAbortController();
    const [options, setOptions] = useState([]);
    const [search, setSearch] = useState("");
    const [acStatus, setAcSatus] = useState("");

    const makeQuery = useMemo(() => {
        if (search && search.length > 2) {
            const q = "";
            if (search) {
                const query = {
                    display_name__ilike: `%${search}%`, cls: "webmap"
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

    const updateGridPosition = (key) => {
        if (key === "all") {
            getGroupMap()
                .then(group => {
                    store.setGroupMapsGrid(group.sort((a, b) => a.id_pos - b.id_pos))
                    getListMap()
                        .then(maps => {
                            store.setListMaps(maps);
                            store.setItemsMapsGroup(maps.filter(u => u.webmap_group_id === groupId));
                            store.setGroupMapsGrid(group.sort((x, y) => {
                                return x.id === groupId ? -1 : y.id === groupId ? 1 : 0;
                            }));
                        });
                });
        }
        // else {
        //     getListMap()
        //         .then(item => {
        //             store.setListMaps(item);
        //         });
        // }
    }

    useMemo(() => {
        updateGridPosition("all")
    }, [])

    // useEffect(() => {
    //     (store.sourceGroup.update === true) && updateGridPosition("all");
    // }, [store.sourceGroup.update]);

    // useEffect(() => {
    //     (store.sourceMaps.coeff !== 1) && updateGridPosition("maps");
    // }, [store.sourceMaps.coeff]);

    return (
        <>
            <ConfigProvider
                theme={{
                    token: {
                        fontFamily: "Montserrat",
                        colorPrimaryBorder: "#106a90",
                    },
                    components: {
                        Menu: {
                            activeBarBorderWidth: 0,
                            controlItemBgActive: "#2a398c0d",
                            colorPrimaryBorder: "#106a90",
                            lineType: "solid",
                            lineWidth: 1,
                        },
                        Tooltip: {
                            colorBgSpotlight: "#fff",
                            colorTextLightSolid: "#000",
                            borderRadius: 3,
                        },
                        Radio: {
                            colorBgContainer: "#ffffff00",
                            buttonCheckedBg: "#2a398c0d",
                        },
                        Button: {
                            defaultBg: "#ffffff20",
                        }
                    },
                }}
            >
                <Header />
                <div className="main">
                    <div className="content">
                        <div className="search-block">
                            <AutoComplete
                                popupClassName="home-page-map-filter-dropdown"
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
                        {store.groupMapsGrid.length > 0 && <ContainerMenu config={config} store={store} />}
                        {/* <div className="menu-maps">
                            <div className="menu-list">
                                {store.groupMapsGrid.length > 0 && <GridLeftMenu config={config} store={store} />}
                            </div>
                            <div
                                className="content-maps-grid">
                                {store.itemsMapsGroup.length > 0 && <GridLayout config={config} store={store} />}
                            </div>
                        </div> */}
                    </div>
                    <FloatButton.BackTop />
                </div>
                <Footer />
            </ConfigProvider>
        </>
    )
});