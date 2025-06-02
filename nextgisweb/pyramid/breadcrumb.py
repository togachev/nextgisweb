from typing import Any, Callable, Dict, ClassVar, Optional

from msgspec import Struct

BreadcrumbAdapter = Callable[[Any, Any], tuple["Breadcrumb", Any] | None]

Parent = Dict[Optional[str], int]

class Breadcrumb(Struct, kw_only=True):
    adapters: ClassVar[list[BreadcrumbAdapter]] = []

    title: str | None
    link: str
    id: int
    icon: str | None = None
    parent: Parent = None

    @classmethod
    def register(cls, func: BreadcrumbAdapter):
        cls.adapters.append(func)


def breadcrumb_path(obj, request):
    result = list()
    while obj is not None:
        for a in Breadcrumb.adapters:
            aresult = a(obj, request)
            if aresult is not None:
                brcr, obj = aresult
                assert isinstance(brcr, Breadcrumb)
                result.insert(0, brcr)
                obj = brcr.parent["parent"]
                break
        else:
            break
    return result
