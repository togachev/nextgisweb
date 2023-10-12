define([
    "dojo/Deferred",
    "dojo/promise/all",
    "@nextgisweb/pyramid/settings!",
], function (Deferred, all, settings) {
    return {
        load: function (name, preq, load) {
            var defs = {};

            var f = function (d) {
                return function (mod) {
                    d.resolve(mod);
                };
            };

            for (var k in settings.editor_widget) {
                var d = new Deferred(),
                    key = k,
                    mid = settings.editor_widget[key];
                defs[key] = d;
                require([mid], f(d));
            }

            all(defs).then(function (data) {
                load(data);
            });
        },
    };
});
