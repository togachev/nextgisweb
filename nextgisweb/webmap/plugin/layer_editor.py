from pyramid.threadlocal import get_current_request

from nextgisweb.feature_layer import IFeatureLayer, IWritableFeatureLayer
from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import DataScope

from .base import WebmapLayerPlugin


class LayerEditorPlugin(WebmapLayerPlugin):
    entry = jsentry("@nextgisweb/webmap/plugin/layer-editor")

    @classmethod
    def is_layer_supported(cls, layer, webmap):
        if IFeatureLayer.providedBy(layer):
            request = get_current_request()
            write_permission = layer.has_permission(DataScope.write, request.user)
            if not write_permission:
                return False
            return (
                cls.entry,
                dict(
                    writable=IWritableFeatureLayer.providedBy(layer),
                    geometry_type=layer.geometry_type,
                ),
            )
