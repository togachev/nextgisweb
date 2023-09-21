import pytest
from pyramid.config import Configurator
from pyramid.response import Response
from zope.interface import implementer

from nextgisweb.core.exception import IUserException

from .. import exception


@implementer(IUserException)
class ErrorTest(Exception):
    title = "Test title"
    message = "Test message"
    detail = "Test detail"
    data = dict()
    http_status_code = 418


class ExceptionTest(Exception):
    pass


@pytest.fixture(scope="module")
def app():
    from webtest import TestApp

    settings = dict()
    settings["error.err_response"] = exception.json_error_response
    settings["error.exc_response"] = exception.json_error_response

    config = Configurator(settings=settings)
    config.include(exception)

    def view_error(request):
        raise ErrorTest()

    config.add_route("error", "/error")
    config.add_view(view_error, route_name="error")

    def view_exception(request):
        raise ExceptionTest()

    config.add_route("exception", "/exception")
    config.add_view(view_exception, route_name="exception")

    def view_json(request):
        request.json
        request.json_body
        return Response("OK", status_code=200)

    config.add_route("json", "/json")
    config.add_view(view_json, route_name="json")

    yield TestApp(config.make_wsgi_app())


def test_error(app):
    resp = app.get("/error", status=418)
    rjson = resp.json

    del rjson["guru_meditation"]
    del rjson["traceback"]

    assert rjson == dict(
        title="Test title",
        message="Test message",
        detail="Test detail",
        exception="nextgisweb.pyramid.test.test_exception.ErrorTest",
        status_code=418,
    )


def test_exception(app):
    resp = app.get("/exception", status=500)
    rjson = resp.json

    del rjson["guru_meditation"]
    del rjson["traceback"]

    assert rjson.get("message", None) is not None
    del rjson["message"]

    assert rjson == dict(
        title="Internal server error",
        status_code=500,
        exception="nextgisweb.pyramid.exception.InternalServerError",
    )


def test_json(app):
    headers = {"Content-Type": "application/json"}

    data = r'{"almost": "json" . }'
    app.post("/json", data, headers, status=400)

    data = r'{"correct": "json"}'
    app.post("/json", data, headers, status=200)


def test_not_found_unauthorized(ngw_webtest_app):
    ngw_webtest_app.authorization = ("Basic", ("administrator", "invalid"))
    ngw_webtest_app.get("/invalid", status=404)
    ngw_webtest_app.get("/api/invalid", status=404)
