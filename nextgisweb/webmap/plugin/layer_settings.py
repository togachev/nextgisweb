from pyramid import threadlocal
from nextgisweb.layer import IBboxLayer

from .base import WebmapLayerPlugin
from nextgisweb.feature_layer.view import PD_WRITE

class LayerSettingsPlugin(WebmapLayerPlugin):
    @classmethod
    def is_layer_supported(cls, layer, webmap):
        if IBboxLayer.providedBy(layer):
            request = threadlocal.get_current_request()
            write_permission = layer.has_permission(PD_WRITE, request.user)
            if not write_permission:
                return False
            return ("ngw-webmap/plugin/LayerSettings", dict())
