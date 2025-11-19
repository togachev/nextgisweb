from typing import Union

from msgspec import Struct

from nextgisweb.auth import User

from nextgisweb.env import Component, gettext, require
from .model import MapgroupResource

class MapgroupConfig(Struct):
    keyname: str
    display_name: str
    enabled: Union[bool, None]
    position: int

class MapgroupComponent(Component):
    @require("resource", "auth")
    def initialize_db(self):
        # Create a default web-map group if there are none
        # TODO: option to turn this off through settings
        if MapgroupResource.filter_by(parent_id=0).first() is None:
            dispname = self.env.core.localizer().translate(gettext("Main web map group"))
            MapgroupResource(
                parent_id=0,
                display_name=dispname,
                owner_user=User.filter_by(keyname="administrator").one(),
            ).persist()

    def setup_pyramid(self, config):
        from . import api, view # noqa: F401

        api.setup_pyramid(self, config)

    def client_settings(self, request):
        return dict(
            groupmaps=self.groupmaps,
        )