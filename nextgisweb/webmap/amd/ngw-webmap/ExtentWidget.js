define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/request/xhr",
    "ngw-pyramid/route",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "ngw-resource/serialize",
    "@nextgisweb/pyramid/i18n!",
    // resource
    "dojo/text!./template/ExtentWidget.hbs",
    // template
    "dijit/form/NumberTextBox",
    "dijit/form/CheckBox",
    "dijit/_Container",
    "dojox/layout/TableContainer",
    "ngw-resource/ResourceBox",
    "ngw-resource/form/ResourceLink",
    //css
    "xstyle/css!./template/resources/ExtentWidget.css"
], function (
    declare,
    lang,
    xhr,
    route,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    serialize,
    i18n,
    template
) {
    return declare([_WidgetBase, serialize.Mixin, _TemplatedMixin, _WidgetsInTemplateMixin], {
        title: i18n.gettext("Extent and bookmarks"),
        templateString: i18n.renderTemplate(template),
        serializePrefix: "webmap",
        
        clearBtn: undefined,
        clearBtnConst: undefined,
        LayerExtentId: undefined,
        LayerExtentConstId: undefined,
        postCreate: function () {
            this.inherited(arguments);

            // Layer selection and get its extent
            this.btnSetExtentFromLayer.on("click",
                lang.hitch(this, function () {
                    this.layerPicker.pick().then(lang.hitch(this,
                        function (itm) {
                            this.wLayerExtentId.set("value", itm.id);
                            this.LayerExtentId = itm.id;
                            xhr(route.layer.extent({ id: itm.id }), {
                                method: "GET",
                                handleAs: "json"
                            }).then(lang.hitch(this, function (data) {
                                var extent = data.extent;
                                this.wExtentLeft.set("value", extent.minLon);
                                this.wExtentRight.set("value", extent.maxLon);
                                this.wExtentTop.set("value", extent.maxLat);
                                this.wExtentBottom.set("value", extent.minLat);
                            }));
                        }
                    ));
                })
            );

            this.btnSetConstrainingExtent.on("click",
                lang.hitch(this, function () {
                    this.layerPicker.pick().then(lang.hitch(this,
                        function (itm) {
                            this.wLayerExtentConstId.set("value", itm.id);
                            this.LayerExtentConstId = itm.id;
                            xhr(route.layer.extent({ id: itm.id }), {
                                method: "GET",
                                handleAs: "json"
                            }).then(lang.hitch(this, function (data) {
                                var extent = data.extent;
                                this.wExtentLeftConst.set("value", extent.minLon);
                                this.wExtentRightConst.set("value", extent.maxLon);
                                this.wExtentTopConst.set("value", extent.maxLat);
                                this.wExtentBottomConst.set("value", extent.minLat);
                            }));
                        }
                    ));
                })
            );

            this.btnClearExtent.on("click",
                lang.hitch(this, function () {
                    this.clearBtn = true
                    this.wExtentLeft.set("value", null);
                    this.wExtentRight.set("value", null);
                    this.wExtentTop.set("value", null);
                    this.wExtentBottom.set("value", null);
                    this.wLayerExtentId.set("value", null);
                })
            );

            this.btnClearExtentConst.on("click",
                lang.hitch(this, function () {
                    this.clearBtnConst = true
                    this.wExtentLeftConst.set("value", null);
                    this.wExtentRightConst.set("value", null);
                    this.wExtentTopConst.set("value", null);
                    this.wExtentBottomConst.set("value", null);
                    this.wLayerExtentConstId.set("value", null);
                    
                })
            );

        },

        serializeInMixin: function (data) {
            if (data.webmap === undefined) { data.webmap = {}; }
            
            var value = data.webmap;

            value.extent_constrained = this.wExtentLeftConst.get("value") === null &&
                                            this.wExtentRightConst.get("value") === null &&
                                                this.wExtentTopConst.get("value") === null &&
                                                    this.wExtentBottomConst.get("value") === null &&
                                        this.wExtentLeftConst.get("value") === '' &&
                                            this.wExtentRightConst.get("value") === '' &&
                                                this.wExtentTopConst.get("value") === '' &&
                                                    this.wExtentBottomConst.get("value") === '' 
                                        ? false : true
                
            value.extent_left = this.wExtentLeft.get("value");
            value.extent_right = this.wExtentRight.get("value");
            value.extent_top = this.wExtentTop.get("value");
            value.extent_bottom = this.wExtentBottom.get("value");
            value.layer_extent_id = this.LayerExtentId;
            
            value.extent_left_const = this.wExtentLeftConst.get("value");
            value.extent_right_const = this.wExtentRightConst.get("value");
            value.extent_top_const = this.wExtentTopConst.get("value");
            value.extent_bottom_const = this.wExtentBottomConst.get("value");
            value.layer_extent_const_id = this.LayerExtentConstId;
            
            if (this.clearBtn === true) {
                value.extent_left = null;
                value.extent_right = null;
                value.extent_top = null;
                value.extent_bottom = null;
                value.layer_extent_id = null;
            }
            if (this.clearBtnConst === true) {
                value.extent_left_const = null;
                value.extent_right_const = null;
                value.extent_top_const = null;
                value.extent_bottom_const = null;
                value.layer_extent_const_id = null;
                value.extent_constrained = false
            } 
        },

        deserializeInMixin: function (data) {
            var value = data.webmap;

            this.wExtentLeft.set("value", value.extent_left);
            this.wExtentRight.set("value", value.extent_right);
            this.wExtentTop.set("value", value.extent_top);
            this.wExtentBottom.set("value", value.extent_bottom);
            this.wLayerExtentId.set("value", value.layer_extent_id);

            this.wExtentLeftConst.set("value", value.extent_left_const);
            this.wExtentRightConst.set("value", value.extent_right_const);
            this.wExtentTopConst.set("value", value.extent_top_const);
            this.wExtentBottomConst.set("value", value.extent_bottom_const);
            this.wLayerExtentConstId.set("value", value.layer_extent_const_id);
        }
    });
});