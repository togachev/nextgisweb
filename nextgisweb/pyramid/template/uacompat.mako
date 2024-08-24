<%inherit file='nextgisweb:pyramid/template/plain.mako' />

<%def name="title()"><% return tr(gettext("Browser compatibility test")) %></%def>

<%def name="head()">
    <style type="text/css">
        .supported {
            color: #3B3;
        }
        
        .unsupported {
            color: #B33;
        }
        
        .unknown {
            color: #333;
        }
    </style>
</%def>

%if mode == 'supported':
    <h2 class="supported">${tr(gettext("%(name)s %(current)s supported") % fargs)}</h2>
    <p>${tr(gettext("Web GIS browser compatibility test has been passed! The Web GIS should work fine."))}
%elif mode.startswith('unsupported_'):
    % if mode == 'unsupported_browser':
        <h2 class="unsupported">${tr(gettext("%(name)s not supported") % fargs)}</h2>
        <p>${tr(gettext("You're using %(name)s although it's not supported by the Web GIS. It's an outdated browser lacking required features. Try a different browser or contact your system administrator if another browser isn't available.") % fargs)}</p>
    %elif mode == 'unsupported_version':
        <h2 class="unsupported">${tr(gettext("%(name)s %(current)s not supported") % fargs)}</h2>
        <p>${tr(gettext("You're using %(name)s %(current)s although it's not supported by the Web GIS. It's an outdated version lacking required features. Contact your system administrator for upgrading to %(name)s %(required)s+ or try a different browser.") % fargs)}</p>
    %else:
        <% raise ValueError("Unknown mode value") %>
    %endif
    <p>${tr(gettext("If you still want to continue using the current browser, click the link below to bypass the compatibility test. The Web GIS or some features may degrade or fail  in this case."))}</p>
    <p><a href="${bypass}">${tr(gettext("I understood but want to proceed at my own risk. Skip the test!"))}</a></p>
%elif mode == 'unknown':
    <h2 class="unknown">${tr(gettext("Unknown browser"))}</h2>
    <p>${tr(gettext("If you are using an up-to-date browser the Web GIS should be fine."))}</p>
%else:
    <% raise ValueError("Unknown mode value") %>
%endif
