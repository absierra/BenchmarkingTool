    <div id="header">
        <a href="/">
            <img src="/Resources/core/img/logos/palo_alto_logo.png" alt="City of Palo Alto">
        </a>
        <ul>
            <li{if $panel == 'index'} class="active">Explore City Finances{else}><a href="/">Explore City Finances</a>{/if}</li>
            <li{if $panel == 'about'} class="active">About City Finances{else}><a href="/about">About City Finances</a>{/if}</li>
            <li{if $panel == 'how_to'} class="active">How-To Guide{else}><a href="/how_to">How-To Guide</a>{/if}</li>
        </ul>
    </div>