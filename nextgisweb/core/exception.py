from collections import namedtuple
from warnings import warn

from zope.interface import Attribute, Interface, classImplements, implementer
from zope.interface.interface import adapter_hooks

from nextgisweb.env import _


class IUserException(Interface):
    title = Attribute("General error description")
    message = Attribute("User friendly and secure message describing error")
    detail = Attribute("Information about fixing problem in Web GIS context")
    http_status_code = Attribute("Corresponding HTTP 4xx or 5xx status code")

    data = Attribute("Error specific JSON-serializable dictionary")


UserException = namedtuple('UserException', [
    'title', 'message', 'detail', 'http_status_code', 'data'])
classImplements(UserException, IUserException)


def user_exception(
    exc, title=None, message=None, detail=None,
    http_status_code=None, data=None
):
    exc.__user_exception__ = UserException(
        title=title, message=message, detail=detail,
        http_status_code=http_status_code,
        data=data if data else dict())
    return exc


@adapter_hooks.append
def adapt_exception_to_user_exception(iface, obj):
    if isinstance(obj, Exception) and issubclass(iface, IUserException):
        if hasattr(obj, '__user_exception__'):
            return obj.__user_exception__


@implementer(IUserException)
class UserException(Exception):
    title = None
    message = None

    def __init__(self, *args, **kwargs):
        # Some magic for compabilty with legacy error classes
        title = kwargs.get('title')
        message = kwargs.get('message')
        detail = kwargs.get('detail')
        data = kwargs.get('data')
        http_status_code = kwargs.get('http_status_code')

        if len(args) == 1 and message is None:
            message = args[0]
            warn(
                f"{self.__class__.__name__} keyword argument expected, got positional.",
                DeprecationWarning, stacklevel=2)
        elif len(args) > 0:
            raise ValueError("UserException accepts only keyword arguments!")

        def _self_attr(name, value):
            if value is not None:
                setattr(self, name, value)
            elif hasattr(self.__class__, name):
                setattr(self, name, getattr(self.__class__, name))
            else:
                # Do not set attribute for proper warnings
                pass

        _self_attr('message', message)
        _self_attr('detail', detail)
        _self_attr('title', title)
        _self_attr('data', dict(data) if data is not None else dict())

        _self_attr('http_status_code', http_status_code)

    def __str__(self):
        return "{}: {}".format(self.__class__.__name__, self.message)


class ValidationError(UserException):
    title = _("Validation error")
    http_status_code = 422


class ForbiddenError(UserException):
    title = _("Forbidden")
    http_status_code = 403


class InsufficientPermissions(UserException):
    title = _("Insufficient permissions")
    http_status_code = 403


class OperationalError(UserException):
    title = _("Operational error")
    http_status_code = 503


class ExternalServiceError(OperationalError):
    title = _("External service error")
