from typing import Union
from msgspec import Struct
from nextgisweb.env import Component


class MapgroupConfig(Struct):
    keyname: str
    display_name: str
    enabled: Union[bool, None]
    position: int


class MapgroupComponent(Component):

    def setup_pyramid(self, config):
        from . import api, view # noqa: F401

        api.setup_pyramid(self, config)

    def client_settings(self, request):
        return dict(
            groupmaps=self.groupmaps,
        )