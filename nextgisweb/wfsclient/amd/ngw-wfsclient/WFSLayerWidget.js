define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/request/xhr",
    "dojo/store/Memory",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "@nextgisweb/pyramid/i18n!",
    "ngw-resource/serialize",
    "ngw-pyramid/route",
    // resource
    "dojo/text!./template/WFSLayerWidget.hbs",
    // template
    "dijit/form/ValidationTextBox",
    "dijit/form/Select",
    "dijit/form/ComboBox",
    "dojox/layout/TableContainer",
    "ngw-resource/ResourceBox",
    "ngw-pyramid/form/IntegerValueTextBox",
], function (
    declare,
    array,
    lang,
    xhr,
    Memory,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    i18n,
    serialize,
    route,
    template
) {
    return declare(
        [
            _WidgetBase,
            _TemplatedMixin,
            _WidgetsInTemplateMixin,
            serialize.Mixin,
        ],
        {
            title: i18n.gettext("WFS layer"),
            templateString: i18n.renderTemplate(template),
            prefix: "wfsclient_layer",
            _deserialized: false,

            postCreate: function () {
                this.inherited(arguments);

                this.fields.set(
                    "value",
                    this.composite.operation == "create" ? "update" : "keep"
                );

                this.wConnection.on(
                    "update",
                    lang.hitch(this, this.populateLayers)
                );

                this.wLayer.watch(
                    "value",
                    lang.hitch(this, function (attr, oldval, newval) {
                        if (this._ready()) {
                            var store = this.wLayer.get("store");
                            var item = store.get(newval);
                            this.wGeometrySRID.set("value", item.srid);
                        }

                        this.populateColumns(newval);
                    })
                );
                this.wColumnGeometry.watch(
                    "value",
                    lang.hitch(this, function (attr, oldval, newval) {
                        if (this._ready()) {
                            var store = this.wColumnGeometry.get("store");
                            var item = store.get(newval);
                            var type = item.type
                                .replace(/^gml:/, "")
                                .replace(/PropertyType$/, "")
                                .toUpperCase();
                            this.wGeometryType.set("value", type);
                        }
                    })
                );
            },

            _ready: function () {
                return (
                    this.composite.operation == "create" || this._deserialized
                );
            },

            deserialize: function () {
                this.inherited(arguments);
                this._deserialized = true;
            },

            serializeInMixin: function (data) {
                if (data.wfsclient_layer === undefined) {
                    data.wfsclient_layer = {};
                }
                var value = data.wfsclient_layer;
                if (value.geometry_type === "") {
                    value.geometry_type = null;
                }
            },

            populateLayers: function (connection) {
                xhr.get(route.wfsclient.connection.inspect(connection.value), {
                    handleAs: "json",
                }).then(
                    lang.hitch(this, function (response) {
                        var data = array.map(response, function (layer) {
                            return { id: layer.name, srid: layer.srid };
                        });
                        this.wLayer.set("store", new Memory({ data: data }));
                    })
                );
            },

            populateColumns: function (layer_name) {
                if (!layer_name) {
                    return;
                }

                var connection_id = this.wConnection.get("value").id;
                xhr.get(
                    route.wfsclient.connection.inspect.layer(
                        connection_id,
                        this.wLayer.get("value")
                    ),
                    {
                        handleAs: "json",
                    }
                ).then(
                    lang.hitch(this, function (response) {
                        var geomcols = [];
                        array.forEach(
                            response,
                            function (item) {
                                if (item.type.startsWith("gml:")) {
                                    geomcols.push({
                                        id: item.name,
                                        type: item.type,
                                    });
                                }
                            },
                            this
                        );

                        this.wColumnGeometry.set(
                            "store",
                            new Memory({ data: geomcols })
                        );
                        if (this._ready() && geomcols.length === 1) {
                            this.wColumnGeometry.set("value", geomcols[0].id);
                        }
                    })
                );
            },
        }
    );
});
