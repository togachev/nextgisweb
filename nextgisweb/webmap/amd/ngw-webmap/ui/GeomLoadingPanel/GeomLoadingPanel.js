define([
    "@nextgisweb/pyramid/icon",
    "dojo/keys",
    "dojo/query",
    "dojo/touch",
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "ngw-pyramid/dynamic-panel/DynamicPanel",
    "dijit/layout/BorderContainer",
    "dojo/topic",
    "dojo/Deferred",
    "dojo/request/xhr",
    "openlayers/ol",
    "dojo/on",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/_base/array",
    "@nextgisweb/pyramid/api",
    // settings
    "@nextgisweb/pyramid/settings!webmap",
    // templates
    "dojo/text!./GeomLoadingPanel.hbs",
    // css
    "xstyle/css!./GeomLoadingPanel.css"
], function (
    icon,
    keys,
    query,
    touch,
    declare,
    i18n,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    DynamicPanel,
    BorderContainer,
    topic,
    Deferred,
    xhr,
    ol,
    on,
    domClass,
    domConstruct,
    lang,
    array,
    api,
    webmapSettings,
    template
) {


    return declare([DynamicPanel, BorderContainer], {
        elementForm: undefined,
        elementFieldset: undefined,
        element: undefined,
        elementChild: undefined,
        elemenFile: undefined,
        inputLabel: undefined,
        inputFile: undefined,
        inputType: undefined,
        featureZoom: undefined,


        constructor: function (options) {
            declare.safeMixin(this, options);

            this.contentWidget = new (declare(
                [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
                {
                    templateString: i18n.renderTemplate(template),
                    region: "top",
                    gutters: false
                }
            ))();
        },

        postCreate: function () {
            this.inherited(arguments);

            var widget = this;
 
            this.elementForm = domConstruct.create("form", {
                id: "upload",
            }, this.contentWidget.controlsNode);

            this.elementFieldset = domConstruct.create("fieldset", {
                class: "fieldsetF",
            }, this.elementForm);

            this.element = domConstruct.create("div", {
                style: "display: flex; align-items: center; justify-content: space-between;",
            }, this.elementFieldset);

            this.elementChild = domConstruct.create("div", {
            }, this.element);

            this.inputLabel = domConstruct.create("label", {
                for: "fileselect",
                class: "fileOpenFolder",
                title: "Выберите файлы",
                innerHTML: "Выберите файлы",
            }, this.elementChild);

            this.inputFile = domConstruct.create("input", {
                style:"display: none;",
                type: "file",
                id: "fileselect",
                accept: ".gpx,.geojson",
            }, this.elementChild);

            this.elementChildType = domConstruct.create("div", {
                class: "trkptBlock"
            }, this.element);

            this.inputType = domConstruct.create("input", {
                type: "checkbox",
                class: "trkptInput",
                id: "trkptType",
                onclick: () => {
                    widget.display._ClearCustomLayer();
                    widget.display._ClearCustomLayerTRKPT();
                    document.getElementById('fileselect').value = '';
                    domConstruct.destroy("CustomLayerPanel");
                    widget.display._zoomToInitialExtent();
                }
            }, this.elementChildType);

            this.inputTypeLabel = domConstruct.create("label", {
                for: "trkptType",
                class: "trkptLabel",
                title: "точки трека",
                innerHTML: "точки трека",
            }, this.elementChildType);

            this.featureZoom = domConstruct.create('div', {
                innerHTML: `<label><span class='ol-control__icon ImportFileButton'>${icon.html({glyph: "visibility"})}</span><label>`,
                title: "Перейти к слою",
                onclick: function() {
                    widget.display._ZoomToExtentCustomFile();
                },
            }, this.element);

            this.elemenFile = domConstruct.create("div", {
                id: "filedrag",
                innerHTML: "Или перетащите их сюда",
            }, this.elementFieldset);

            on(this.elemenFile, "dragover", function(e) {
                e.stopPropagation();
                e.preventDefault();
                e.target.className = (e.type == "dragover" ? "hover" : "");
            });

            on(this.elemenFile, "dragleave", function(e) {
                e.stopPropagation();
                e.preventDefault();
                e.target.className = (e.type == "dragover" ? "hover" : "");
            });

            on(this.elemenFile, "drop", function(e) {
                e.stopPropagation();
                e.preventDefault();
                e.target.className = (e.type == "dragover" ? "hover" : "");
                if (e.target.files || e.dataTransfer.files) {
                    var file = e.target.files || e.dataTransfer.files;
                    document.querySelector('#fileselect').files = e.dataTransfer.files;
                    var size = file[0].size;
                    var name = file[0].name;
                    widget.display._GeometryLoading(file[0], size, name);    
                }
            });

            on(this.inputFile, [touch.press, 'change'], (e) => {
                if (e.target.files[0] !== undefined) {
                    const target = e.target;
                    const file = target.files[0];
                    const size = target.files[0].size;
                    const name = target.files[0].name;
                    widget.display._GeometryLoading(file, size, name);
                }
            });

        },

    });
});
