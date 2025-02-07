from typing import TYPE_CHECKING, Any, TypeVar, Union, get_args

from msgspec import NODEFAULT
from typing_extensions import Annotated, _AnnotatedAlias

from .http import ContentType
from .util import disannotate

T = TypeVar("T")

JSONType = Annotated[Any, ContentType.JSON]
AsJSON = Annotated[T, ContentType.JSON]


class _AnyOfRuntime:
    def __class_getitem__(cls, args):
        result = Annotated[Union[args], _AnyOfRuntime]  # type: ignore
        return result


class _GapRuntime:
    def __class_getitem__(cls, arg):
        _, extras = disannotate(arg)
        result = Annotated[(Any, _GapRuntime())]  # type: ignore

        # NODEFAULT will break everything if it's not filled by actual type
        result.__dict__["__origin__"] = NODEFAULT
        result.__dict__["__args__"] = (NODEFAULT,)

        # Remember existing annotations for fillgap()
        result.__dict__["__gap_metadata__"] = extras

        return result


if TYPE_CHECKING:
    AnyOf = Union
    Gap = Annotated[T, None]
else:
    AnyOf = _AnyOfRuntime
    Gap = _GapRuntime


def fillgap(placeholder: Any, type: Any):
    gap_metadata = placeholder.__dict__.pop("__gap_metadata__")
    assert isinstance(gap_metadata, tuple)

    origin, extras = disannotate(type)
    placeholder.__dict__["__origin__"] = origin
    placeholder.__dict__["__args__"] = (origin,)

    placeholder.__dict__["__metadata__"] = (
        *placeholder.__dict__["__metadata__"],
        *gap_metadata,
        *extras,
    )


def _anyof_explode(tdef):
    if type(tdef) is _AnnotatedAlias:
        if getattr(tdef, "__metadata__") == (_AnyOfRuntime,):
            return list(get_args(get_args(tdef)[0])), True
    return [tdef], False


def _update_from(args, source, classes):
    if source == ():
        return args

    result = list(args)
    for s in source:
        for i, c in enumerate(classes):
            if isinstance(s, c):
                result[i] = s

    return tuple(result)


def iter_anyof(tdef, *args, classes=None):
    if classes is None:
        classes = [type(a) for a in args]

    args = _update_from(args, getattr(tdef, "__metadata__", ()), classes)
    anyof_members = _anyof_explode(tdef)[0]
    for t in anyof_members:
        ta = _update_from(args, getattr(t, "__metadata__", ()), classes)
        yield (t, *ta)
