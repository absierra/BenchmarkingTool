<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>{$page_title}</title>
<!--
        <script>
            window.city = "{$delphi_city_name}";
            window.revenue = "{$delphi_revenue}";
            window.employee = "{$delphi_employee}";
            window.steps = "{$delphi_steps}";
            window.lastYear = "{$delphi_lastYear}";
            window.types = {json variable="delphi_types"};
            window.feeNames = {json variable="delphi_feeNames"};
        </script>
-->
        {$head}
    </head>
    <body>
        {$content}
        <script type="text/javascript">
        {literal}
          var _gaq = _gaq || [];
          _gaq.push(['_setAccount', 'UA-34240078-1']);
          _gaq.push(['_trackPageview']);
          (function() {
            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
          })();
        {/literal}
        </script>
        <script type="text/javascript">
          {panel name="unique_categorizations"}
          {panel name="defaultData"}
        </script>

        <div id="overlay"></div>
    </body>
</html>
