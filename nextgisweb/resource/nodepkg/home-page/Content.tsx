import { useEffect, useState, useMemo, useRef } from "react";
import DeleteOffOutline from "@nextgisweb/icon/mdi/magnify";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { Input, AutoComplete, FloatButton, ConfigProvider } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ContainerMenu } from "./ContainerMenu";
import { ContainerMaps } from "./ContainerMaps";
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

const size = { minW: 150, maxW: 300, minH: 150, maxH: 320 }

export const Content = observer(({ onChanges, config, ...rest }) => {
    const [store] = useState(() => new HomeStore({
        widthMenu: window.innerWidth < 785 ? "100%" : 300,
        valueHeader: {
            names: {
                first_name: "",
                last_name: "",
            },
            menus: {
                menu: {},
            },
        },
        valueFooter: {
            services: {
                value: "",
                list: {},
            },
            address: {
                value: "",
                phone: {},
            },
            footer_name: {
                base_year: "",
                name: ""
            },
            logo: {
                value: [],
                colorBackground: "#212529",
            },
        },
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

    useMemo(() => {
        const handleResize = () => {
            if (window.innerWidth < 785) {
                store.setWidthMenu(window.innerWidth - window.innerWidth / 100 * 20 - 328);
            } else {
                store.setWidthMenu(300);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [store.widthMenu]);

    useMemo(() => {
        route("pyramid.csettings")
            .get({
                query: { pyramid: ["home_page_footer"] },
            })
            .then((data) => {
                if (data.pyramid) {
                    if (Object.keys(data.pyramid.home_page_footer).length > 0) {
                        store.setValueFooter(data.pyramid.home_page_footer);
                    }
                }
            });
        route("pyramid.csettings")
            .get({
                query: { pyramid: ["home_page_header"] },
            })
            .then((data) => {
                if (data.pyramid) {
                    if (Object.keys(data.pyramid.home_page_header).length > 0) {
                        store.setValueHeader(data.pyramid.home_page_header);
                    }
                }
            });
    }, []);

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
            getListMap()
                .then(maps => {
                    store.setListMaps(maps);
                    getGroupMap()
                        .then(group => {
                            const result = group.filter(({ id }) => [...new Set(maps.map(g => g.webmap_group_id))].includes(id));
                            store.setGroupMapsGrid(result.sort((a, b) => a.id_pos - b.id_pos));
                            const groupId = result.sort((a, b) => a.id_pos - b.id_pos)[0]?.id
                            store.setItemsMapsGroup(maps.filter(u => u.webmap_group_id === groupId).sort((a, b) => a.id_pos - b.id_pos));
                        })
                });
        }
        else {
            getListMap()
                .then(maps => {
                    store.setListMaps(maps);
                });
        }
    }

    useMemo(() => {
        updateGridPosition("all")
    }, [])

    useEffect(() => {
        (store.sourceGroup === false) && updateGridPosition("all");
    }, [store.sourceGroup]);

    useEffect(() => {
        (store.sourceMaps === false) && updateGridPosition("maps");
    }, [store.sourceMaps]);

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
                        },
                    },
                }}
            >
                <Header store={store} config={config} />
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
                                    prefix={<DeleteOffOutline />}
                                    size="middle"
                                    placeholder={gettext("Enter card name")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    allowClear
                                />
                            </AutoComplete>
                        </div>
                        <div className="menu-maps">
                            <div className="menu-list">
                                {store.groupMapsGrid.length > 0 && <ContainerMenu config={config} store={store} />}
                            </div>
                            <div className="content-maps-grid">
                                {store.itemsMapsGroup.length > 0 && <ContainerMaps config={config} size={size} store={store} />}
                            </div>
                        </div>
                    </div>
                    <FloatButton.BackTop />
                </div>
                <Footer store={store} config={config} />
            </ConfigProvider >
        </>
    )
});