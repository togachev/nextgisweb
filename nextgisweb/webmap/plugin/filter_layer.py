from nextgisweb.layer import IBboxLayer
from .base import WebmapLayerPlugin

class FilterLayerPlugin(WebmapLayerPlugin):
    @classmethod
    def is_layer_supported(cls, layer, webmap):
        typeFilter = ["DATE", "DATETIME"]
        if IBboxLayer.providedBy(layer):
            datatype = [x for x in layer.fields if x.datatype in typeFilter]
            if datatype:
                return ("ngw-webmap/plugin/FilterLayer", dict())



