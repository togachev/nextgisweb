from pyramid import threadlocal
from nextgisweb.layer import IBboxLayer

from .base import WebmapLayerPlugin
from nextgisweb.resource import DataScope

class StyleSettingsPlugin(WebmapLayerPlugin):
    amd_free = True

    @classmethod
    def is_layer_supported(cls, layer, webmap):
        if IBboxLayer.providedBy(layer):
            request = threadlocal.get_current_request()
            write_permission = layer.has_permission(DataScope.write, request.user)
            if not write_permission:
                return False
            return ("@nextgisweb/webmap/plugin/style-settings", dict())
