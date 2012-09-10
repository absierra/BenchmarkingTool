{page wrapper="application" title="Delphi Solutions" meta_description="Delphi Solutions provides solutions to analyzing and visualizing big distributed data"}
{require name="mootools,pythia,core,header"}
<script type="text/javascript">
{literal}
    function share_facebook(){
        var u = location.href;
        var t = document.title;
        window.open('https://www.facebook.com/sharer.php?u=' + encodeURIComponent(u) + '&t=' + encodeURIComponent(t), 'sharer', 'toolbar=0,status=0,width=655,height=250');
        return false;
    }

    function share_twitter(){
        var u = location.href;
        var text = "Check out what I found on Delphi's Financial Transparency tool: " + u;
        window.open('https://twitter.com/share?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(text), 'sharer', 'toolbar=0,status=0,width=655,height=260');
        return false;
    }

    function share_google(){
        var u = location.href;
        window.open('https://plus.google.com/share?url=' + encodeURIComponent(u), 'sharer', 'menubar=no,resizable=yes,scrollbars=yes,toolbar=0,status=0,width=600,height=400');
        return false;
    }

{/literal}
</script>

<div id="content_wrapper">

    <div id="info" style="display:none"></div>

    {panel name="header"}

    <div id="controls">
        <div id="dropdowns" class="dropdowns">
        </div>
        <div id="dropdownsBenchmark" class="dropdowns">
        </div>
        <span id="notesButton" title="Annotations"></span>
        <div id="notesWrapper">
            <div id="notes">
                <p id="notesTitle"></p>
                <p id="notesText"></p>
                <ul id="notesNav">
                    <li class="active"></li>
                    <li></li>
                    <li></li>
                </ul>
                <div id="notesNextWrapper"><span id="notesNext"></span></div>
                <div id="notesPrevWrapper"><span id="notesPrev"></span></div>
            </div>
        </div>
        <span id="downloadButton" title="Download Data"></span>
        <div id="downloadOptionsWrapper">
            <ul id="downloadOptions">
                <li>Download</li>
                <li class="subTitle">Current Graph</li>
                <li id="csvButton"><span></span>Spreadsheet (.csv)</li>
                <li id="imgButton">Image (.png)</li>
                <hr>
                <li class="subTitle">Palo Alto Budget</li>
                <li id="csvMultiButton"><a href="/Data/download.php?city=paloalto" target="_blank"><span></span>Spreadsheets (zipped .csv)</a></li>
                <li id="pdfMultiButton"><a href="/Resources/core/pdf/FY2013_Final_Operating_V4.pdf" target="_blank"><span></span>Document (.pdf)</a></li>
            </ul>
        </div>
        <a href="mailto:?subject=Subject Here&body=Body Here" id="emailCityField" target="_blank"><span id="emailCityButton" title="Ask your city about this graph"></span></a>

        <div id="graphButtons">
            <span id="stackedButton" class="graphButton" title="Stacked Line Graph"></span>
            <span id="percentageButton" class="graphButton" title="Percentage Stacked Line graph"></span>
            <span id="lineButton" class="graphButton" title="Line Graph"></span>
            <span id="pieButton" class="graphButton" title="Pie Graph"></span>
            <span id="tableButton" class="graphButton" title="Table"></span>
            <span id="sankeyButton" class="graphButton" title="Sankey"></span>
        </div>
    </div>

    <div id="visualize">
        <div id="graphTitle">
        </div>

        <div id="graphAndLegend">
            <div id="graph">
            </div>
            <div id="sliderWrapper">
                <ul id="sliderYears"></ul>
                <div id="slider">
                    <div id="handle"><div id="handleImg"></div></div>
                </div>
            </div>
            <div id="legend">
            </div>
        </div>

        <div id="table">
        </div>

    </div>

    <form id="csv" action="/echo.php" method="post" target="_blank">
        <input type="hidden" id="csvdata" name="csvdata" />
    </form>

    <form id="svg" action="/Data/png.php" method="post">
        <input type="hidden" id="svgdata" name="svgdata" />
        <input type="hidden" id="svgtitle" name="svgtitle" />
        <input type="hidden" id="svglegend" name="svglegend" />
        <input type="hidden" id="svgpieyear" name="svgpieyear" />
    </form>
    <div id="bottomRight">
    {*<div class='share st_facebook_custom' st_url="http://" st_title="" st_summary="" title="Share on Facebook"></div>*}
    <a rel="nofollow" href="javascript:void(0);" onclick="share_facebook();"><div class='share st_facebook_custom' title="Share on Facebook"></div></a>
    {*<div class='share st_googleplus_custom' st_url="http://" st_title="" st_summary="" title="Share on Google+"></div>*}
    <a rel="nofollow" href="javascript:void(0);" onclick="share_google();"><div class='share st_googleplus_custom' title="Share on Google+"></div></a>
    {*<div class='share st_twitter_custom' st_url="http://" st_title="" st_summary="" title="Share on Twitter"></div>*}
    <a rel="nofollow" href="javascript:void(0);" onclick="share_twitter();"><div class='share st_twitter_custom' title="Share on Twitter"></div></a>
    <div class='email_custom'><a href="mailto:?subject=Subject Here&body=Body Here" id="emailField" title="Share via Email" target="_blank"></a></div>
        <a href="http://www.delphi.us" target="_blank"><img src="/Resources/core/img/logo_powered_by_delphi.png" alt="Powered by Delphi" /></a>
    </div>

</div>
