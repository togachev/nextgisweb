<%page args="title, hide_resource_filter=False"/>

<% return_url = request.GET['return'] if 'return' in request.GET else False %>

<%
    if request.is_authenticated:
        scope = True
    else:
        scope = False
%>

<div id="header" class="header">
    <div class="header__left">
        <div class="header__title">
            <a class="header__title-logo" href="${return_url if return_url else request.application_url}">
                %if return_url:
                    <img class="logo__pic" src="${request.static_url('asset/pyramid/return-button.svg')}"/>
                %else:
                    <%
                        if request.env.core.settings_exists('pyramid', 'logo'):
                            logo_url = request.route_url('pyramid.logo', _query=dict(
                                ckey=request.env.core.settings_get('pyramid', 'logo.ckey')))
                        else:
                            logo_url = request.static_url('asset/pyramid/nextgis_logo_s.svg')
                    %>
                    <img class="logo__pic" src="${logo_url}"/>
                %endif
            </a>
            <div id="link-resource"></div>
            <div class="header__title__inner">
                ${title}
            </div>
        </div>
    </div>
    <ul class="header-nav header__right">
        %if not hide_resource_filter:
            <li class="header-nav__item">
                <div class="header-resources-filter inputFilter" id="resourcesFilter"></div>
            </li>
        %endif
        <li id="avatar" class="header-nav__item"></li>
        %if request.env.pyramid.options['legacy_locale_switcher']:
            <li class="header-nav__item">
                %for locale in request.env.core.locale_available:
                    %if locale != request.locale_name:
                        <a href="${request.route_url('pyramid.locale', locale=locale, _query=dict(next=request.url))}">${locale.upper()}</a>
                    %endif
                %endfor
            </li>
        %endif
        <li id="menu" class="header-nav__item"></li>
    </ul>
</div>


<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/pyramid/layout",
        "@nextgisweb/resource/resources-filter",
    ], function (reactApp, layout, resourcesFilter) {
        reactApp.default(layout.Avatar, {}, document.getElementById("avatar"));
        reactApp.default(layout.Menu, {}, document.getElementById("menu"));

        %if not hide_resource_filter:
        reactApp.default(resourcesFilter.default, {
            onChange: function(v, opt) {
                window.location.href = opt.url
            }
        }, document.getElementById("resourcesFilter"));
        %endif
    });
</script>

<script type="text/javascript">
    require([
        "@nextgisweb/pyramid/link-resource",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) { 
        var props = ${json_js(dict(scope=scope))};  
        reactApp.default(
            comp.default,
            props,
            document.getElementById('link-resource')
        );
    });
</script>