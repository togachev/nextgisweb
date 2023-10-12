define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/date/locale",
    "dojo/request/xhr",
    "dojo/dom-class",
    "dojo/promise/all",
    "dojox/validate/regexp",
    "put-selector/put",
    "ngw-pyramid/route",
    "@nextgisweb/pyramid/i18n!",
    "ngw-lookup-table/cached",
    "./DisplayWidget",
    // css
    "xstyle/css!./resource/FieldsDisplayWidget.css",
], function (
    declare,
    lang,
    array,
    locale,
    xhr,
    domClass,
    all,
    regexp,
    put,
    route,
    i18n,
    lookupTableCached,
    DisplayWidget
) {
    var fieldsCache = {};

    return declare([DisplayWidget], {
        title: i18n.gettext("Attributes"),
        aliases: false,
        grid_visibility: false,
        urlRE: /^(\b(https?|ftp|file|mailto|tel|e1c):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])(\s+)?$/i,
        emailRE: new RegExp("^" + regexp.emailAddress() + "$"),

        buildRendering: function () {
            this.inherited(arguments);
            domClass.add(this.domNode, "ngw-feature-layer-FieldsDisplayWidget");
        },

        renderValue: function (value) {
            if (this.resourceId in fieldsCache) {
                this._render(value, fieldsCache[this.resourceId]);
            } else {
                // TODO: Here it would be nice to get not all the resource
                // but only needed part through API. Though not critical at the moment.

                xhr(route.resource.item({ id: this.resourceId }), {
                    method: "GET",
                    handleAs: "json",
                }).then(
                    lang.hitch(this, function (data) {
                        var fieldmap = {};
                        var deferreds = [];
                        array.forEach(
                            data.feature_layer.fields,
                            function (itm) {
                                fieldmap[itm.keyname] = itm;
                                if (itm.lookup_table !== null) {
                                    deferreds.push(
                                        lookupTableCached.load(
                                            itm.lookup_table.id
                                        )
                                    );
                                }
                            }
                        );

                        fieldsCache[this.resourceId] = fieldmap;
                        all(deferreds).then(
                            lang.hitch(this, function () {
                                this._render(value, fieldmap);
                            })
                        );
                    })
                );
            }
        },

        _render: function (value, fieldmap) {
            var tbody = put(
                this.domNode,
                "table.pure-table.pure-table-horizontal tbody"
            );

            for (var k in value) {
                var val = value[k];
                var field = fieldmap[k];

                if (this.compact && !fieldmap[k].grid_visibility) {
                    continue;
                }

                if (val === null) {
                    // pass
                } else if (field.datatype == "DATE") {
                    val = locale.format(
                        new Date(val.year, val.month - 1, val.day),
                        {
                            selector: "date",
                            formatLength: "medium",
                        }
                    );
                } else if (field.datatype == "TIME") {
                    val = locale.format(
                        new Date(0, 0, 0, val.hour, val.minute, val.second),
                        {
                            selector: "time",
                            formatLength: "medium",
                        }
                    );
                } else if (field.datatype == "DATETIME") {
                    val = locale.format(
                        new Date(
                            val.year,
                            val.month - 1,
                            val.day,
                            val.hour,
                            val.minute,
                            val.second
                        ),
                        {
                            formatLength: "medium",
                        }
                    );
                }

                if (val !== null) {
                    if (this.urlRE.test(val)) {
                        put(
                            tbody,
                            "tr th.display_name $ < td.value a[href=$][target='$'] $",
                            fieldmap[k].display_name,
                            val,
                            val.match(/https?:/) ? "_blank" : "_self",
                            val
                        );
                    } else if (this.emailRE.test(val)) {
                        put(
                            tbody,
                            "tr th.display_name $ < td.value a[href=$] $",
                            fieldmap[k].display_name,
                            "mailto:" + val,
                            val
                        );
                    } else {
                        if (field.lookup_table !== null) {
                            var lval = lookupTableCached.lookup(
                                field.lookup_table.id,
                                val
                            );
                            if (lval !== null) {
                                val = "[" + val + "] " + lval;
                            }
                        }
                        put(
                            tbody,
                            "tr th.display_name $ < td.value $",
                            fieldmap[k].display_name,
                            val
                        );
                    }
                } else {
                    put(
                        tbody,
                        "tr th.display_name $ < td.value span.null $",
                        fieldmap[k].display_name,
                        i18n.gettext("N/A")
                    );
                }
            }
        },
    });
});
