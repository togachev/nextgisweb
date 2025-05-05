from nextgisweb.jsrealm import jsentry

from .base import WebmapLayerPlugin


class LayerInfoPlugin(WebmapLayerPlugin):
    entry = jsentry("@nextgisweb/webmap/plugin/layer-info")

    @classmethod
    def is_layer_supported(cls, *, style, layer, webmap):
        payload = dict()

        if style.description is not None and layer.description is None:
            payload["style_id"] = style.id
        elif style.description is None and layer.description is not None:
            payload["layer_id"] = layer.id
        elif style.description is not None and layer.description is not None:
            payload["style_id"] = style.id
            payload["layer_id"] = layer.id

        return (cls.entry, payload)
