import os.path
import sys
import traceback
import warnings
from hashlib import md5

from pyramid import httpexceptions
from pyramid.renderers import render_to_response
from pyramid.request import RequestLocalCache
from pyramid.response import Response
from zope.interface import implementer
from zope.interface.interface import adapter_hooks

from nextgisweb.env import _
from nextgisweb.lib import json
from nextgisweb.lib.logging import logger

from nextgisweb.core.exception import IUserException, user_exception


def includeme(config):
    TM_TFACTORY = "pyramid_tm.tm_tween_factory"
    DT_TFACTORY = "pyramid_debugtoolbar.toolbar_tween_factory"

    ERR_TFACTORY = "nextgisweb.pyramid.exception.handled_exception_tween_factory"
    EXC_TFACTORY = "nextgisweb.pyramid.exception.unhandled_exception_tween_factory"

    config.add_tween(ERR_TFACTORY, over=(TM_TFACTORY, "MAIN"), under=(DT_TFACTORY, "INGRESS"))
    config.add_tween(EXC_TFACTORY, over=(DT_TFACTORY, ERR_TFACTORY))

    # PYRAMID REDEFINED METHODS FOR ERROR HANDLING / CACHING
    @RequestLocalCache()
    def json_body(req):
        try:
            return json.loadb(req.body)
        except ValueError as exc:
            user_exception(exc, title="JSON parse error", http_status_code=400)
            raise

    config.add_request_method(json_body, "json_body", property=True)
    config.add_request_method(json_body, "json", property=True)


def handled_exception_tween_factory(handler, registry):
    err_response = registry.settings["error.err_response"]

    def handled_exception_tween(request):
        try:
            response = handler(request)

            if isinstance(response, httpexceptions.HTTPError):
                eresp = err_response(request, IUserException(response), response, None)
                if eresp is not None:
                    return eresp

            return response

        except Exception as exc:
            if request.path_info.startswith("/test/request/"):
                raise

            try:
                err_info = IUserException(exc)
            except TypeError:
                err_info = None

            if err_info is not None:
                eresp = err_response(request, err_info, exc, sys.exc_info())
                if eresp is not None:
                    return eresp

            raise

    return handled_exception_tween


def unhandled_exception_tween_factory(handler, registry):
    exc_response = registry.settings["error.exc_response"]

    def unhandled_exception_tween(request):
        try:
            return handler(request)
        except Exception as exc:
            if request.path_info.startswith("/test/request/"):
                raise

            try:
                logger.exception("Uncaught exception %s at %s" % (exc_name(exc), request.url))
                iexc = InternalServerError(sys.exc_info())
                return exc_response(request, iexc, iexc, iexc.exc_info)
            except Exception:
                logger.exception("Exception while rendering error response at %s", request.url)
                return httpexceptions.HTTPInternalServerError()

    return unhandled_exception_tween


def exc_name(exc):
    cls = exc.__class__
    module = cls.__module__
    name = getattr(cls, "__qualname__", None)
    if name is None:
        name = cls.__name__
    if module == "exceptions" or module == "builtins":
        return name
    return "%s.%s" % (module, name)


def err_info_attr(err_info, exc, attr, default=None, warn=True):
    try:
        return getattr(err_info, attr)
    except AttributeError:
        if warn:
            warnings.warn("Exception {} doesn't provide attribute: {}".format(exc_name(exc), attr))
        return default


def guru_meditation(tb):
    """Calculate md5-hash from traceback"""

    tbhash = md5()
    for fn, line, func, text in tb:
        tbhash.update(
            "".join(
                (
                    # Only file name (without path) taken, so hash
                    # should not depend on package location.
                    os.path.split(fn)[-1],
                    str(line),
                    func,
                    text if text is not None else "",
                )
            ).encode("utf-8")
        )

    return tbhash.hexdigest()


