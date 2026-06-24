<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_V3_Response
{
	public static function error($code, $message, $status = 400, $details = null)
	{
		$data = array(
			'error' => array(
				'code' => $code,
				'message' => $message,
			),
		);
		if ($details !== null) {
			$data['error']['details'] = $details;
		}
		return new WP_Error($code, $message, array('status' => $status, 'details' => $data['error']));
	}

	public static function paginated($items, $page, $page_size, $total)
	{
		$page = max(1, intval($page));
		$page_size = max(1, intval($page_size));
		$total = max(0, intval($total));

		return array(
			'data' => array_values($items),
			'pagination' => array(
				'page' => $page,
				'pageSize' => $page_size,
				'totalItems' => $total,
				'totalPages' => (int) ceil($total / $page_size),
			),
		);
	}
}
