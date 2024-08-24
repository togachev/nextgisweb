<%page args="section" />
<%namespace file="nextgisweb:pyramid/template/clean.mako" import="clean_html"/>

%if obj.description is None:
    <p class="empty"><i>${tr(gettext("Resource description is empty."))}</i></p>
%else:
    ${ obj.description | clean_html, n }
%endif