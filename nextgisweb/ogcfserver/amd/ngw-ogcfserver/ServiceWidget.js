define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dijit/layout/ContentPane",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/data/ItemFileWriteStore",
    "dijit/tree/TreeStoreModel",
    "dijit/Tree",
    "dijit/tree/dndSource",
    "@nextgisweb/pyramid/i18n!",
    "ngw-resource/serialize",
    // resource
    "dojo/text!./template/ServiceWidget.hbs",
    // template
    "ngw-resource/ResourcePicker",
    "ngw-resource/form/ResourceLink",
    "dijit/layout/TabContainer",
    "dojox/layout/TableContainer",
    "dijit/layout/BorderContainer",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "dijit/Dialog",
    "dijit/Toolbar",
    "dijit/form/Form",
    "ngw-pyramid/form/KeynameTextBox",
    "ngw-pyramid/form/DisplayNameTextBox",
    "ngw-pyramid/form/IntegerValueTextBox",
    "dijit/form/TextBox",
    "dijit/form/CheckBox",
    "dijit/form/NumberTextBox",
    "dijit/form/Select",
    "ngw-resource/Tree",
], function (
    declare,
    array,
    lang,
    domStyle,
    ContentPane,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    ItemFileWriteStore,
    TreeStoreModel,
    Tree,
    dndSource,
    i18n,
    serialize,
    template
) {
    var keyname_pattern = "^[A-Za-z][\\w]*$";

    return declare(
        [
            ContentPane,
            serialize.Mixin,
            _TemplatedMixin,
            _WidgetsInTemplateMixin,
        ],
        {
            title: i18n.gettext("OGC API Features service"),
            activateOn: { update: true },
            templateString: i18n.renderTemplate(template),

            constructor: function () {
                this.itemStore = new ItemFileWriteStore({
                    data: {
                        items: [{ item_type: "root" }],
                    },
                });

                this.itemModel = new TreeStoreModel({
                    store: this.itemStore,
                    query: {},
                });

                this.widgetTree = new Tree({
                    model: this.itemModel,
                    showRoot: false,
                    getLabel: function (item) {
                        return item.display_name;
                    },
                    getIconClass: function () {
                        return "dijitLeaf";
                    },
                    persist: false,
                    dndController: dndSource,
                    checkItemAcceptance: function (node, source, position) {
                        return position !== "over";
                    },
                    betweenThreshold: 5,
                });

                this.itemIdx = 0;
                this.widgetTreeRootNodeId =
                    this.widgetTree.rootNode.getIdentity();
            },

            _layerKeyname: function (item) {
                var re = new RegExp(keyname_pattern);
                var value = item.keyname || item.display_name;
                if (re.test(value)) {
                    return value;
                }
                value = value.replace(/[^\w]/g, "_");
                value = value.replace(/^_+|_+$/g, "");
                if (re.test(value)) {
                    return value;
                }
                return "layer_" + item.id;
            },

            postCreate: function () {
                this.inherited(arguments);

                this.widgetItemKeyname.pattern = keyname_pattern;

                // It is impossible to create a tree without a model, so
                // creating it manually
                this.widgetTree.placeAt(this.containerTree).startup();

                var widget = this;

                // Add new layer
                this.btnAddLayer.on(
                    "click",
                    lang.hitch(this, function () {
                        this.layerPicker.pick().then(
                            lang.hitch(this, function (itm) {
                                this.itemStore.newItem(
                                    {
                                        "keyname": this._layerKeyname(itm),
                                        "display_name": itm.display_name,
                                        "maxfeatures": 1000,
                                        "resource_id": itm.id,
                                    },
                                    {
                                        parent: widget.itemModel.root,
                                        attribute: "children",
                                    }
                                );
                                this.itemIdx++;
                                this.widgetTree.set("path", [
                                    this.widgetTreeRootNodeId,
                                    this.itemIdx,
                                ]);
                            })
                        );
                    })
                );

                // Remove a layer or group
                this.btnDeleteItem.on("click", function () {
                    var item = widget.widgetTree.selectedItem,
                        identity = widget.itemModel.getIdentity(item),
                        node = widget.widgetTree._itemNodesMap[identity][0],
                        prevSibling = node.getPreviousSibling(),
                        nextSibling = node.getNextSibling();

                    // Switch to next node
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
                });

                this.widgetTree.watch(
                    "selectedItem",
                    function (attr, oldValue, newValue) {
                        if (newValue) {
                            widget.widgetProperties.selectChild(
                                widget.paneLayer
                            );
                            widget.widgetItemKeyname.set(
                                "value",
                                widget.getItemValue("keyname")
                            );
                            widget.widgetItemDisplayName.set(
                                "value",
                                widget.getItemValue("display_name")
                            );
                            widget.widgetItemMaxFeatures.set(
                                "value",
                                widget.getItemValue("maxfeatures")
                            );
                            widget.widgetItemLink.set(
                                "value",
                                widget.getItemValue("resource_id")
                            );

                            // Initially the side panel with current element
                            // properties is hidden. As the element is selected
                            // - open it up.
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

                            // Activate layer/group deletion button
                            widget.btnDeleteItem.set("disabled", false);

                            // Move focus to required field with a key
                            widget.widgetItemKeyname.focus();
                        }
                    }
                );

                this.widgetItemKeyname.watch(
                    "value",
                    function (attr, oldValue, newValue) {
                        widget.setItemValue("keyname", newValue);
                    }
                );

                this.widgetItemDisplayName.watch(
                    "value",
                    function (attr, oldValue, newValue) {
                        widget.setItemValue("display_name", newValue);
                    }
                );

                this.widgetItemMaxFeatures.watch(
                    "value",
                    function (attr, oldValue, newValue) {
                        widget.setItemValue("maxfeatures", parseInt(newValue));
                    }
                );
            },

            // set current element attribute value
            setItemValue: function (attr, value) {
                this.itemStore.setValue(
                    this.widgetTree.selectedItem,
                    attr,
                    value
                );
            },

            // current element attribute value
            getItemValue: function (attr) {
                if (this.widgetTree.selectedItem) {
                    return this.itemStore.getValue(
                        this.widgetTree.selectedItem,
                        attr
                    );
                }
            },

            serializeInMixin: function (data) {
                if (data.ogcfserver_service === undefined) {
                    data.ogcfserver_service = {};
                }
                var store = this.itemStore;

                function dump(itm) {
                    return {
                        keyname: store.getValue(itm, "keyname"),
                        display_name: store.getValue(itm, "display_name"),
                        resource_id: store.getValue(itm, "resource_id"),
                        maxfeatures: store.getValue(itm, "maxfeatures"),
                    };
                }

                data.ogcfserver_service.collections = array.map(
                    store.getValues(this.itemModel.root, "children"),
                    function (i) {
                        return dump(i);
                    }
                );
            },

            deserializeInMixin: function (data) {
                var value = data.ogcfserver_service.collections;
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

                // On load mark the very first node
                if (this.itemIdx > 0) {
                    this.widgetTree.set("path", [this.widgetTreeRootNodeId, 1]);
                }
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
        }
    );
});
