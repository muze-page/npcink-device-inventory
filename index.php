<?php // Silence is golden

function allow_cors()
{
    header("Access-Control-Allow-Origin: *"); // 允许任何来源的跨域请求
}
add_action('init', 'allow_cors');
