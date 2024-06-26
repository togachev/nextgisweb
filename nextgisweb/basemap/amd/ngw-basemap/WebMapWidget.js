define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom-style",
    "dojo/data/ItemFileWriteStore",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/layout/ContentPane",
    "dijit/tree/TreeStoreModel",
    "dijit/Tree",
    "dijit/tree/dndSource",
    "@nextgisweb/pyramid/i18n!",
    "ngw-resource/serialize",
    "dojo/text!./template/WebMapWidget.hbs",
    // template
    "dijit/layout/BorderContainer",
    "dijit/layout/StackContainer",
    "dojox/layout/TableContainer",
    "dijit/Toolbar",
    "dijit/form/Button",
    "dijit/form/Form",
    "dijit/form/Select",
    "ngw-resource/ResourcePicker",
    "ngw-resource/form/ResourceLink",
    "ngw-pyramid/form/DisplayNameTextBox",
    "ngw-pyramid/form/ScaleTextBox",
], function (
    declare,
    array,
    domStyle,
    ItemFileWriteStore,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    ContentPane,
    TreeStoreModel,
    Tree,
    dndSource,
    i18n,
    serialize,
    template
) {
    return declare(
        [
            ContentPane,
            _TemplatedMixin,
            _WidgetsInTemplateMixin,
            serialize.Mixin,
        ],
        {
            title: i18n.gettext("Basemaps"),
            templateString: i18n.renderTemplate(template),

            constructor: function () {
                this.itemStore = new ItemFileWriteStore({
                    data: {
                        items: [
                            {
                                item_type: "root",
                            },
                        ],
                    },
                });

                this.itemModel = new TreeStoreModel({
                    store: this.itemStore,
                    query: {},
                });

                this.widgetTree = new Tree({
                    model: this.itemModel,
                    showRoot: false,
                    persist: false,
                    dndController: dndSource,
                    getLabel: function (item) {
                        return item.display_name;
                    },
                    getIconClass: function () {
                        return "dijitLeaf";
                    },
                    checkItemAcceptance: function (node, source, position) {
                        return position !== "over";
                    },
                    betweenThreshold: 5,
                });

                this.itemIdx = 0;
                this.widgetTreeRootNodeId =
                    this.widgetTree.rootNode.getIdentity();
            },

            postCreate: function () {
                this.inherited(arguments);

                this.widgetTree.placeAt(this.containerTree).startup();

                var widget = this;

                // Add new layer
                this.btnAddLayer.on("click", function () {
                    widget.layerPicker.pick().then(function (itm) {
                        if (widget._hasBasemapResourceId(itm.id)) {
                            alert(i18n.gettext("Basemap already added"));
                            return;
                        }

                        widget.itemStore.newItem(
                            {
                                "keyname": null,
                                "display_name": itm.display_name,
                                "resource_id": itm.id,
                                "enabled": false,
                                "opacity": null,
                            },
                            {
                                parent: widget.itemModel.root,
                                attribute: "children",
                            }
                        );
                        widget.itemIdx++;
                        widget.widgetTree.set("path", [
                            widget.widgetTreeRootNodeId,
                            widget.itemIdx,
                        ]);

                        widget._buildBasemapsDefault();
                    });
                });

                // Remove layer
                this.btnDeleteItem.on("click", function () {
                    var item = widget.widgetTree.selectedItem,
                        identity = widget.itemModel.getIdentity(item),
                        node = widget.widgetTree._itemNodesMap[identity][0],
                        prevSibling = node.getPreviousSibling(),
                        nextSibling = node.getNextSibling();

                    // Switch to sibling node
                    var sibling = prevSibling ? prevSibling : nextSibling;
                    if (sibling) {
                        widget.widgetTree.set("path", [
                            widget.widgetTreeRootNodeId,
                            sibling.getIdentity(),
                        ]);
                    } else {
                        widget.treeLayoutContainer.removeChild(widget.itemPane);
                        widget.btnDeleteItem.set("disabled", true);
                    }

                    widget.itemStore.deleteItem(item);
                    widget._buildBasemapsDefault();
                });

                this.widgetTree.watch(
                    "selectedItem",
                    function (attr, oldValue, newValue) {
                        if (newValue) {
                            widget.widgetProperties.selectChild(
                                widget.paneLayer
                            );
                            widget.wDisplayName.set(
                                "value",
                                widget.getItemValue("display_name")
                            );
                            widget.wOpacity.set(
                                "value",
                                widget.getItemValue("opacity")
                            );
                            widget.wLink.set(
                                "value",
                                widget.getItemValue("resource_id")
                            );

                            // Show side panel
                            if (!oldValue) {
                                domStyle.set(
                                    widget.itemPane.domNode,
                                    "display",
                                    "block"
                                );
                                widget.treeLayoutContainer.addChild(
                                    widget.itemPane
                                );
                            }

                            widget.btnDeleteItem.set("disabled", false);
                        }
                    }
                );

                this.wDisplayName.watch(
                    "value",
                    function (attr, oldValue, newValue) {
                        widget.setItemValue("display_name", newValue);
                        widget._buildBasemapsDefault();
                    }
                );

                this.wOpacity.watch("value", function (attr, oldVal, newVal) {
                    widget.setItemValue("opacity", newVal);
                });

                this.slBasemapDefault.on("change", (basemapId) => {
                    this._setDefaultBasemap(basemapId);
                });
            },

            setItemValue: function (attr, value) {
                this.itemStore.setValue(
                    this.widgetTree.selectedItem,
                    attr,
                    value
                );
            },

            getItemValue: function (attr) {
                if (this.widgetTree.selectedItem) {
                    return this.itemStore.getValue(
                        this.widgetTree.selectedItem,
                        attr
                    );
                }
            },

            serializeInMixin: function (data) {
                if (data.basemap_webmap === undefined) {
                    data.basemap_webmap = {};
                }
                var store = this.itemStore;

                function dump(itm) {
                    return {
                        display_name: store.getValue(itm, "display_name"),
                        resource_id: store.getValue(itm, "resource_id"),
                        enabled: store.getValue(itm, "enabled"),
                        opacity: store.getValue(itm, "opacity"),
                    };
                }

                data.basemap_webmap.basemaps = array.map(
                    store.getValues(this.itemModel.root, "children"),
                    function (itm) {
                        return dump(itm);
                    }
                );
            },

            deserializeInMixin: function (data) {
                var value = data.basemap_webmap.basemaps;
                if (value === undefined) {
                    return;
                }

                array.forEach(
                    value,
                    function (i) {
                        this.itemStore.newItem(i, {
                            parent: this.itemModel.root,
                            attribute: "children",
                        });
                        this.itemIdx++;
                    },
                    this
                );

                // Switch to first node
                if (this.itemIdx > 0) {
                    this.widgetTree.set("path", [this.widgetTreeRootNodeId, 1]);
                }

                this._buildBasemapsDefault();
                const defaultBasemapId = this._getDefaultBasemapId();
                this.slBasemapDefault.set("value", defaultBasemapId);
                this._setDefaultBasemap(defaultBasemapId);
            },

            validateDataInMixin: function () {
                var success = true;

                array.every(
                    this.widgetTree.rootNode.getChildren(),
                    function (n) {
                        this.widgetTree.set("path", [
                            this.widgetTreeRootNodeId,
                            n.getIdentity(),
                        ]);
                        success =
                            success && this.widgetPropertiesForm.validate();
                        return success;
                    },
                    this
                );

                return success;
            },

            _hasBasemapResourceId: function (resourceId) {
                if (!this.itemStore) return;
                const basemapsItems = this.itemStore.getValues(
                    this.itemModel.root,
                    "children"
                );

                for (const item of basemapsItems) {
                    const resId = this.itemStore.getValue(item, "resource_id");
                    if (resId === resourceId) return true;
                }

                return false;
            },

            _buildBasemapsDefault: function () {
                if (!this.itemStore) return;

                const options = [{ value: -1, label: i18n.gettext("None") }];
                const basemapsItems = this.itemStore.getValues(
                    this.itemModel.root,
                    "children"
                );
                basemapsItems.forEach((item) => {
                    const value = this.itemStore.getValue(item, "resource_id");
                    const label = this.itemStore.getValue(item, "display_name");
                    options.push({ value, label });
                });

                this.slBasemapDefault.set("options", options);
                this.slBasemapDefault.set("value", this._getDefaultBasemapId());
            },

            _getDefaultBasemapId: function () {
                const basemapsItems = this.itemStore.getValues(
                    this.itemModel.root,
                    "children"
                );

                for (const item of basemapsItems) {
                    const enabled = this.itemStore.getValue(item, "enabled");
                    if (enabled) {
                        const resId = this.itemStore.getValue(
                            item,
                            "resource_id"
                        );
                        return resId;
                    }
                }

                return -1;
            },

            _setDefaultBasemap: function (resourceId) {
                const basemapsItems = this.itemStore.getValues(
                    this.itemModel.root,
                    "children"
                );
                for (const item of basemapsItems) {
                    const resId = this.itemStore.getValue(item, "resource_id");
                    this.itemStore.setValue(
                        item,
                        "enabled",
                        resId === resourceId
                    );
                }
            },
        }
    );
});
