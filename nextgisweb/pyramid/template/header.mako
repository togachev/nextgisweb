<%!
    from pathlib import Path
    import nextgisweb.pyramid as m
    from nextgisweb.gui.view import REACT_BOOT_JSENTRY
    from nextgisweb.pyramid.view import LAYOUT_JSENTRY
    svglogo = None
%>

<%page args="title, hide_resource_filter=False"/>

<%
    return_url = request.GET['return'] if 'return' in request.GET else False

    try:
        user = request.user
        is_administrator = user.is_administrator
        is_guest = user.keyname == 'guest'

    except Exception:
        is_administrator = False
        is_guest = True
%>
<div id="header" class="ngw-pyramid-layout-header">
    <div class="panel-text">
        <a href="${return_url if return_url else request.application_url}">
            %if return_url:
                <img src="${request.static_url('asset/pyramid/return-button.svg')}"/>
            %elif request.env.core.settings_exists('pyramid', 'logo'):
                <% ckey = request.env.core.settings_get('pyramid', 'logo.ckey') %>
                <img src="${request.route_url('pyramid.asset.hlogo', _query=dict(ckey=ckey))}"/>
            %else:
                <%
                    global svglogo
                    if svglogo is None:
                        logo_path = Path(request.env.pyramid.options["logo"])
                        svglogo = Markup(logo_path.read_text())
                %>
                ${svglogo}
            %endif
        </a>
        <div id="link-resource"></div>
        <div class="text" title="${title}">${title}</div>
    </div>
    <div class="container">
        %if not hide_resource_filter:
            <div class="header-resources-filter" id="resourcesFilter"></div>
        %endif
        <div id="avatar"></div>
        %if request.env.pyramid.options['legacy_locale_switcher']:
            <div>
                %for locale in request.env.core.locale_available:
                    %if locale != request.locale_name:
                        <a href="${request.route_url('pyramid.locale', locale=locale, _query=dict(next=request.url))}">${locale.upper()}</a>
                    %endif
                %endfor
            </div>
        %endif
        <div id="menu"></div>
    </div>
</div>

<script type="text/javascript">
    Promise.all([
        ngwEntry(${json_js(REACT_BOOT_JSENTRY)}).then((m) => m.default),
        ngwEntry(${json_js(LAYOUT_JSENTRY)}),
    ]).then(([reactBoot, {Avatar, Menu, LinkResource}]) => {
        reactBoot(Avatar, {}, document.getElementById("avatar"));
        reactBoot(Menu, {}, document.getElementById("menu"));
        
        %if not hide_resource_filter:
            ngwEntry("@nextgisweb/resource/resources-filter").then(
                ({default: ResourcesFilter}) => reactBoot(
                    ResourcesFilter,
                    { onChange(v, opt) { window.location.href = opt.url } },
                    document.getElementById("resourcesFilter"),
                )
            );
        %endif

        %if not is_guest:
            reactBoot(LinkResource, {}, document.getElementById("link-resource"));
        %endif
    });
</script>