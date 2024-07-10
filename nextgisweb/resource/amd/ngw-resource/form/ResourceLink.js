define([
    "dojo/_base/declare",
    "dojo/request/xhr",
    "dijit/form/TextBox",
    "ngw-pyramid/route",
    "@nextgisweb/pyramid/api",
    "@nextgisweb/pyramid/i18n!",
    "dojo/text!./template/ResourceLink.hbs",
    // css
    "xstyle/css!./resource/ResourceLink.css",
], function (declare, xhr, TextBox, route, api, i18n, template) {
    return declare([TextBox], {
        templateString: template,

        _setValueAttr: function (id) {
            if (typeof id !== "number") {
                return;
            }

            this.link.href = api.routeURL("resource.show", id);

            const url = api.routeURL("resource.item", {
                id: id,
            });

            xhr.get(url, {
                handleAs: "json",
                headers: { "Accept": "application/json" },
            }).then(
                function (data) {
                    this.link.innerHTML = data.resource.display_name;
                }.bind(this),
                function () {
                    this.link.innerHTML = i18n.gettext("Resource") + " #" + id;
                }.bind(this)
            );
        },
    });
});
