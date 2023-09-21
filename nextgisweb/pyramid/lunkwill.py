from urllib.parse import urlsplit, urlunsplit
from uuid import UUID

import urllib3
from pyramid.httpexceptions import HTTPBadRequest
from pyramid.response import Response


def setup_pyramid(comp, config):
    opts = comp.options.with_prefix("lunkwill")
    st = config.registry.settings

    st["lunkwill.url"] = "http://{}:{}".format(opts["host"], opts["port"])
    st["lunkwill.pool"] = urllib3.PoolManager()

    def lunkwill(request):
        v = request.headers.get("X-Lunkwill")
        if v is not None:
            v = v.lower()
            if v not in ("suggest", "require"):
                raise HTTPBadRequest(explanation="Invalid X-Lunkwill header")
            return v
        return None

    def lunkwill_request(request):
        v = request.headers.get("X-Lunkwill-Request")
        if v is not None:
            try:
                return UUID(v)
            except ValueError:
                raise HTTPBadRequest(explanation="Invalid X-Lunkwill-Request header")
        return None

    config.add_request_method(lunkwill, reify=True)
    config.add_request_method(lunkwill_request, reify=True)

    config.add_tween(
        "nextgisweb.pyramid.lunkwill.tween_factory",
        under=["nextgisweb.pyramid.api.cors_tween_factory"],
    )

    config.add_route(
        "lunkwill.summary",
        "/api/lunkwill/{id:str}/summary",
        get=proxy,
    )

    config.add_route(
        "lunkwill.response",
        "/api/lunkwill/{id:str}/response",
        get=proxy,
    )


def tween_factory(handler, registry):
    pool = registry.settings["lunkwill.pool"]
    headers_rm = {h.lower() for h in ("X-Lunkwill",)}

    def tween(request):
        if request.lunkwill is not None:
            url = urlrebase(request.url, registry.settings["lunkwill.url"])
            headers = {k: v for k, v in request.headers.items() if k.lower() not in headers_rm}
            resp = pool.request(
                request.method, url, headers=headers, body=request.body_file, retries=False
            )
            return Response(body=resp.data, status=resp.status, headerlist=resp.headers.items())

        return handler(request)

    return tween


def proxy(request):
    url = urlrebase(request.url, request.registry.settings["lunkwill.url"])
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("connection",)}
    headers["Connection"] = "close"
    pool = request.registry.settings["lunkwill.pool"]
    resp = pool.request(request.method, url, headers=headers, retries=False, preload_content=False)
    return Response(status=resp.status, headerlist=resp.headers.items(), app_iter=resp.stream())


def urlrebase(ngw_url, lw_url):
    return urlunsplit(urlsplit(lw_url)[0:2] + urlsplit(ngw_url)[2:])
