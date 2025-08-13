import { useEffect, useState, useMemo, useRef } from "react";
import DeleteOffOutline from "@nextgisweb/icon/mdi/magnify";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { Input, AutoComplete, FloatButton, ConfigProvider } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ContainerMenu, ContainerMaps, Footer, Header } from "./component";
import { observer } from "mobx-react-lite";
import { useAbortController } from "@nextgisweb/pyramid/hook/useAbortController";
import { HomeStore } from "./HomeStore";
import { useStyleMobile } from "./function";

import "./Content.less";

import type { ParamsOf } from "@nextgisweb/gui/type";
type AutoProps = ParamsOf<typeof AutoComplete>;

interface ConfigProps {
    isAdministrator: string;
    upath_info: string;
    type: string;
}

interface ContentProps extends Omit<AutoProps, "onChange"> {
    config: ConfigProps;
}

const resourcesToOptions = (resourcesInfo) => {
    return resourcesInfo.map((resInfo) => {
        const { resource } = resInfo;
        const resourceUrl = routeURL("webmap.display", resource.id);
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

export const Content = observer(({ config, ...rest }: ContentProps) => {
    const [store] = useState(() => new HomeStore({ config: config }));
    useStyleMobile()

    const [size, setSize] = useState({ minW: 150, maxW: 300, minH: 150, maxH: 320, cardCoverH: 204, cardBodyH: 116, min: false });

    const { makeSignal, abort } = useAbortController();
    const [options, setOptions] = useState([]);
    const [search, setSearch] = useState("");
    const [acStatus, setAcStatus] = useState<AutoProps["status"]>("");

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
                setAcStatus("");
            } catch (er) {
                setAcStatus("error");
            }
        }
    );

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 760) {
                store.setWidthMenu(window.innerWidth - window.innerWidth / 100 * 20 - 328);
            } else {
                store.setWidthMenu(280);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [store.widthMenu, window.innerWidth]);

    useEffect(() => {
        if (makeQuery) {
            makeSearchRequest.current({ query: makeQuery });
        } else {
            setOptions([]);
        }
    }, [makeQuery]);

    const onChanges: AutoProps["onSelect"] = (_value, option) => {
        window.location.href = option.url;
    };

    const onSelect = (v, opt) => {
        if (onChanges) {
            onChanges(v, opt);
        }
    };

    return (
        <>
            <ConfigProvider
                theme={{
                    token: {
                        fontFamily: "Montserrat",
                        colorPrimaryBorder: "#106a90",
                    },
                    components: {
                        Modal: {
                            colorBgMask: "var(--divider-color)",
                        },
                        Image: {
                            colorBgMask: "var(--divider-color)",
                        },
                        Menu: {
                            lineWidth: 1,
                            itemBg: "transparent",
                            groupTitleColor: `${store.valueFooter?.colorBackground}`,
                            itemColor: `${store.valueFooter?.colorBackground}`,
                            popupBg: `${store.valueFooter?.colorText}`,
                            itemHoverColor: `${store.valueFooter?.colorText}`,
                            itemHoverBg: "var(--icon-color)",
                            itemPaddingInline: 8,
                        },
                        Segmented: {
                            trackBg: "transparent",
                            trackPadding: 0,
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
                <Header store={store} />
                <div className="main">
                    <div className="content">
                        <div className="search-block">
                            <div className="search">
                                <AutoComplete
                                    popupClassName="home-page-map-filter-dropdown"
                                    style={{ width: "100%" }}
                                    onSelect={onSelect}
                                    options={options}
                                    status={acStatus}
                                    notFoundContent={search.length > 0 && gettext("Webmap not found")}
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
                        </div>
                        <div className="menu-maps">
                            <div className="menu-list">
                                {store.groupMapsGrid.length > 0 && <ContainerMenu store={store} />}
                            </div>
                            <div className="content-maps-grid">
                                {store.itemsMapsGroup.length > 0 && <ContainerMaps size={size} store={store} />}
                            </div>
                        </div>
                    </div>
                    <FloatButton.BackTop />
                </div>
                <Footer store={store} />
            </ConfigProvider >
        </>
    )
});