<%
    try:
        metric_gl = request.env.core.settings_get('pyramid', 'metric_gl')
    except KeyError:
        metric_gl = ""
    
    glId = metric_gl['id']
    tags = metric_gl['tags']
%>

<script async src="https://www.googletagmanager.com/gtag/js?id=${glId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${glId}');
</script>