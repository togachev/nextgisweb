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
    "dojo/text!./template/LayerWidget.hbs",
    // template
    "dijit/form/ValidationTextBox",
    "dijit/form/Select",
    "dijit/form/ComboBox",
    "dojox/layout/TableContainer",
    "ngw-resource/ResourceBox",
    "ngw-pyramid/form/IntegerValueTextBox"
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
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, serialize.Mixin], {
        title: i18n.gettext("NoGeom layer"),
        templateString: i18n.renderTemplate(template),
        prefix: "nogeom_layer",

        postCreate: function () {
            this.inherited(arguments);

            this.fields.set("value", this.composite.operation == "create" ? "update" : "keep");

            // once connection is selected populate schemas
            this.wConnection.on("update", lang.hitch(this, this.populateSchemas));

            // track schema and table changes
            this.wSchema.watch("value", lang.hitch(this, function (attr, oldval, newval) {
                this.populateTables(newval);
            }));
            this.wTable.watch("value", lang.hitch(this, function (attr, oldval, newval) {
                this.populateColumns(this.wSchema.get("value"), newval);
            }));
        },

        serializeInMixin: function (data) {
            if (data.nogeom_layer === undefined) { data.nogeom_layer = {}; }
        },

        populateSchemas: function (connection) {
            this.connection = connection.value;
            this.schemas = {};
            xhr.get(route.nogeom.connection.nogeom_inspect(this.connection), {
                handleAs: "json"
            }).then(lang.hitch(this, function (response) {
                array.forEach(response, function (item) {
                    this.schemas[item.schema] = item.tables.concat(item.views);
                }, this);
                var data = array.map(Object.keys(this.schemas), function (schema) {
                    return { id: schema };
                });
                this.wSchema.set("store", new Memory({data: data}));
            }));
        },

        populateTables: function (schema) {
            if (!schema) { return; }
            var data = array.map(this.schemas[schema], function (table) {
                return { id: table };
            });
            this.wTable.set("store", new Memory({data: data}));
        },

        populateColumns: function (schema, table) {
            if (!table) { return; }
            xhr.get(route.nogeom.connection.nogeom_inspect.table(this.connection.id, table), {
                handleAs: "json",
                query: { schema: schema }
            }).then(lang.hitch(this, function (response) {
                var idcols = [];
                array.forEach(response, function (item) {
                    if (!item.type.toLowerCase().startsWith("geometry")) {
                        idcols.push({id: item.name});
                    }
                }, this);

                this.wColumnID.set("store", new Memory({data: idcols}));
            }));
        }
    });
});