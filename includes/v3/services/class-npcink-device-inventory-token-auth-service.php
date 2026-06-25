<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Token_Auth_Service
{
	public function verify_request(WP_REST_Request $request)
	{
		$options = Npcink_Device_Inventory_V3_Tables::options();
		$tokens = isset($options['client_tokens']) && is_array($options['client_tokens']) ? $options['client_tokens'] : array();
		$token_id = sanitize_key((string) $request->get_header('x-npcink-device-token-id'));
		$timestamp = sanitize_text_field((string) $request->get_header('x-npcink-device-timestamp'));
		$nonce = sanitize_text_field((string) $request->get_header('x-npcink-device-nonce'));
		$signature = sanitize_text_field((string) $request->get_header('x-npcink-device-signature'));

		if ($token_id === '' || $timestamp === '' || $nonce === '' || $signature === '') {
			return Npcink_Device_Inventory_V3_Response::error('missing_signature', 'Device upload signature headers are required.', 401);
		}

		if (!ctype_digit($timestamp) || strlen($nonce) > 128 || !preg_match('/^sha256=[a-f0-9]{64}$/', $signature)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_signature_headers', 'Device upload signature headers are invalid.', 401);
		}

		if (abs(time() - intval($timestamp)) > 300) {
			return Npcink_Device_Inventory_V3_Response::error('expired_signature', 'Device upload signature has expired.', 401);
		}

		$nonce_key = 'npcink_v3_upload_nonce_' . md5($token_id . ':' . $nonce);
		if (get_transient($nonce_key)) {
			return Npcink_Device_Inventory_V3_Response::error('replayed_nonce', 'Device upload nonce has already been used.', 401);
		}

		$token = null;
		foreach ($tokens as $candidate) {
			if (is_array($candidate) && isset($candidate['id']) && hash_equals((string) $candidate['id'], $token_id)) {
				$token = $candidate;
				break;
			}
		}

		if (!$token || empty($token['secret']) || empty($token['enabled'])) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_token', 'Device token is invalid or disabled.', 401);
		}

		$body_hash = hash('sha256', $request->get_body());
		$payload = $timestamp . "\n" . $nonce . "\n" . $body_hash;
		$expected = 'sha256=' . hash_hmac('sha256', $payload, (string) $token['secret']);
		if (!hash_equals($expected, $signature)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_signature', 'Device upload signature is invalid.', 401);
		}

		set_transient($nonce_key, 1, 5 * MINUTE_IN_SECONDS);

		return true;
	}
}
