from nextgisweb.layer import IBboxLayer
from .base import WebmapLayerPlugin
from collections import defaultdict


class FilterLayerPlugin(WebmapLayerPlugin):
    @classmethod
    def is_layer_supported(cls, layer, webmap):
        if IBboxLayer.providedBy(layer):
            fields = [f.to_dict() for f in layer.fields]
            return ("ngw-webmap/plugin/FilterLayer", fields)



