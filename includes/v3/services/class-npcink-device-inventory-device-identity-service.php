<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Device_Identity_Service
{
	public const TYPE = 'device_uuid_v1';

	public function from_observation($payload)
	{
		$asset = is_array($payload) && isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$identity = isset($asset['identity']) && is_array($asset['identity']) ? $asset['identity'] : array();
		$hardware = isset($asset['hardware']) && is_array($asset['hardware']) ? $asset['hardware'] : array();
		return $this->from_parts($identity, $hardware);
	}

	public function from_parts($identity, $hardware)
	{
		$identity = is_array($identity) ? $identity : array();
		$hardware = is_array($hardware) ? $hardware : array();
		$baseboard = isset($hardware['baseboard']) && is_array($hardware['baseboard']) ? $hardware['baseboard'] : array();
		$system = isset($hardware['system']) && is_array($hardware['system']) ? $hardware['system'] : array();
		$serial = $this->value(isset($baseboard['serial']) ? $baseboard['serial'] : (isset($baseboard['serialNumber']) ? $baseboard['serialNumber'] : ''));
		$manufacturer = $this->value(isset($baseboard['manufacturer']) ? $baseboard['manufacturer'] : '');
		$model = $this->value(isset($baseboard['product']) ? $baseboard['product'] : (isset($baseboard['model']) ? $baseboard['model'] : ''));
		$hardware_uuid = $this->value(isset($identity['hardware_uuid']) ? $identity['hardware_uuid'] : (isset($system['uuid']) ? $system['uuid'] : ''));

		if ($serial === '') {
			return array('value' => '', 'reason' => 'missing_baseboard_serial');
		}
		if ($hardware_uuid === '' && ($manufacturer === '' || $model === '')) {
			return array('value' => '', 'reason' => 'insufficient_board_signals');
		}

		$source = implode('|', array(
			'baseboard_manufacturer=' . $manufacturer,
			'baseboard_model=' . $model,
			'baseboard_serial=' . $serial,
			'hardware_uuid=' . $hardware_uuid,
		));
		return array(
			'value' => 'device-v1-' . substr(hash('sha256', $source), 0, 29),
			'reason' => '',
		);
	}

	private function value($value)
	{
		if (!is_scalar($value)) {
			return '';
		}
		$value = preg_replace('/\s+/', ' ', strtolower(trim((string) $value)));
		$invalid = array(
			'',
			'default string',
			'to be filled by o.e.m.',
			'to be filled by oem',
			'none',
			'null',
			'not specified',
			'not available',
			'not present',
			'unknown',
			'system serial number',
			'00000000-0000-0000-0000-000000000000',
			'03000200-0400-0500-0006-000700080009',
		);
		if (in_array($value, $invalid, true) || preg_match('/^0+$/', $value)) {
			return '';
		}
		return $value;
	}
}
