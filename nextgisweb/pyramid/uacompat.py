from binascii import crc32
from dataclasses import dataclass
from functools import lru_cache
from typing import Union

from pyramid.events import NewRequest
from pyramid.httpexceptions import HTTPSeeOther
from pyramid.response import Response

from nextgisweb.lib.config import Option, OptionAnnotations, OptionType

from .util import viewargs

FAMILIES = dict()


@dataclass(frozen=True)
class Family:
    identity: str
    alias: str
    required: Union[int, bool]


class VersionOptionType(OptionType):
    def __str__(self):
        return "int | bool"

    def loads(self, value):
        value = value.lower()
        if value in ("true", "yes"):
            return True
        elif value in ("false", "no"):
            return False
        else:
            return int(value)

    def dumps(self, value):
        return str(value).lower()


# fmt: off
BROWSER_FAMILIES = (
    Family("chrome", "Chrome", 118),           # 2023-10
    Family("safari", "Safari", 17),            # 2023-09
    Family("edge", "Edge", 116),               # 2023-09
    Family("firefox", "Firefox", 115),         # 2023-07 ESR
    Family("opera", "Opera", 104),             # 2023-10
    Family("ie", "Internet Explorer", False),  # Not supported
)
# fmt: on

opt_ann_list = [Option("uacompat.enabled", bool, default=True)]
for f in BROWSER_FAMILIES:
    FAMILIES[f.identity] = f
    opt_ann_list.append(
        Option(
            "uacompat." + f.identity,
            otype=VersionOptionType,
            default=f.required,
        )
    )

option_annotations = OptionAnnotations(opt_ann_list)


def get_header(request):
    return request.user_agent


@lru_cache(maxsize=64)
def parse_header(value):
    from ua_parser import user_agent_parser  # Slow import!

    if value is None:
        return None

    parsed = user_agent_parser.ParseUserAgent(value)
    fid = parsed["family"].lower()
    if fid not in FAMILIES:
        return None
    if parsed.get("major", None) is None:
        return None
    return fid, int(parsed["major"])


def hash_header(value):
    return "{:x}".format(crc32(value.encode("utf-8")))


def subscriber(event):
    request = event.request

    if request.method != "GET" or request.path_info.startswith(
        (
            "/api/",
            "/static/",
            "/uacompat",
            "/favicon.ico",
        )
    ):
        return

    options = request.env.pyramid.options.with_prefix("uacompat")
    if not options["enabled"]:
        return

    ua_str = get_header(request)
    if fam_ver := parse_header(ua_str):
        fam_id, cur = fam_ver
        req = options[fam_id]

        supported = req is True or (req and req <= cur)

        if not supported:
            hash = hash_header(ua_str)
            if request.cookies.get("ngw_uac") == hash:
                request.environ["pyramid.uacompat_bypass"] = fam_ver
                return

            raise HTTPSeeOther(
                location=request.route_path(
                    "pyramid.uacompat",
                    _query=dict(
                        fam=fam_id,
                        ver=cur,
                        next=request.path_qs,
                        hash=hash,
                    ),
                )
            )


@viewargs(renderer="uacompat.mako")
def page(request):
    arg_next = request.GET.get("next", request.application_url)
    arg_hash = request.GET.get("hash", None)
    arg_bypass = request.GET.get("bypass", "0").lower() == "1"

    ua_str = get_header(request)
    ua_hash = hash_header(ua_str) if ua_str is not None else None

    if arg_hash != ua_hash and arg_hash is not None:
        resp = Response(status=303, headerlist=[("Location", arg_next)])
        return resp

    if arg_bypass:
        resp = Response(status=303, headerlist=[("Location", arg_next)])
        resp.set_cookie("ngw_uac", ua_hash, max_age=86400)
        return resp

    fam_ver = parse_header(ua_str) if ua_str is not None else None

    ctx = dict()

    if fam_ver is not None:
        fam_id, cur = fam_ver
        fam = FAMILIES[fam_id]
        req = request.env.pyramid.options[f"uacompat.{fam_id}"]
        ctx["fargs"] = dict(
            name=fam.alias,
            current=str(cur),
            required=str(req) if type(req) is int else None,  # noqa: E721
        )

        supported = req is True or (req and req <= cur)
        ctx["mode"] = (
            "supported"
            if supported
            else ("unsupported_browser" if req is False else "unsupported_version")
        )

        qa_bypass = dict(bypass="1", hash=ua_hash)
        if arg_next != request.application_url:
            qa_bypass["next"] = arg_next
        ctx["bypass"] = request.route_url("pyramid.uacompat", _query=qa_bypass)

    else:
        ctx["mode"] = "unknown"

    return ctx


def setup_pyramid(comp, config):
    config.add_subscriber(subscriber, NewRequest)
    config.add_route("pyramid.uacompat", "/uacompat").add_view(page)
