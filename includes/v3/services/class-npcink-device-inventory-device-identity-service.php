<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Device_Identity_Service
{
	public const TYPE = 'device_uuid_v1';
	public const FALLBACK_TYPE = 'fallback_device_v1';

	public function primary_identity($payload)
	{
		$canonical = $this->from_observation($payload);
		if ($canonical['value'] !== '') {
			return array(
				'type' => self::TYPE,
				'value' => $canonical['value'],
				'confidence' => 100,
				'source' => 'server_recomputed',
			);
		}

		$fallback = $this->fallback_from_observation($payload);
		if ($fallback['value'] !== '') {
			return array(
				'type' => self::FALLBACK_TYPE,
				'value' => $fallback['value'],
				'confidence' => 100,
				'source' => 'server_recomputed',
			);
		}

		return array(
			'type' => '',
			'value' => '',
			'reason' => $canonical['reason'] . ',' . $fallback['reason'],
		);
	}

	public function from_observation($payload)
	{
		$asset = is_array($payload) && isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$hardware = isset($asset['hardware']) && is_array($asset['hardware']) ? $asset['hardware'] : array();
		return $this->from_parts($hardware);
	}

	public function from_parts($hardware)
	{
		$hardware = is_array($hardware) ? $hardware : array();
		$baseboard = isset($hardware['baseboard']) && is_array($hardware['baseboard']) ? $hardware['baseboard'] : array();
		$system = isset($hardware['system']) && is_array($hardware['system']) ? $hardware['system'] : array();
		$serial = $this->value(isset($baseboard['serial']) ? $baseboard['serial'] : (isset($baseboard['serialNumber']) ? $baseboard['serialNumber'] : ''));
		$manufacturer = $this->value(isset($baseboard['manufacturer']) ? $baseboard['manufacturer'] : '');
		$model = $this->value(isset($baseboard['product']) ? $baseboard['product'] : (isset($baseboard['model']) ? $baseboard['model'] : ''));
		$hardware_uuid = $this->value(isset($hardware['hardwareUuid']) ? $hardware['hardwareUuid'] : '');
		if ($hardware_uuid === '') {
			$hardware_uuid = $this->value(isset($system['uuid']) ? $system['uuid'] : '');
		}

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

	public function fallback_from_observation($payload)
	{
		$asset = is_array($payload) && isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$hardware = isset($asset['hardware']) && is_array($asset['hardware']) ? $asset['hardware'] : array();
		$system = isset($hardware['system']) && is_array($hardware['system']) ? $hardware['system'] : array();
		$baseboard = isset($hardware['baseboard']) && is_array($hardware['baseboard']) ? $hardware['baseboard'] : array();
		$bios = isset($hardware['bios']) && is_array($hardware['bios']) ? $hardware['bios'] : array();
		$candidates = array(
			array('hardware_uuid', isset($hardware['hardwareUuid']) ? $hardware['hardwareUuid'] : ''),
			array('system_uuid', isset($system['uuid']) ? $system['uuid'] : ''),
			array('system_serial', isset($system['serial']) ? $system['serial'] : (isset($system['serialNumber']) ? $system['serialNumber'] : '')),
			array('baseboard_serial', isset($baseboard['serial']) ? $baseboard['serial'] : (isset($baseboard['serialNumber']) ? $baseboard['serialNumber'] : '')),
			array('bios_serial', isset($bios['serial']) ? $bios['serial'] : (isset($bios['serialNumber']) ? $bios['serialNumber'] : '')),
		);
		$signal = null;
		foreach ($candidates as $candidate) {
			$value = $this->value($candidate[1]);
			if ($value !== '') {
				$signal = array($candidate[0], $value);
				break;
			}
		}
		if (!$signal) {
			return array('value' => '', 'reason' => 'missing_hardware_signal');
		}

		$mac = $this->physical_mac($hardware);
		if ($mac === '') {
			return array('value' => '', 'reason' => 'missing_physical_mac');
		}

		$source = $signal[0] . ':' . $signal[1] . '|primary_mac:' . $mac;
		return array(
			'value' => 'fallback-v1-' . substr(hash('sha256', $source), 0, 29),
			'reason' => '',
		);
	}

	private function physical_mac($hardware)
	{
		$network = isset($hardware['network']) && is_array($hardware['network']) ? $hardware['network'] : array();
		$candidates = array();
		if (isset($network['primary']) && is_array($network['primary'])) {
			$candidates[] = $network['primary'];
		}
		if (isset($network['interfaces']) && is_array($network['interfaces'])) {
			foreach ($network['interfaces'] as $interface) {
				if (is_array($interface)) {
					$candidates[] = $interface;
				}
			}
		}

		foreach ($candidates as $candidate) {
			if (!empty($candidate['virtual']) || !empty($candidate['internal'])) {
				continue;
			}
			if (!isset($candidate['mac']) || !is_scalar($candidate['mac'])) {
				continue;
			}
			$value = strtolower(str_replace('-', ':', trim((string) $candidate['mac'])));
			if (!preg_match('/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/', $value)) {
				continue;
			}
			if ($value !== '00:00:00:00:00:00' && $value !== 'ff:ff:ff:ff:ff:ff') {
				return $value;
			}
		}
		return '';
	}

	private function value($value)
	{
		if (!is_scalar($value)) {
			return '';
		}
		$value = preg_replace('/\s+/', ' ', strtolower(trim((string) $value)));
		$invalid = array(
			'',
			'0',
			'00000000',
			'00000000-0000-0000-0000-000000000000',
			'03000200-0400-0500-0006-000700080009',
			'ffffffff',
			'ffffffff-ffff-ffff-ffff-ffffffffffff',
			'xxxxxxxx',
			'default string',
			'n/a',
			'na',
			'invalid',
			'undefined',
			'not applicable',
			'to be filled by o.e.m.',
			'to be filled by oem',
			'not filled by o.e.m.',
			'none',
			'null',
			'not specified',
			'not available',
			'not present',
			'not provided',
			'not set',
			'unknown',
			'system serial number',
			'-',
		);
		$compact = preg_replace('/[^a-z0-9]/', '', $value);
		if (
			in_array($value, $invalid, true)
			|| $compact === ''
			|| preg_match('/^0+$/', $compact)
			|| preg_match('/^x+$/', $compact)
			|| (strlen($compact) >= 8 && preg_match('/^f+$/', $compact))
		) {
			return '';
		}
		return $value;
	}
}
