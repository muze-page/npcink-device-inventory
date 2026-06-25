<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_V3_Sanitizer
{
	const MAX_DEPTH = 12;
	const MAX_STRING_LENGTH = 10000;
	const MAX_KEY_LENGTH = 128;

	public static function json_value($value, $depth = 0)
	{
		if ($depth > self::MAX_DEPTH) {
			return null;
		}

		if (is_array($value)) {
			$sanitized = array();
			foreach ($value as $key => $item) {
				$sanitized_key = is_int($key)
					? $key
					: substr(sanitize_text_field((string) $key), 0, self::MAX_KEY_LENGTH);
				if ($sanitized_key === '') {
					continue;
				}
				$sanitized[$sanitized_key] = self::json_value($item, $depth + 1);
			}
			return $sanitized;
		}

		if (is_object($value)) {
			return self::json_value((array) $value, $depth + 1);
		}

		if (is_string($value)) {
			return sanitize_textarea_field(substr($value, 0, self::MAX_STRING_LENGTH));
		}

		if (is_bool($value) || is_int($value) || is_float($value) || is_null($value)) {
			return $value;
		}

		return sanitize_textarea_field(substr((string) $value, 0, self::MAX_STRING_LENGTH));
	}

	public static function json_encode($value)
	{
		return wp_json_encode(self::json_value($value));
	}
}
