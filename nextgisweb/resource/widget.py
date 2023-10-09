from .model import Resource

_registry = []


class WidgetMeta(type):
    def __init__(cls, name, bases, nmspc):
        super().__init__(name, bases, nmspc)
        if not nmspc.get("__abstract__", False):
            _registry.append(cls)


class WidgetBase:
    def __init__(self, operation, obj, request):
        self.operation = operation
        self.obj = obj
        self.request = request


class Widget(WidgetBase, metaclass=WidgetMeta):
    __abstract__ = True

    def is_applicable(self):
        operation = self.operation in self.__class__.operation
        resclass = not hasattr(self.__class__, "resource") or isinstance(
            self.obj,
            self.__class__.resource,
        )
        interface = not hasattr(
            self.__class__, "interface"
        ) or self.__class__.interface.providedBy(self.obj)
        return operation and resclass and interface

    def config(self):
        return dict()


class CompositeWidget(WidgetBase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.members = []
        for mcls in _registry:
            member = mcls(*args, **kwargs)
            if member.is_applicable():
                self.members.append(member)

    def config(self):
        result = dict()
        for m in self.members:
            result[m.amdmod] = m.config()
        return result


class ResourceWidget(Widget):
    resource = Resource
    operation = ("create", "update")
    amdmod = "@nextgisweb/resource/editor-widget"


class ResourcePermissionWidget(Widget):
    resource = Resource
    operation = ("update",)
    amdmod = "@nextgisweb/resource/permissions-widget"


class ResourceDescriptionWiget(Widget):
    resource = Resource
    operation = ("create", "update")
    amdmod = "@nextgisweb/resource/description-editor"
