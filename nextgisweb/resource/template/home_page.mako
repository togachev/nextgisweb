<%! from nextgisweb.resource.view import HOME_PAGE_JSENTRY %>
<%
    try:
        user = request.user
        is_administrator = user.is_administrator
    except Exception:
        is_administrator = False
    upath_info = request.upath_info,
    config = {
        "isAdministrator": is_administrator,
        "upath_info": upath_info,
        "type": "home_page",
    }
%>

<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div id="content" class="wrapper-home-page"></div>

<%include file="nextgisweb:gui/template/react_boot.mako" args="
    jsentry=HOME_PAGE_JSENTRY,
    name='Content',
    props={'config': config},
    element='content',
"/>