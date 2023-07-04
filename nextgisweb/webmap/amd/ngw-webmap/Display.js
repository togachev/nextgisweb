define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./template/Display.hbs",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/Deferred",
    "dojo/promise/all",
    "dojo/number",
    "dojo/aspect",
    "dojo/io-query",
    "dojo/dom-construct",
    "dojo/dom-class",
    "openlayers/ol",
    "ngw-webmap/ol/Map",
    "ngw-webmap/ol/layer/Vector",
    "dijit/registry",
    "dijit/form/DropDownButton",
    "dijit/DropDownMenu",
    "dijit/MenuItem",
    "dijit/layout/ContentPane",
    "dijit/form/ToggleButton",
    "dijit/Dialog",
    "dijit/form/TextBox",
    "dojo/dom-style",
    "dojo/request/xhr",
    "dojo/data/ItemFileWriteStore",
    "dojo/topic",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/webmap/layers-tree",
    "@nextgisweb/webmap/store",
    "@nextgisweb/webmap/basemap-selector",
    "@nextgisweb/pyramid/icon",
    "@nextgisweb/gui/error",
    "@nextgisweb/pyramid/i18n!",
    "ngw-pyramid/company-logo/company-logo",
    // tools
    "ngw-webmap/MapToolbar",
    "ngw-webmap/controls/InitialExtent",
    "ngw-webmap/controls/InfoScale",
    "ngw-webmap/controls/MyLocation",
    "./tool/Base",
    "./tool/Zoom",
    "./tool/Measure",
    "./tool/Identify",
    "./tool/ViewerInfo",
    "ngw-webmap/FeatureHighlighter",
    //left panel
    "ngw-pyramid/navigation-menu/NavigationMenu",
    "ngw-webmap/ui/LayersPanel/LayersPanel",
    "ngw-webmap/ui/PrintMapPanel/PrintMapPanel",
    "ngw-webmap/ui/SearchPanel/SearchPanel",
    "ngw-webmap/ui/BookmarkPanel/BookmarkPanel",
    "ngw-webmap/ui/SharePanel/SharePanel",
    "ngw-webmap/ui/InfoPanel/InfoPanel",
    "ngw-webmap/ui/AnnotationsPanel/AnnotationsPanel",
    "./tool/Swipe",
    "ngw-webmap/MapStatesObserver",
    // utils
    "./utils/URL",
    // settings
    "@nextgisweb/pyramid/settings!",
    // template
    "dijit/layout/TabContainer",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dojox/layout/TableContainer",
    "dijit/Toolbar",
    "dijit/form/Button",
    "dijit/form/Select",
    "dijit/form/DropDownButton",
    "dijit/ToolbarSeparator",
    // css
    "xstyle/css!./template/resources/Display.css",
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template,
    lang,
    array,
    Deferred,
    all,
    number,
    aspect,
    ioQuery,
    domConstruct,
    domClass,
    ol,
    Map,
    Vector,
    registry,
    DropDownButton,
    DropDownMenu,
    MenuItem,
    ContentPane,
    ToggleButton,
    Dialog,
    TextBox,
    domStyle,
    xhr,
    ItemFileWriteStore,
    topic,
    reactApp,
    LayersTreeComp,
    WebmapStore,
    BasemapSelectorComp,
    icon,
    errorModule,
    i18n,
    companyLogo,
    MapToolbar,
    InitialExtent,
    InfoScale,
    MyLocation,
    ToolBase,
    ToolZoom,
    ToolMeasure,
    Identify,
    ToolViewerInfo,
    FeatureHighlighter,
    NavigationMenu,
    LayersPanel,
    PrintMapPanel,
    SearchPanel,
    BookmarkPanel,
    SharePanel,
    InfoPanel,
    AnnotationsPanel,
    ToolSwipe,
    MapStatesObserver,
    URL,
    settings,
    TabContainer,
    BorderContainer
) {
    var CustomItemFileWriteStore = declare([ItemFileWriteStore], {
        dumpItem: function (item) {
            var obj = {};

            if (item) {
                var attributes = this.getAttributes(item);

                if (attributes && attributes.length > 0) {
                    var i;

                    for (i = 0; i < attributes.length; i++) {
                        var values = this.getValues(item, attributes[i]);

                        if (values) {
                            if (values.length > 1) {
                                var j;

                                obj[attributes[i]] = [];
                                for (j = 0; j < values.length; j++) {
                                    var value = values[j];

                                    if (this.isItem(value)) {
                                        obj[attributes[i]].push(
                                            this.dumpItem(value)
                                        );
                                    } else {
                                        obj[attributes[i]].push(value);
                                    }
                                }
                            } else {
                                if (this.isItem(values[0])) {
                                    obj[attributes[i]] = this.dumpItem(
                                        values[0]
                                    );
                                } else {
                                    obj[attributes[i]] = values[0];
                                }
                            }
                        }
                    }
                }
            }

            return obj;
        },
    });

    var LoggedDeferred = declare(Deferred, {
        constructor: function (name) {
            this.then(
                function () {
                    console.log("Deferred object [%s] resolved", name);
                },
                function () {
                    console.error("Deferred object [%s] rejected", name);
                }
            );
        },
    });

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: i18n.renderTemplate(template),

        // AMD module loading: adapter, basemap, plugin
        _midDeferred: undefined,

        _itemStoreDeferred: undefined,
        _mapDeferred: undefined,
        _layersDeferred: undefined,
        _postCreateDeferred: undefined,
        _startupDeferred: undefined,

        // Permalink params
        _urlParams: undefined,

        // Current basemap
        _baseLayer: undefined,

        // For image loading
        assetUrl: ngwConfig.assetUrl,

        modeURLParam: "panel",
        emptyModeURLValue: "none",

        webmapStore: undefined,

        activeLeftPanel: "layersPanel",
        navigationMenuItems: [
            {
                title: i18n.gettext("Layers"),
                icon: "material-layers",
                name: "layers",
                value: "layersPanel",
            },
            {
                title: i18n.gettext("Search"),
                icon: "material-search",
                name: "search",
                value: "searchPanel",
            },
            {
                title: i18n.gettext("Share"),
                icon: "material-share",
                name: "share",
                value: "sharePanel",
            },
            {
                title: i18n.gettext("Print map"),
                icon: "material-print",
                name: "print",
                value: "printMapPanel",
            },
        ],
        constructor: function (options) {
            declare.safeMixin(this, options);

            this._urlParams = URL.getURLParams();

            this._itemStoreDeferred = new LoggedDeferred("_itemStoreDeferred");
            this._mapDeferred = new LoggedDeferred("_mapDeferred");
            this._layersDeferred = new LoggedDeferred("_layersDeferred");
            this._postCreateDeferred = new LoggedDeferred(
                "_postCreateDeferred"
            );
            this._startupDeferred = new LoggedDeferred("_startupDeferred");

            var widget = this;

            // AMD module loading
            this._midDeferred = {};
            this._mid = {};
            var mids = this.config.mid;

            this.clientSettings = settings;

            // Add basemap's AMD modules
            mids.basemap.push(
                "ngw-webmap/ol/layer/OSM",
                "ngw-webmap/ol/layer/XYZ",
                "ngw-webmap/ol/layer/QuadKey"
            );

            array.forEach(
                Object.keys(mids),
                function (k) {
                    var deferred = new LoggedDeferred("_midDeferred." + k);
                    this._midDeferred[k] = deferred;

                    var midarr = mids[k];
                    require(midarr, function () {
                        var obj = {};
                        var i;
                        for (i = 0; i < arguments.length; i++) {
                            obj[midarr[i]] = arguments[i];
                        }

                        widget._mid[k] = obj;

                        deferred.resolve(obj);
                    });
                },
                this
            );

            // Map plugins
            var wmpmids = Object.keys(this.config.webmapPlugin);
            var deferred = new LoggedDeferred("_midDeferred.webmapPlugin");

            this._midDeferred.webmapPlugin = deferred;
            require(wmpmids, function () {
                var obj = {};
                for (var i = 0; i < arguments.length; i++) {
                    obj[wmpmids[i]] = arguments[i];
                }

                widget._mid.wmplugin = obj;

                deferred.resolve(obj);
            });

            this._itemStoreSetup();
            this._webmapStoreSetup();

            this._mapDeferred.then(function () {
                widget._itemStorePrepare();
            });

            this.displayProjection = "EPSG:3857";
            this.lonlatProjection = "EPSG:4326";

            if (this.config.extent[3] > 82) {
                this.config.extent[3] = 82;
            }
            if (this.config.extent[1] < -82) {
                this.config.extent[1] = -82;
            }

            this._extent = ol.proj.transformExtent(
                this.config.extent,
                this.lonlatProjection,
                this.displayProjection
            );

            this._extent_const = ol.proj.transformExtent(
                this.config.extent_const,
                this.lonlatProjection,
                this.displayProjection
            );

            // Layers panel
            widget._layersPanelSetup();

            // Print panel
            all([widget._layersDeferred, widget._postCreateDeferred])
                .then(function () {
                    widget.printMapPanel = new PrintMapPanel({
                        region: "left",
                        splitter: false,
                        isOpen: widget.activeLeftPanel === "printMapPanel",
                        class: "dynamic-panel--fullwidth",
                        gutters: false,
                        map: widget.map.olMap,
                    });

                    if (widget.activeLeftPanel === "printMapPanel")
                        widget.activatePanel(widget.printMapPanel);

                    widget.printMapPanel.on("closed", function () {
                        widget.navigationMenu.reset();
                    });
                })
                .then(undefined, function (err) {
                    console.error(err);
                });

            // Search panel
            all([widget._layersDeferred, widget._postCreateDeferred])
                .then(function () {
                    widget.searchPanel = new SearchPanel({
                        region: "left",
                        class: "dynamic-panel--fullwidth",
                        title: i18n.gettext("Search"),
                        isOpen: widget.activeLeftPanel === "searchPanel",
                        gutters: false,
                        withCloser: true,
                        display: widget,
                    });

                    if (widget.activeLeftPanel === "searchPanel") {
                        widget.activatePanel(widget.searchPanel);
                    }

                    widget.searchPanel.on("closed", function () {
                        widget.navigationMenu.reset();
                    });
                })
                .then(undefined, function (err) {
                    console.error(err);
                });

            // Bookmark panel
            if (this.config.bookmarkLayerId) {
                this.navigationMenuItems.splice(2, 0, {
                    title: i18n.gettext("Bookmarks"),
                    name: "bookmark",
                    icon: "material-bookmark",
                    value: "bookmarkPanel",
                });

                all([widget._layersDeferred, widget._postCreateDeferred])
                    .then(function () {
                        widget.bookmarkPanel = new BookmarkPanel({
                            region: "left",
                            class: "dynamic-panel--fullwidth",
                            title: i18n.gettext("Bookmarks"),
                            isOpen: widget.activeLeftPanel === "bookmarkPanel",
                            gutters: false,
                            withCloser: true,
                            display: widget,
                            bookmarkLayerId: widget.config.bookmarkLayerId,
                        });

                        if (widget.activeLeftPanel === "bookmarkPanel")
                            widget.activatePanel(widget.bookmarkPanel);

                        widget.bookmarkPanel.on("closed", function () {
                            widget.navigationMenu.reset();
                        });
                    })
                    .then(undefined, function (err) {
                        console.error(err);
                    });
            }

            // Description panel
            if (this.config.webmapDescription) {
                this.navigationMenuItems.splice(2, 0, {
                    title: i18n.gettext("Description"),
                    name: "info",
                    icon: "material-info",
                    value: "infoPanel",
                });
                // Do it asynchronious way to get URL params work
                setTimeout(function () {
                    widget.infoPanel = new InfoPanel({
                        region: "left",
                        class: "info-panel dynamic-panel--fullwidth",
                        withTitle: false,
                        isOpen: widget.activeLeftPanel === "infoPanel",
                        gutters: false,
                        withCloser: true,
                        description: widget.config.webmapDescription,
                        display: widget,
                    });

                    if (widget.activeLeftPanel === "infoPanel")
                        widget.activatePanel(widget.infoPanel);

                    widget.infoPanel.on("closed", function () {
                        widget.navigationMenu.reset();
                    });
                }, 0);
            }

            this._buildAnnotationsPanel();

            // Share panel
            all([widget._layersDeferred, widget._postCreateDeferred])
                .then(function () {
                    widget.sharePanel = new SharePanel({
                        region: "left",
                        class: "dynamic-panel--fullwidth",
                        title: i18n.gettext("Share"),
                        isOpen: widget.activeLeftPanel === "sharePanel",
                        gutters: false,
                        withCloser: true,
                        socialNetworks: settings.enable_social_networks,
                        display: widget,
                        eventVisibility: undefined,
                    });

                    widget.sharePanel.on("closed", function () {
                        widget.navigationMenu.reset();
                    });

                    widget.sharePanel.on("pre-show", function () {
                        widget.sharePanel.options.eventVisibility = "pre-show";
                    });

                    widget.sharePanel.on("pre-hide", function () {
                        widget.sharePanel.options.eventVisibility = "pre-hide";
                    });

                    if (widget.activeLeftPanel === "sharePanel") {
                        widget.activatePanel(widget.sharePanel);
                    }
                })
                .then(undefined, function (err) {
                    console.error(err);
                });

            // Map and plugins
            all([
                this._midDeferred.basemap,
                this._midDeferred.webmapPlugin,
                this._startupDeferred,
            ])
                .then(function () {
                    widget._pluginsSetup(true);
                    widget._mapSetup();
                })
                .then(undefined, function (err) {
                    console.error(err);
                });

            // Setup layers
            all([this._midDeferred.adapter, this._itemStoreDeferred])
                .then(function () {
                    widget._layersSetup();
                })
                .then(undefined, function (err) {
                    console.error(err);
                });

            all([this._layersDeferred, this._mapSetup])
                .then(
                    lang.hitch(this, function () {
                        widget._mapAddLayers();

                        widget.featureHighlighter = new FeatureHighlighter(
                            this.map
                        );

                        // Bind checkboxes and layer visibility
                    })
                )
                .then(undefined, function (err) {
                    console.error(err);
                });

            // Tools and plugins
            all([this._midDeferred.plugin, this._layersDeferred])
                .then(function () {
                    widget._toolsSetup();
                    widget._pluginsSetup();
                    widget._buildLayersTree();
                    widget._identifyFeatureByAttrValue();
                })
                .then(undefined, function (err) {
                    console.error(err);
                });

            // Switch to panel from permalink
            var panelNameFromURL = this._urlParams[this.modeURLParam];
            if (panelNameFromURL) {
                if (panelNameFromURL === this.emptyModeURLValue) {
                    this.activeLeftPanel = "";
                } else {
                    var menuItem =
                        this._findNavigationMenuItem(panelNameFromURL);
                    if (menuItem) {
                        this.activeLeftPanel = menuItem.value;
                    }
                }
            }

            this.tools = [];
        },

        _buildAnnotationsPanel: function () {
            if (
                !this.config.annotations ||
                !this.config.annotations.enabled ||
                !this.config.annotations.scope.read
            ) {
                return false;
            }

            this.navigationMenuItems.splice(2, 0, {
                title: i18n.gettext("Annotations"),
                name: "annotation",
                icon: "material-message",
                value: "annotationPanel",
            });

            const annotUrlParam = this._urlParams.annot;
            let annotVisibleState;
            if (
                annotUrlParam &&
                (annotUrlParam === "no" ||
                    annotUrlParam === "yes" ||
                    annotUrlParam === "messages")
            ) {
                annotVisibleState = annotUrlParam;
            }

            var buildAnnotationsPanel = function (widget) {
                widget.annotationPanel = new AnnotationsPanel({
                    region: "left",
                    class: "dynamic-panel--fullwidth",
                    title: i18n.gettext("Annotations"),
                    isOpen: widget.activeLeftPanel === "annotationPanel",
                    gutters: false,
                    withCloser: true,
                    display: widget,
                    annotVisibleState,
                });

                if (widget.activeLeftPanel === "annotationPanel")
                    widget.activatePanel(widget.annotationPanel);

                widget.annotationPanel.on("closed", function () {
                    widget.navigationMenu.reset();
                });
            };

            all([this._layersDeferred, this._postCreateDeferred])
                .then(
                    lang.hitch(this, function () {
                        buildAnnotationsPanel(this);
                    })
                )
                .then(undefined, function (err) {
                    console.error(err);
                });
        },

        postCreate: function () {
            this.inherited(arguments);
            var widget = this;

            // Modify TabContainer to hide tabs if there is only one tab.
            declare.safeMixin(this.tabContainer, {
                updateTabVisibility: function () {
                    var currstate =
                            domStyle.get(this.tablist.domNode, "display") !=
                            "none",
                        newstate = this.getChildren().length > 1;

                    if (currstate && !newstate) {
                        domStyle.set(this.tablist.domNode, "display", "none");
                        this.resize();
                    } else if (!currstate && newstate) {
                        domStyle.set(this.tablist.domNode, "display", "block");
                        this.resize();
                    }
                },

                addChild: function () {
                    this.inherited(arguments);
                    this.updateTabVisibility();
                },
                removeChild: function () {
                    this.inherited(arguments);
                    this.updateTabVisibility();
                },
                startup: function () {
                    this.inherited(arguments);
                    this.updateTabVisibility();
                },
            });

            this._navigationMenuSetup();

            this.leftPanelPane = new BorderContainer({
                class: "leftPanelPane",
                region: "left",
                gutters: false,
                splitter: true,
            });

            this._postCreateDeferred.resolve();
        },

        startup: function () {
            this.inherited(arguments);
            this._startupDeferred.resolve();
        },

        prepareItem: function (item) {
            var self = this;
            var copy = {
                id: item.id,
                type: item.type,
                label: item.label,
            };

            if (copy.type === "layer") {
                copy.layerId = item.layerId;
                copy.styleId = item.styleId;

                copy.visibility = null;
                copy.checked = item.visibility;
                copy.identifiable = item.identifiable;
                copy.position = item.drawOrderPosition;
            } else if (copy.type === "group" || copy.type === "root") {
                copy.children = array.map(item.children, function (c) {
                    return self.prepareItem(c);
                });
            }
            this._itemConfigById[item.id] = item;

            return copy;
        },

        _webmapStoreSetup: function () {
            this.webmapStore = new WebmapStore.default({
                itemStore: this.itemStore,
            });
        },

        _itemStoreSetup: function () {
            this._itemConfigById = {};
            var rootItem = this.prepareItem(this.config.rootItem);

            this.itemStore = new CustomItemFileWriteStore({
                data: {
                    identifier: "id",
                    label: "label",
                    items: [rootItem],
                },
            });
        },

        _itemStorePrepare: function () {
            var widget = this;

            this.itemStore.fetch({
                queryOptions: { deep: true },
                onItem: function (item) {
                    widget._itemStorePrepareItem(item);
                },
                onComplete: function () {
                    widget._itemStoreDeferred.resolve();
                },
                onError: function () {
                    widget._itemStoreDeferred.reject();
                },
            });
        },

        _itemStorePrepareItem: function (item) {
            this._itemStoreVisibility(item);
        },

        _itemStoreVisibility: function (item) {
            var webmapStore = this.webmapStore;

            if (webmapStore) {
                webmapStore._itemStoreVisibility(item);
            }
        },

        _mapSetup: function () {
            var widget = this;

            widget.mapToolbar = new MapToolbar({
                display: widget,
                target: widget.leftBottomControlPane,
            });

            this.map = new Map({
                target: this.mapNode,
                logo: false,
                controls: [],
                view: new ol.View({
                    minZoom: 3,
                    constrainResolution: true,
                    extent: !this.config.extent_const.includes(null)
                        ? this._extent_const
                        : undefined,
                }),
            });

            this._mapAddControls([
                new ol.control.Zoom({
                    zoomInLabel: domConstruct.create("span", {
                        class: "ol-control__icon",
                        innerHTML: icon.html({ glyph: "add" }),
                    }),
                    zoomOutLabel: domConstruct.create("span", {
                        class: "ol-control__icon",
                        innerHTML: icon.html({ glyph: "remove" }),
                    }),
                    zoomInTipLabel: i18n.gettext("Zoom in"),
                    zoomOutTipLabel: i18n.gettext("Zoom out"),
                    target: widget.leftTopControlPane,
                }),
                new ol.control.Attribution({
                    tipLabel: i18n.gettext("Attributions"),
                    target: widget.rightBottomControlPane,
                    collapsible: false,
                }),
                new ol.control.ScaleLine({
                    target: widget.rightBottomControlPane,
                    units: settings.units,
                    minWidth: 48,
                }),
                new InfoScale({
                    display: widget,
                    target: widget.rightBottomControlPane,
                }),
                new InitialExtent({
                    display: widget,
                    target: widget.leftTopControlPane,
                    tipLabel: i18n.gettext("Initial extent"),
                }),
                new MyLocation({
                    display: widget,
                    target: widget.leftTopControlPane,
                    tipLabel: i18n.gettext("Locate me"),
                }),
                new ol.control.Rotate({
                    tipLabel: i18n.gettext("Reset rotation"),
                    target: widget.leftTopControlPane,
                    label: domConstruct.create("span", {
                        class: "ol-control__icon",
                        innerHTML: icon.html({ glyph: "arrow_upward" }),
                    }),
                }),
                widget.mapToolbar,
            ]);

            // Resize OpenLayers Map on container resize
            aspect.after(this.mapPane, "resize", function () {
                widget.map.olMap.updateSize();
            });

            // Basemaps initialization
            var idx = 0;
            array.forEach(
                settings.basemaps,
                function (bm) {
                    var MID = this._mid.basemap[bm.base.mid];

                    var baseOptions = lang.clone(bm.base);
                    var layerOptions = lang.clone(bm.layer);
                    var sourceOptions = lang.clone(bm.source);

                    if (baseOptions.keyname === undefined) {
                        baseOptions.keyname = "basemap_" + idx;
                    }

                    try {
                        var layer = new MID(
                            baseOptions.keyname,
                            layerOptions,
                            sourceOptions
                        );
                        if (layer.olLayer.getVisible()) {
                            this._baseLayer = layer;
                        }
                        layer.isBaseLayer = true;
                        this.map.addLayer(layer);
                    } catch (err) {
                        console.warn(
                            "Can't initialize layer [" +
                                baseOptions.keyname +
                                "]: " +
                                err
                        );
                    }

                    idx = idx + 1;
                },
                this
            );

            companyLogo(this.mapNode);

            this._setMapExtent();

            this._mapDeferred.resolve();
        },

        _mapAddControls: function (controls) {
            array.forEach(
                controls,
                function (control) {
                    this.map.olMap.addControl(control);
                },
                this
            );
        },
        _mapAddLayer: function (id) {
            this.map.addLayer(this.webmapStore._layers[id]);
        },
        _mapAddLayers: function () {
            array.forEach(
                this._layer_order,
                function (id) {
                    this._mapAddLayer(id);
                },
                this
            );
        },

        _adaptersSetup: function () {
            this._adapters = {};
            array.forEach(
                Object.keys(this._mid.adapter),
                function (k) {
                    this._adapters[k] = new this._mid.adapter[k]({
                        display: this,
                    });
                },
                this
            );
        },

        _onNewStoreItem: function (item) {
            var widget = this,
                store = this.itemStore;
            widget._layerSetup(item);
            widget._layer_order.unshift(store.getValue(item, "id"));
        },

        _layersSetup: function () {
            var widget = this,
                store = this.itemStore,
                visibleStyles = null;

            this._adaptersSetup();

            // Layer index by id
            /** @deprecated use this.webmapStore._layers instead. Fore backward compatibility */
            Object.defineProperty(this, "_layers", {
                get: function () {
                    return this.webmapStore._layers;
                },
            });
            this._layer_order = []; // Layers from back to front

            if (lang.isString(widget._urlParams.styles)) {
                visibleStyles = widget._urlParams.styles.split(",");
                visibleStyles = array.map(visibleStyles, function (i) {
                    return parseInt(i, 10);
                });
            }

            // Layers initialization
            store.fetch({
                query: { type: "layer" },
                queryOptions: { deep: true },
                sort: widget.config.drawOrderEnabled
                    ? [
                          {
                              attribute: "position",
                          },
                      ]
                    : null,
                onItem: function (item) {
                    widget._onNewStoreItem(item, visibleStyles);

                    // Turn on layers from permalink
                    var cond,
                        layer =
                            widget.webmapStore._layers[
                                store.getValue(item, "id")
                            ];
                    if (visibleStyles) {
                        cond =
                            array.indexOf(
                                visibleStyles,
                                store.getValue(item, "styleId")
                            ) !== -1;
                        layer.olLayer.setVisible(cond);
                        layer.visibility = cond;
                        store.setValue(item, "checked", cond);
                    }
                },
                onComplete: function () {
                    widget._layersDeferred.resolve();
                },
                onError: function (error) {
                    console.error(error);
                    widget._layersDeferred.reject();
                },
            });
        },

        _layerSetup: function (item) {
            var store = this.itemStore;

            var data = this._itemConfigById[store.getValue(item, "id")];
            var adapter = this._adapters[data.adapter];

            data.minResolution = this.map.getResolutionForScale(
                data.maxScaleDenom,
                this.map.olMap.getView().getProjection().getMetersPerUnit()
            );
            data.maxResolution = this.map.getResolutionForScale(
                data.minScaleDenom,
                this.map.olMap.getView().getProjection().getMetersPerUnit()
            );

            var layer = adapter.createLayer(data);

            layer.itemId = data.id;
            layer.itemConfig = data;

            this.webmapStore._layers[data.id] = layer;
        },

        _toolsSetup: function () {
            this.mapToolbar.items.addTool(
                new ToolZoom({ display: this, out: false }),
                "zoomingIn"
            );
            this.mapToolbar.items.addTool(
                new ToolZoom({ display: this, out: true }),
                "zoomingOut"
            );

            this.mapToolbar.items.addTool(
                new ToolMeasure({ display: this, type: "LineString" }),
                "measuringLength"
            );
            this.mapToolbar.items.addTool(
                new ToolMeasure({ display: this, type: "Polygon" }),
                "measuringArea"
            );

            this.mapToolbar.items.addTool(
                new ToolSwipe({ display: this, orientation: "vertical" }),
                "swipeVertical"
            );

            this.mapToolbar.items.addTool(
                new ToolViewerInfo({ display: this }),
                "~viewerInfo"
            );

            this.identify = new Identify({ display: this });
            var mapStates = MapStatesObserver.getInstance();
            mapStates.addState("identifying", this.identify);
            mapStates.setDefaultState("identifying", true);

            topic.publish("/webmap/tools/initialized");
        },

        _pluginsSetup: function (wmplugin) {
            if (!this._plugins) {
                this._plugins = {};
            }

            var widget = this,
                plugins = wmplugin ? this._mid.wmplugin : this._mid.plugin;

            array.forEach(
                Object.keys(plugins),
                function (key) {
                    console.log("Plugin [%s]::constructor...", key);

                    var plugin = new plugins[key]({
                        identity: key,
                        display: this,
                        itemStore: wmplugin ? false : this.itemStore,
                    });

                    widget._postCreateDeferred.then(function () {
                        console.log("Plugin [%s]::postCreate...", key);
                        plugin.postCreate();

                        widget._startupDeferred.then(function () {
                            console.log("Plugin [%s]::startup...", key);
                            plugin.startup();

                            widget._plugins[key] = plugin;
                            console.info("Plugin [%s] registered", key);
                        });
                    });
                },
                this
            );
        },

        _findNavigationMenuItem: function (itemValue) {
            for (var fry = 0; fry < this.navigationMenuItems.length; fry++) {
                var menuItem = this.navigationMenuItems[fry];
                if (
                    [menuItem.icon, menuItem.value, menuItem.name].indexOf(
                        itemValue
                    ) !== -1
                ) {
                    return menuItem;
                }
            }
            return false;
        },

        _setActivePanelURL: function () {
            if (this.activeLeftPanel) {
                var menuItem = this._findNavigationMenuItem(
                    this.activeLeftPanel
                );
                if (menuItem) {
                    URL.setURLParam(this.modeURLParam, menuItem.name);
                }
            } else {
                URL.setURLParam(this.modeURLParam, this.emptyModeURLValue);
            }
        },

        _navigationMenuSetup: function () {
            var widget = this;

            this.navigationMenu = new NavigationMenu({
                value: this.activeLeftPanel,
                items: this.navigationMenuItems,
                region: "left",
            }).placeAt(this.navigationMenuPane);

            this.navigationMenu.watch(
                "value",
                function (name, oldValue, value) {
                    if (oldValue && widget[oldValue]) {
                        widget.deactivatePanel(widget[oldValue]);
                    }

                    if (widget[value]) {
                        widget.activatePanel(widget[value]);
                    }

                    widget.activeLeftPanel = value;
                    widget._setActivePanelURL();
                }
            );
            this._setActivePanelURL();
        },

        _layersPanelSetup: function () {
            var widget = this,
                itemStore = this.itemStore;

            all([widget._layersDeferred, widget._postCreateDeferred])
                .then(function () {
                    widget.layersPanel = new LayersPanel({
                        region: "left",
                        class: "dynamic-panel--fullwidth",
                        title: i18n.gettext("Layers"),
                        isOpen: widget.activeLeftPanel === "layersPanel",
                        gutters: false,
                        withCloser: true,
                    });

                    if (widget.activeLeftPanel === "layersPanel")
                        widget.activatePanel(widget.layersPanel);

                    widget.layersPanel.on("closed", function () {
                        widget.navigationMenu.reset();
                    });
                })
                .then(undefined, function (err) {
                    console.error(err);
                });

            all([
                this._layersDeferred,
                this._mapDeferred,
                this._postCreateDeferred,
            ])
                .then(function () {
                    if (widget._urlParams.base) {
                        widget._switchBasemap(widget._urlParams.base);
                    }

                    reactApp.default(
                        BasemapSelectorComp.default,
                        {
                            map: widget.map,
                            basemapDefault: widget._getActiveBasemapKey(),
                            onChange: (key) => widget._switchBasemap(key),
                        },
                        widget.layersPanel.contentWidget.basemapPane.domNode
                    );
                    widget.layersPanel.resize();
                })
                .then(undefined, function (err) {
                    console.error(err);
                });
        },

        _switchBasemap: function (basemapLayerKey) {
            if (!(basemapLayerKey in this.map.layers)) {
                return false;
            }

            if (this._baseLayer && this._baseLayer.name) {
                const { name } = this._baseLayer;
                this.map.layers[name].olLayer.setVisible(false);
            }

            const newLayer = this.map.layers[basemapLayerKey];
            newLayer.olLayer.setVisible(true);
            this._baseLayer = newLayer;

            return true;
        },

        _getActiveBasemapKey: function () {
            if (!this._baseLayer || !this._baseLayer.name) {
                return undefined;
            }
            return this._baseLayer.name;
        },

        _buildLayersTree: function () {
            const widget = this;
            const itemStore = this.itemStore;

            const handleSelect = (selectedKeys) => {
                if (selectedKeys.length === 0 || selectedKeys.length < 1) {
                    return;
                }
                const itemId = selectedKeys[0];
                itemStore.fetchItemByIdentity({
                    identity: itemId,
                    onItem: (item) => {
                        widget.set(
                            "itemConfig",
                            widget._itemConfigById[itemId]
                        );
                        widget.set("item", item);
                    },
                });
            };

            const setLayerZIndex = (id, zIndex) => {
                const layer = widget.map.layers[id];
                if (layer && layer.olLayer && layer.olLayer.setZIndex) {
                    layer.olLayer.setZIndex(zIndex);
                }
            };
            const { expanded, checked } = widget.config.itemsStates;
            this.webmapStore.setWebmapItems(widget.config.rootItem.children);
            // this.webmapStore.setChecked(checked);
            this.webmapStore.setExpanded(expanded);

            this.component = reactApp.default(
                LayersTreeComp.default,
                {
                    store: this.webmapStore,
                    onSelect: handleSelect,
                    setLayerZIndex: setLayerZIndex,
                    getWebmapPlugins: () => Object.assign({}, widget._plugins),
                },
                widget.layersPanel.contentWidget.layerTreePane.domNode
            );
        },

        getVisibleItems: function () {
            var store = this.itemStore,
                deferred = new Deferred();

            store.fetch({
                query: { type: "layer", visibility: "true" },
                sort: { attribute: "position" },
                queryOptions: { deep: true },
                onComplete: function (items) {
                    deferred.resolve(items);
                },
                onError: function (error) {
                    deferred.reject(error);
                },
            });

            return deferred;
        },

        dumpItem: function () {
            return this.itemStore.dumpItem(this.item);
        },

        _setMapExtent: function () {
            if (this._zoomByUrlParams()) return;
            this._zoomToInitialExtent();
        },

        _zoomByUrlParams: function () {
            const urlParams = this._urlParams;

            if (
                !(
                    "zoom" in urlParams &&
                    "lon" in urlParams &&
                    "lat" in urlParams
                )
            ) {
                return false;
            }

            this.map.olMap
                .getView()
                .setCenter(
                    ol.proj.fromLonLat([
                        parseFloat(urlParams.lon),
                        parseFloat(urlParams.lat),
                    ])
                );
            this.map.olMap.getView().setZoom(parseInt(urlParams.zoom));

            if ("angle" in urlParams) {
                this.map.olMap
                    .getView()
                    .setRotation(parseFloat(urlParams.angle));
            }

            return true;
        },

        _zoomToInitialExtent: function () {
            this.map.olMap.getView().fit(this._extent);
        },

        _identifyFeatureByAttrValue: function () {
            const urlParams = this._urlParams;

            if (
                !(
                    "hl_lid" in urlParams &&
                    "hl_attr" in urlParams &&
                    "hl_val" in urlParams
                )
            ) {
                return;
            }

            this.identify
                .identifyFeatureByAttrValue(
                    urlParams.hl_lid,
                    urlParams.hl_attr,
                    urlParams.hl_val
                )
                .then((result) => {
                    if (result) return;
                    errorModule.errorModal({
                        title: i18n.gettext("Object not found"),
                        message: i18n.gettext(
                            "Object from URL parameters not found"
                        ),
                    });
                });
        },

        activatePanel: function (panel) {
            if (panel.isFullWidth) {
                domClass.add(
                    this.leftPanelPane.domNode,
                    "leftPanelPane--fullwidth"
                );
                this.leftPanelPane.set("splitter", false);
            }

            this.leftPanelPane.addChild(panel);
            this.mainContainer.addChild(this.leftPanelPane);

            panel.show();
        },

        deactivatePanel: function (panel) {
            this.mainContainer.removeChild(this.leftPanelPane);
            this.leftPanelPane.removeChild(panel);

            if (panel.isFullWidth) {
                domClass.remove(
                    this.leftPanelPane.domNode,
                    "leftPanelPane--fullwidth"
                );
                this.leftPanelPane.set("splitter", true);
            }

            if (panel.isOpen) {
                panel.hide();
            }
        },
    });
});
