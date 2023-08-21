<%
    counterYa = ""
    tagsYa = ""
    counterGl = ""

    try:
        metric_ya=request.env.core.settings_get('pyramid', 'metric_ya' )
        if "counterId" in metric_ya:
            counterYa = metric_ya['counterId']
        if "tags" in metric_ya:
            tagsYa = metric_ya['tags']
    except KeyError:
        metric_ya=""
    
    try:
        metric_gl=request.env.core.settings_get('pyramid', 'metric_gl' )
        if "counterId" in metric_gl:
            counterGl = metric_gl['counterId']
    except KeyError:
        metric_gl=""
%>

%if not (counterYa is None) and not (counterYa == ''):
    <script type="text/javascript">
        (function (m, e, t, r, i, k, a) {
            m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
            m[i].l = 1 * new Date();
            for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
            k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
        })
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
        const tags = ${ json_js(tagsYa)}
        const obj = {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
        }
        if (tags) {
            tags.map(item => {obj[item] = true})
        }
        ym(${ counterYa }, "init", obj);
    </script>
    <noscript>
        <div><img src="https://mc.yandex.ru/watch/${counterYa}" style="position:absolute; left:-9999px;" alt="" /></div>
    </noscript>
%endif

%if not (counterGl is None) and not (counterGl == ''):
    <script async src="https://www.googletagmanager.com/gtag/js?id=${counterGl}"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${counterGl}');
    </script>
%endif
