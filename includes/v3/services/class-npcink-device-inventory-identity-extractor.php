<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Identity_Extractor
{
	public function extract($payload)
	{
		if (!is_array($payload)) {
			return array();
		}

		$identities = array();
		$meta = $this->array_path($payload, array('_npcink_device'));
		$asset = $this->array_path($payload, array('asset'));
		$identity = $this->array_path($asset, array('identity'));
		$hardware = $this->array_path($asset, array('hardware'));
		$system = $this->array_path($hardware, array('system'));
		$baseboard = $this->array_path($hardware, array('baseboard'));
		$bios = $this->array_path($hardware, array('bios'));

		$this->append($identities, 'stable_device_id_v2', isset($meta['stable_device_id_v2']) ? $meta['stable_device_id_v2'] : '', 100);
		$this->append($identities, 'stable_device_id_v2', isset($identity['stable_device_id_v2']) ? $identity['stable_device_id_v2'] : '', 100);
		$this->append($identities, 'hardware_uuid', isset($identity['hardware_uuid']) ? $identity['hardware_uuid'] : '', 95);
		$this->append($identities, 'system_uuid', isset($system['uuid']) ? $system['uuid'] : '', 90);
		$this->append($identities, 'system_serial', isset($system['serial']) ? $system['serial'] : '', 85);
		$this->append($identities, 'baseboard_serial', isset($baseboard['serial']) ? $baseboard['serial'] : '', 80);
		$this->append($identities, 'bios_serial', isset($bios['serial']) ? $bios['serial'] : '', 75);

		$primary_mac = isset($identity['primary_mac']) ? $identity['primary_mac'] : '';
		$this->append($identities, 'mac_address', $this->normalize_mac($primary_mac), 60);

		$macs = isset($identity['macs']) && is_array($identity['macs']) ? $identity['macs'] : array();
		foreach ($macs as $mac) {
			$this->append($identities, 'mac_address', $this->normalize_mac($mac), 50);
		}

		return $this->unique($identities);
	}

	private function append(&$identities, $type, $value, $confidence)
	{
		$value = $this->normalize_value($value);
		if ($value === '') {
			return;
		}
		$identities[] = array(
			'type' => $type,
			'value' => $value,
			'confidence' => $confidence,
			'source' => 'upload',
		);
	}

	private function unique($identities)
	{
		$seen = array();
		$result = array();
		foreach ($identities as $identity) {
			$key = $identity['type'] . ':' . $identity['value'];
			if (isset($seen[$key])) {
				continue;
			}
			$seen[$key] = true;
			$result[] = $identity;
		}
		return $result;
	}

	private function array_path($value, $path)
	{
		$current = is_array($value) ? $value : array();
		foreach ($path as $key) {
			if (!isset($current[$key]) || !is_array($current[$key])) {
				return array();
			}
			$current = $current[$key];
		}
		return $current;
	}

	private function normalize_value($value)
	{
		if (!is_scalar($value)) {
			return '';
		}
		$value = trim((string) $value);
		if ($value === '') {
			return '';
		}
		$lower = strtolower($value);
		$invalid = array(
			'default string',
			'to be filled by o.e.m.',
			'to be filled by oem',
			'none',
			'unknown',
			'00000000-0000-0000-0000-000000000000',
			'03000200-0400-0500-0006-000700080009',
		);
		if (in_array($lower, $invalid, true)) {
			return '';
		}
		return sanitize_text_field($value);
	}

	private function normalize_mac($value)
	{
		$value = strtolower(trim((string) $value));
		$value = str_replace('-', ':', $value);
		if (!preg_match('/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/', $value)) {
			return '';
		}
		if ($value === '00:00:00:00:00:00') {
			return '';
		}
		return $value;
	}
}
