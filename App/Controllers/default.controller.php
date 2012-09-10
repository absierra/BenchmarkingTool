<?php
$renderer->assign('delphi_city_name',WebApplication::getConfiguration('application.city'));
$renderer->assign('delphi_revenue',WebApplication::getConfiguration('application.revenue'));
$renderer->assign('delphi_employee',WebApplication::getConfiguration('application.employee'));
$renderer->assign('delphi_lastYear',WebApplication::getConfiguration('application.lastYear'));
$renderer->assign('delphi_steps',WebApplication::getConfiguration('application.steps'));
$renderer->assign('delphi_types',WebApplication::getConfiguration('application.types'));
$renderer->assign('delphi_feeNames',WebApplication::getConfiguration('application.feeNames'));
