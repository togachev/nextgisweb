from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Widget
from nextgisweb.webmap import WebMap


class MapgroupWebMapWidget(Widget):
    resource = WebMap
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/webmap-widget")