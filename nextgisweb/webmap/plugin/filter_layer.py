from nextgisweb.feature_layer import IFeatureLayer
from .base import WebmapLayerPlugin
class FilterLayerPlugin(WebmapLayerPlugin):
    @classmethod
    def is_layer_supported(cls, layer, webmap):
        if IFeatureLayer.providedBy(layer):
            return ("@nextgisweb/webmap/filter-layer/plugin",  dict())



