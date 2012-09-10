<?php
    $renderer->assign('panel', PageRenderer::$root_panel);
    $city_name = WebApplication::getConfiguration('application.city');
    $renderer->assign('delphi_city_name',$city_name);
    $color = WebApplication::getConfiguration('application.color');
	$renderer->assign('color',$color);
			
			