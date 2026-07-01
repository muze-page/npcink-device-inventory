<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Observation_Ingest_Service
{
	private $assets;
	private $identities;
	private $observations;
	private $events;
	private $extractor;

	public function __construct(
		Npcink_Device_Inventory_Asset_Repository $assets,
		Npcink_Device_Inventory_Identity_Repository $identities,
		Npcink_Device_Inventory_Observation_Repository $observations,
		Npcink_Device_Inventory_Event_Service $events,
		Npcink_Device_Inventory_Identity_Extractor $extractor
	) {
		$this->assets = $assets;
		$this->identities = $identities;
		$this->observations = $observations;
		$this->events = $events;
		$this->extractor = $extractor;
	}

	public function ingest($payload)
	{
		if (!is_array($payload)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_payload', 'Request body must be a JSON object.', 400);
		}

		$observation_payload = isset($payload['observation']) && is_array($payload['observation'])
			? $payload['observation']
			: $payload;
		$identities = $this->extractor->extract($observation_payload);
		if (empty($identities)) {
			return Npcink_Device_Inventory_V3_Response::error('missing_identity', 'No stable identity was found in the observation.', 422);
		}

		$asset_id = $this->identities->find_asset_id_by_identities($identities);
		$mode = 'matched';
		$asset = null;

		if ($asset_id) {
			$asset = $this->assets->find_by_id($asset_id);
		}

		if (!$asset) {
			$mode = 'created';
			$asset = $this->assets->create($this->build_asset_input($observation_payload));
			if (!$asset) {
				return Npcink_Device_Inventory_V3_Response::error('asset_create_failed', 'Failed to create asset.', 500);
			}
			$asset_id = intval($asset['id']);
			$this->identities->add_many($asset_id, $identities);
			$this->events->record($asset_id, 'upload', 'created', 'Asset created from first observation.', array('identities' => $identities));
		} else {
			$this->identities->add_many(intval($asset['id']), $identities);
			$uploaded_owner = $this->uploaded_owner_name($observation_payload);
			if ($uploaded_owner !== '' && $uploaded_owner !== (string) $asset['owner_name']) {
				$updated_asset = $this->assets->update(
					$asset['uuid'],
					array(
						'owner_name' => $uploaded_owner,
					)
				);
				if ($updated_asset) {
					$this->events->record(
						intval($asset['id']),
						'upload',
						'owner_updated',
						'Asset owner updated from upload note.',
						array(
							'old_owner_name' => (string) $asset['owner_name'],
							'new_owner_name' => $uploaded_owner,
						)
					);
					$asset = $updated_asset;
				}
			}
		}

		$observation = $this->observations->create(intval($asset['id']), $this->build_observation_input($observation_payload));
		if (!$observation) {
			return Npcink_Device_Inventory_V3_Response::error('observation_create_failed', 'Failed to store observation.', 500);
		}

		$this->events->record(
			intval($asset['id']),
			'upload',
			'observation_received',
			'Device observation received.',
			array('observation_id' => intval($observation['id']), 'mode' => $mode)
		);

		return array(
			'data' => array(
				'mode' => $mode,
				'asset' => $this->format_asset($asset),
				'observation' => $this->format_observation($observation),
				'identities' => array_map(array($this, 'format_identity'), $this->identities->list_for_asset(intval($asset['id']))),
			),
		);
	}

	private function build_asset_input($payload)
	{
		$asset = isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$summary = isset($asset['summary']) && is_array($asset['summary']) ? $asset['summary'] : array();

		$name = !empty($summary['device_model']) ? $summary['device_model'] : 'Unnamed asset';
		$owner = $this->uploaded_owner_name($payload);

		return array(
			'asset_type' => 'pc',
			'asset_number' => '',
			'name' => $name,
			'owner_name' => $owner,
			'department' => '',
			'status' => 'active',
			'category' => 'computer',
			'purchase_price' => 0,
			'residual_value' => 0,
			'metadata' => array(
				'summary' => $summary,
			),
		);
	}

	private function uploaded_owner_name($payload)
	{
		$asset = isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$upload = isset($asset['upload']) && is_array($asset['upload']) ? $asset['upload'] : array();
		return !empty($upload['reported_user']) ? sanitize_text_field($upload['reported_user']) : '';
	}

	private function build_observation_input($payload)
	{
		$asset = isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$meta = isset($payload['_npcink_device']) && is_array($payload['_npcink_device']) ? $payload['_npcink_device'] : array();
		$collector = isset($meta['collector']) && is_array($meta['collector']) ? $meta['collector'] : array();
		$observed_at = !empty($collector['collected_at']) ? sanitize_text_field($collector['collected_at']) : current_time('mysql');

		return array(
			'source' => !empty($collector['name']) ? sanitize_key($collector['name']) : 'uploader',
			'schema_version' => !empty($meta['schema_version']) ? intval($meta['schema_version']) : 1,
			'observed_at' => $this->normalize_datetime($observed_at),
			'summary' => isset($asset['summary']) && is_array($asset['summary']) ? $asset['summary'] : array(),
			'hardware' => isset($asset['hardware']) && is_array($asset['hardware']) ? $asset['hardware'] : array(),
			'raw' => $payload,
		);
	}

	private function normalize_datetime($value)
	{
		$timestamp = strtotime($value);
		if (!$timestamp) {
			return current_time('mysql');
		}
		return gmdate('Y-m-d H:i:s', $timestamp);
	}

	private function format_asset($row)
	{
		return array(
			'id' => intval($row['id']),
			'uuid' => (string) $row['uuid'],
			'assetType' => (string) $row['asset_type'],
			'assetNumber' => (string) $row['asset_number'],
			'name' => (string) $row['name'],
			'ownerName' => (string) $row['owner_name'],
			'department' => (string) $row['department'],
			'status' => (string) $row['status'],
			'category' => (string) $row['category'],
			'purchasePrice' => floatval($row['purchase_price']),
			'residualValue' => floatval($row['residual_value']),
			'metadata' => $this->decode_json(isset($row['metadata_json']) ? $row['metadata_json'] : '', array()),
			'createdAt' => (string) $row['created_at'],
			'updatedAt' => (string) $row['updated_at'],
		);
	}

	private function format_identity($row)
	{
		return array(
			'id' => intval($row['id']),
			'assetId' => intval($row['asset_id']),
			'identityType' => (string) $row['identity_type'],
			'identityValue' => (string) $row['identity_value'],
			'confidence' => floatval($row['confidence']),
			'isPrimary' => intval($row['is_primary']) === 1,
			'source' => (string) $row['source'],
			'createdAt' => (string) $row['created_at'],
		);
	}

	private function format_observation($row)
	{
		return array(
			'id' => intval($row['id']),
			'assetId' => intval($row['asset_id']),
			'source' => (string) $row['source'],
			'schemaVersion' => intval($row['schema_version']),
			'observedAt' => (string) $row['observed_at'],
			'receivedAt' => (string) $row['received_at'],
			'summary' => $this->decode_json(isset($row['summary_json']) ? $row['summary_json'] : '', array()),
			'hardware' => $this->decode_json(isset($row['hardware_json']) ? $row['hardware_json'] : '', array()),
			'raw' => $this->decode_json(isset($row['raw_json']) ? $row['raw_json'] : '', array()),
		);
	}

	private function decode_json($value, $fallback)
	{
		if (!is_string($value) || $value === '') {
			return $fallback;
		}

		$decoded = json_decode($value, true);
		if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
			return $fallback;
		}

		return $decoded;
	}
}
