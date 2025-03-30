import { useEffect, useState, useMemo, useRef } from "react";
import DeleteOffOutline from "@nextgisweb/icon/mdi/magnify";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { Input, AutoComplete, FloatButton, ConfigProvider } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ContainerMenu } from "./component/ContainerMenu";
import { ContainerMaps } from "./component/ContainerMaps";
import { observer } from "mobx-react-lite";
import { useAbortController } from "@nextgisweb/pyramid/hook/useAbortController";
import { HomeStore } from "./HomeStore";
import "./Content.less";

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
    const [store] = useState(() => new HomeStore());

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
    
    useMemo(() => {
        store.getMapValues("all")
    }, [])

    useEffect(() => {
        (store.sourceGroup === false) && store.getMapValues("all");
    }, [store.sourceGroup]);

    useEffect(() => {
        (store.sourceMaps === false) && store.getMapValues("maps");
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
                            darkItemColor: `${store.valueFooter?.colorText}`,
                            darkPopupBg: `${store.valueFooter?.colorBackground}`,
                            darkSubMenuItemBg: `${store.valueFooter?.colorBackground}`,
                            darkItemHoverColor: "#afb4fd",
                            horizontalItemHoverColor: "#afb4fd",

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