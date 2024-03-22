_GeometryLoading: function(file, size, name){
    var sizeLimit = 16777216;
    if (sizeLimit >= size) {
        const reader = new FileReader();
        reader.onload = () => {
            this._source.clear();
            this._sourceTRKPT.clear();
            let arrayBuffer = reader.result
            let arr = (new Uint8Array(reader.result)).subarray(0, 4);
            let fileSignature = "";
            for (let i = 0; i < arr.length; i++) {
                fileSignature += arr[i].toString(16);
            };

            let blob;
            switch (fileSignature) {
                case '3c3f786d':
                    this._format = new ol.format.GPX({featureProjection: this.displayProjection});
                    blob = new Blob([arrayBuffer], {type: 'application/gpx+xml'});
                    break;
                case '7ba2274':
                    this._format = new ol.format.GeoJSON({featureProjection: this.displayProjection});
                    blob = new Blob([arrayBuffer], {type: 'application/geo+json'});
                    break;
                case '7ba2020':
                    this._format = new ol.format.GeoJSON({featureProjection: this.displayProjection});
                    blob = new Blob([arrayBuffer], {type: 'application/geo+json'});
                    break;
                default:
                    return;
            }
            this._src = window.URL.createObjectURL(blob);
            this._source = new ol.source.Vector({
                url: this._src,
                format: this._format
            });

            this._overlay.olLayer.setSource(this._source);

            this._source.on('addfeature', (e) => {
                this._trkptType = document.querySelector('#trkptType');
                if (this._trkptType.checked === true) {
                    this._ZoomToExtentCustomFile();
                    if (e.feature.getGeometry().getType() == 'LineString' && fileSignature == '3c3f786d') {
                        this._GeneratePoint(e.feature.getGeometry());
                    } else if (e.feature.getGeometry().getType() == 'MultiLineString' && fileSignature == '3c3f786d') {
                        e.feature.getGeometry().getLineStrings().forEach((linestring) => {
                            this._GeneratePoint(linestring);
                        });
                    }
                }
                else {
                    this._ZoomToExtentCustomFile();
                }
            });

            domConstruct.destroy("CustomLayerPanel");

            this.CustomLayerPanel = domConstruct.create("div", {
                    id: "CustomLayerPanel",
                    innerHTML: `<div class="BlockCustomFileName">
                    <div class="customFileName">${name}</div>
                    <label><span title="Удалить слой" class="ClearCustomFileName ImportFileButton ol-control__icon">${icon.html({glyph: "delete"})}</span><label></div>`,
                    onclick: () => {
                        this._ZoomToExtentCustomFile();
                    }
                }, query('.fieldsetF')[0], 'after');

            on(this.CustomLayerPanel, [touch.press, 'change'], (e) => {
                e.stopPropagation();
            });

            on(query(".ClearCustomFileName")[0], [touch.press, 'change'], (e) => {
                this._source.clear();
                this._sourceTRKPT.clear();
                document.getElementById('fileselect').value = '';
                domConstruct.destroy("CustomLayerPanel");
                this._zoomToInitialExtent();
            });
        };
        reader.readAsArrayBuffer(file);
    }
    else if (sizeLimit < size) {
        domConstruct.destroy("CustomLayerPanel");
        document.getElementById('fileselect').value = '';
        this.CustomInfo = domConstruct.create("div", {
            id: "CustomLayerPanel",
            innerHTML: '<div class="ErrorCuctom">Файл больше: <span style="font-weight: bold;">' + sizeLimit/(1024*1024) + 'мб</span></div>',
        }, query('.fieldsetF')[0], 'after');
        on(this.CustomInfo, [touch.press, 'change'], (e) => {
            e.stopPropagation();
        });
    }
    else {
        return;
    }
},