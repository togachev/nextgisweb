from .base import WebmapLayerPlugin


class LayerInfoPlugin(WebmapLayerPlugin):
    @classmethod
    def is_layer_supported(cls, *, style, layer, webmap):
        payload = dict()

        if style.description is not None and layer.description is None:
            payload["description_style"] = style.description
        elif style.description is None and layer.description is not None:
            payload["description_layer"] = layer.description
        elif style.description is not None and layer.description is not None:
            payload["description_style"] = style.description
            payload["description_layer"] = layer.description

        return ("ngw-webmap/plugin/LayerInfo", payload)
