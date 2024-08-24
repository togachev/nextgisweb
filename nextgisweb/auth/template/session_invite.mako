<%inherit file='nextgisweb:pyramid/template/base.mako' />

<form action="${request.route_url('auth.session_invite')}"
    method="POST" style="text-align: center;" >

    <input name="sid" type="hidden" required value="${session_id}">
    <input name="expires" type="hidden" required value="${expires}">
    %if next_url:
        <input name="next" type="hidden" value="${next_url}">
    %endif

    <button class="dijit dijitReset dijitInline dijitButton--primary dijitButton"
            type="submit" value="">
        <span class="dijitReset dijitInline dijitButtonNode" >
            <span>
                ${tr(gettext('Sign in'))}
            </span>
        </span>
    </button>
</form>
