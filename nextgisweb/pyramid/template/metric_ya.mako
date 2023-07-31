<%
    try:
        metric_ya = request.env.core.settings_get('pyramid', 'metric_ya')
    except KeyError:
        metric_ya = ""
    
    yaId = metric_ya['id']
    tags = metric_ya['tags']
%>

<script type="text/javascript" >
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    const tags = ${json_js(tags)}

    const obj = {}
    tags?.map(item => obj[item] = true)

    ym(${yaId}, "init", obj);
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/${yaId}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>