def json_error(request, err_info, exc, exc_info, debug=True):
    exc_module = exc.__class__.__module__
    if exc_module is None or exc_module == str.__class__.__module__:
        return exc.__class__.__name__
    exc_full_name = exc_module + "." + exc.__class__.__name__

    result = dict()

    title = err_info_attr(err_info, exc, "title")
    if title is not None:
        result["title"] = request.localizer.translate(title)

    message = err_info_attr(err_info, exc, "message")
    if message is not None:
        result["message"] = request.localizer.translate(message)

    detail = err_info_attr(err_info, exc, "detail", warn=False)
    if detail is not None:
        result["detail"] = request.localizer.translate(detail)

    result["exception"] = exc_full_name
    result["status_code"] = err_info_attr(err_info, exc, "http_status_code", 500)

    data = err_info_attr(err_info, exc, "data")
    if data is not None and len(data) > 0:
        result["data"] = data

    if exc_info is not None:
        tb = traceback.extract_tb(exc_info[2])
        result["guru_meditation"] = guru_meditation(tb)
        if debug:
            result["traceback"] = [dict(zip(("file", "line", "func", "text"), itm)) for itm in tb]

    return result


def json_error_response(request, err_info, exc, exc_info, debug=True):
    return Response(
        json.dumpb(json_error(request, err_info, exc, exc_info, debug=debug)),
        content_type="application/json",
        status_code=err_info_attr(err_info, exc, "http_status_code", 500),
    )


def html_error_response(request, err_info, exc, exc_info, debug=True):
    response = render_to_response(
        "nextgisweb:pyramid/template/error.mako",
        dict(
            error_json=json_error(request, err_info, exc, exc_info, debug=debug),
            title=err_info_attr(err_info, exc, "title"),
            custom_layout=True,
        ),
        request=request,
    )

    response.status = err_info_attr(err_info, exc, "http_status_code", 500)
    return response


@implementer(IUserException)
class InternalServerError(Exception):
    title = _("Internal server error")
    message = _(
        "The server encountered an internal error or misconfiguration "
        "and was unable to complete your request."
    )
    detail = None

    http_status_code = 500

    def __init__(self, exc_info):
        self.exc_info = exc_info
        self.data = dict()


@adapter_hooks.append
def adapt_httpexception(iface, obj):
    if issubclass(iface, IUserException) and isinstance(
        obj, httpexceptions.HTTPError
    ):
        user_exception(
            obj, title=obj.title, message=obj.explanation, detail=None, http_status_code=obj.code
        )

        return IUserException(obj)


# Patch useful pyramid HTTP exceptions with translatable strings
for exc, title, explanation in (
    (
        httpexceptions.HTTPBadRequest,
        _("Bad request"),
        _(
            "The server could not comply with the request since "
            "it is either malformed or otherwise incorrect."
        ),
    ),
    (
        httpexceptions.HTTPPaymentRequired,
        _("Payment required"),
        _("Access was denied for financial reasons."),
    ),
    (
        httpexceptions.HTTPForbidden,
        _("Forbidden"),
        _("Access was denied to this resource."),
    ),
    (
        httpexceptions.HTTPNotFound,
        _("Page not found"),
        _(
            "The page may have been deleted or an error in the address. "
            "Correct the address or go to the home page and try to find the desired page."
        ),
    ),
    (
        httpexceptions.HTTPUnprocessableEntity,
        _("Unprocessable entity"),
        _("Unable to process the contained instructions."),
    ),
    (
        httpexceptions.HTTPInternalServerError,
        _("Internal server error"),
        _("The server has either erred or is incapable of performing " "the requested operation."),
    ),
    (
        httpexceptions.HTTPNotImplemented,
        _("Not implemented"),
        _("Not implemented"),
    ),
    (
        httpexceptions.HTTPServiceUnavailable,
        _("Service unavailable"),
        _("The server is currently unavailable. " "Please try again at a later time."),
    ),
):
    exc.title = title
    exc.explanation = explanation
