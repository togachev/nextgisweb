from .base import WebmapLayerPlugin


class LayerInfoPlugin(WebmapLayerPlugin):
    amd_free = True

    @classmethod
    def is_layer_supported(cls, *, style, layer, webmap):
        payload = dict()

        if v := style.description:
            payload["description"] = v
        elif v := layer.description:
            payload["description"] = v
        else:
            payload["description"] = None

        return ("@nextgisweb/webmap/plugin/layer-info", payload)
