<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Backup_Restore_Controller
{
	private const SCHEMA = 'npcink-device-inventory/v3-admin-export';

	public function register_routes()
	{
		register_rest_route(
			'npcink-device-inventory/v1',
			'/backup-restore',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array($this, 'restore_backup'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);
	}

	public function admin_permissions_check()
	{
		if (!current_user_can('manage_options')) {
			return Npcink_Device_Inventory_V3_Response::error('forbidden', 'Administrator permission is required.', 403);
		}
		return true;
	}

	public function restore_backup($request)
	{
		$params = $request->get_json_params();
		if (!is_array($params) || !isset($params['backup']) || !is_array($params['backup'])) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_backup', 'Backup JSON is required.', 400);
		}

		$backup = $params['backup'];
		$validation = $this->validate_backup($backup);
		if (is_wp_error($validation)) {
			return $validation;
		}

		$dry_run = !empty($params['dryRun']);
		$summary = $this->summarize_backup($backup);
		if ($dry_run) {
			return rest_ensure_response(
				array(
					'data' => array(
						'dryRun' => true,
						'summary' => $summary,
					),
				)
			);
		}

		try {
			$result = $this->import_backup($backup, $summary);
		} catch (Exception $exception) {
			return Npcink_Device_Inventory_V3_Response::error('backup_restore_failed', $exception->getMessage(), 500);
		}

		return rest_ensure_response(
			array(
				'data' => array(
					'dryRun' => false,
					'summary' => $result,
				),
			)
		);
	}

	private function validate_backup($backup)
	{
		$schema = isset($backup['schema']) ? (string) $backup['schema'] : '';
		if ($schema !== self::SCHEMA) {
			return Npcink_Device_Inventory_V3_Response::error('unsupported_backup_schema', 'Unsupported backup schema.', 422);
		}

		$has_known_section = false;
		foreach (array('settings', 'assets', 'identities', 'events', 'observations') as $section) {
			if (array_key_exists($section, $backup)) {
				$has_known_section = true;
				break;
			}
		}

		if (!$has_known_section) {
			return Npcink_Device_Inventory_V3_Response::error('empty_backup', 'Backup does not contain importable sections.', 422);
		}

		return true;
	}

	private function summarize_backup($backup)
	{
		$identity_count = 0;
		if (!empty($backup['identities']) && is_array($backup['identities'])) {
			foreach ($backup['identities'] as $item) {
				if (is_array($item) && isset($item['identities']) && is_array($item['identities'])) {
					$identity_count += count($item['identities']);
				} else {
					$identity_count++;
				}
			}
		}

		return array(
			'schema' => isset($backup['schema']) ? (string) $backup['schema'] : '',
			'exportedAt' => isset($backup['exportedAt']) ? sanitize_text_field((string) $backup['exportedAt']) : '',
			'available' => array(
				'settings' => isset($backup['settings']) && is_array($backup['settings']) ? 1 : 0,
				'assets' => isset($backup['assets']) && is_array($backup['assets']) ? count($backup['assets']) : 0,
				'identities' => $identity_count,
				'events' => isset($backup['events']) && is_array($backup['events']) ? count($backup['events']) : 0,
				'observations' => isset($backup['observations']) && is_array($backup['observations']) ? count($backup['observations']) : 0,
			),
			'imported' => array(
				'settings' => 0,
				'assetsCreated' => 0,
				'assetsUpdated' => 0,
				'identitiesCreated' => 0,
				'observationsCreated' => 0,
				'eventsCreated' => 0,
			),
			'skipped' => array(
				'assets' => 0,
				'identities' => 0,
				'observations' => 0,
				'events' => 0,
			),
			'warnings' => array(
				'上传授权码、公开查询访问码明文、公开查询启用状态、客户端上传基础 URL 不会从备份恢复，请在正式站点重新配置。',
				'导入采用合并/更新策略，不会清空正式站点现有数据。',
			),
		);
	}

	private function import_backup($backup, $summary)
	{
		global $wpdb;

		$asset_map = array(
			'by_old_id' => array(),
			'by_uuid' => array(),
			'by_number' => array(),
		);

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Restore spans plugin-owned tables and needs transaction boundaries.
		$wpdb->query('START TRANSACTION');
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery

		try {
			if (isset($backup['settings']) && is_array($backup['settings'])) {
				$summary = $this->import_settings($backup['settings'], $summary);
			}
			if (isset($backup['assets']) && is_array($backup['assets'])) {
				$asset_result = $this->import_assets($backup['assets'], $summary, $asset_map);
				$summary = $asset_result['summary'];
				$asset_map = $asset_result['asset_map'];
			}
			if (isset($backup['identities']) && is_array($backup['identities'])) {
				$summary = $this->import_identities($backup['identities'], $summary, $asset_map);
			}
			if (isset($backup['observations']) && is_array($backup['observations'])) {
				$summary = $this->import_observations($backup['observations'], $summary, $asset_map);
			}
			if (isset($backup['events']) && is_array($backup['events'])) {
				$summary = $this->import_events($backup['events'], $summary, $asset_map);
			}
		} catch (Exception $exception) {
			// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- See transaction note above.
			$wpdb->query('ROLLBACK');
			// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
			throw $exception;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- See transaction note above.
		$wpdb->query('COMMIT');
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		$this->bump_cache_versions();

		return $summary;
	}

	private function import_settings($settings, $summary)
	{
		$options = Npcink_Device_Inventory_V3_Tables::options();
		if (array_key_exists('publicQueryPageSlug', $settings)) {
			$slug = sanitize_title((string) $settings['publicQueryPageSlug']);
			$options['public_query_page_slug'] = $slug ? $slug : 'public-search-page';
		}
		if (array_key_exists('observationRetentionDays', $settings)) {
			$options['observation_retention_days'] = max(0, intval($settings['observationRetentionDays']));
		}
		if (array_key_exists('assetNumberPrefix', $settings)) {
			$options['asset_number_prefix'] = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $settings['assetNumberPrefix']);
		}
		if (array_key_exists('depreciationPeriodMonths', $settings)) {
			$options['depreciation_period_months'] = max(1, intval($settings['depreciationPeriodMonths']));
		}
		if (array_key_exists('defaultResidualRate', $settings)) {
			$options['default_residual_rate'] = min(100, max(0, floatval($settings['defaultResidualRate'])));
		}
		if (array_key_exists('countAvailableAssetsOnly', $settings)) {
			$options['count_available_assets_only'] = (bool) $settings['countAvailableAssetsOnly'];
		}
		if (array_key_exists('deleteDataOnUninstall', $settings)) {
			$options['delete_data_on_uninstall'] = (bool) $settings['deleteDataOnUninstall'];
		}

		update_option(Npcink_Device_Inventory_V3_Tables::OPTION, $options);
		$summary['imported']['settings'] = 1;
		return $summary;
	}

	private function import_assets($assets, $summary, $asset_map)
	{
		global $wpdb;
		foreach ($assets as $asset) {
			if (!is_array($asset)) {
				$summary['skipped']['assets']++;
				continue;
			}

			$row = $this->asset_row_from_backup($asset);
			if ($row['uuid'] === '' || $row['asset_number'] === '') {
				$summary['skipped']['assets']++;
				continue;
			}

			$existing = $this->find_asset($row['uuid'], $row['asset_number']);
			if ($existing) {
				// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned table restore.
				$result = $wpdb->update(
					Npcink_Device_Inventory_V3_Tables::assets(),
					array(
						'asset_type' => $row['asset_type'],
						'asset_number' => $row['asset_number'],
						'name' => $row['name'],
						'owner_name' => $row['owner_name'],
						'department' => $row['department'],
						'status' => $row['status'],
						'category' => $row['category'],
						'purchase_price' => $row['purchase_price'],
						'residual_value' => $row['residual_value'],
						'metadata_json' => $row['metadata_json'],
						'updated_at' => $row['updated_at'],
					),
					array('id' => intval($existing['id'])),
					array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%f', '%s', '%s'),
					array('%d')
				);
				// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				if ($result === false) {
					throw new Exception('Failed to update asset backup row.');
				}
				$asset_id = intval($existing['id']);
				$summary['imported']['assetsUpdated']++;
			} else {
				// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned table restore.
				$result = $wpdb->insert(
					Npcink_Device_Inventory_V3_Tables::assets(),
					$row,
					array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%f', '%s', '%s', '%s')
				);
				// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				if ($result === false) {
					throw new Exception('Failed to create asset backup row.');
				}
				$asset_id = intval($wpdb->insert_id);
				$summary['imported']['assetsCreated']++;
			}

			$this->remember_asset($asset_map, $asset, $asset_id, $row['uuid'], $row['asset_number']);
		}

		return array('summary' => $summary, 'asset_map' => $asset_map);
	}

	private function import_identities($groups, $summary, $asset_map)
	{
		global $wpdb;
		foreach ($groups as $group) {
			if (!is_array($group)) {
				$summary['skipped']['identities']++;
				continue;
			}

			$identity_items = isset($group['identities']) && is_array($group['identities']) ? $group['identities'] : array($group);
			$asset_id = $this->asset_id_from_backup_reference($group, $asset_map);

			foreach ($identity_items as $identity) {
				if (!is_array($identity)) {
					$summary['skipped']['identities']++;
					continue;
				}
				$current_asset_id = $asset_id ? $asset_id : $this->asset_id_from_backup_reference($identity, $asset_map);
				$type = $this->backup_text($identity, array('identityType', 'type'), 'key');
				$value = $this->backup_text($identity, array('identityValue', 'value'), 'text');
				if (!$current_asset_id || $type === '' || $value === '') {
					$summary['skipped']['identities']++;
					continue;
				}

				$existing_asset_id = $this->identity_asset_id($type, $value);
				if ($existing_asset_id) {
					$summary['skipped']['identities']++;
					continue;
				}

				// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned table restore.
				$result = $wpdb->insert(
					Npcink_Device_Inventory_V3_Tables::identities(),
					array(
						'asset_id' => $current_asset_id,
						'identity_type' => $type,
						'identity_value' => $value,
						'confidence' => isset($identity['confidence']) ? floatval($identity['confidence']) : 100,
						'is_primary' => !empty($identity['isPrimary']) ? 1 : 0,
						'source' => $this->backup_text($identity, array('source'), 'key', 'import'),
						'created_at' => $this->backup_datetime($identity, 'createdAt'),
					),
					array('%d', '%s', '%s', '%f', '%d', '%s', '%s')
				);
				// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				if ($result === false) {
					throw new Exception('Failed to create identity backup row.');
				}
				$summary['imported']['identitiesCreated']++;
			}
		}
		return $summary;
	}

	private function import_observations($observations, $summary, $asset_map)
	{
		global $wpdb;
		foreach ($observations as $observation) {
			if (!is_array($observation)) {
				$summary['skipped']['observations']++;
				continue;
			}
			$asset_id = $this->asset_id_from_backup_reference($observation, $asset_map);
			$source = $this->backup_text($observation, array('source'), 'key', 'import');
			$observed_at = $this->backup_datetime($observation, 'observedAt');
			$schema_version = isset($observation['schemaVersion']) ? intval($observation['schemaVersion']) : 1;
			if (!$asset_id || $observed_at === '') {
				$summary['skipped']['observations']++;
				continue;
			}
			if ($this->observation_exists($asset_id, $source, $schema_version, $observed_at)) {
				$summary['skipped']['observations']++;
				continue;
			}

			// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned table restore.
			$result = $wpdb->insert(
				Npcink_Device_Inventory_V3_Tables::observations(),
				array(
					'asset_id' => $asset_id,
					'source' => $source,
					'schema_version' => $schema_version,
					'observed_at' => $observed_at,
					'received_at' => $this->backup_datetime($observation, 'receivedAt'),
					'summary_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode(isset($observation['summary']) && is_array($observation['summary']) ? $observation['summary'] : array()),
					'hardware_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode(isset($observation['hardware']) && is_array($observation['hardware']) ? $observation['hardware'] : array()),
					'raw_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode(isset($observation['raw']) && is_array($observation['raw']) ? $observation['raw'] : array()),
				),
				array('%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s')
			);
			// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			if ($result === false) {
				throw new Exception('Failed to create observation backup row.');
			}
			$summary['imported']['observationsCreated']++;
		}
		return $summary;
	}

	private function import_events($events, $summary, $asset_map)
	{
		global $wpdb;
		foreach ($events as $event) {
			if (!is_array($event)) {
				$summary['skipped']['events']++;
				continue;
			}

			$asset_id = $this->asset_id_from_backup_reference($event, $asset_map);
			$created_at = $this->backup_datetime($event, 'createdAt');
			$event_source = $this->backup_text($event, array('eventSource'), 'key', 'import');
			$event_type = $this->backup_text($event, array('eventType'), 'key', 'restored');
			$message = $this->backup_text($event, array('message'), 'textarea');
			if ($this->event_exists($asset_id, $event_source, $event_type, $message, $created_at)) {
				$summary['skipped']['events']++;
				continue;
			}

			// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned table restore.
			$result = $wpdb->insert(
				Npcink_Device_Inventory_V3_Tables::events(),
				array(
					'asset_id' => $asset_id ? $asset_id : null,
					'event_source' => $event_source,
					'event_type' => $event_type,
					'field_name' => $this->backup_text($event, array('fieldName'), 'text'),
					'old_value' => $this->backup_text($event, array('oldValue'), 'textarea'),
					'new_value' => $this->backup_text($event, array('newValue'), 'textarea'),
					'message' => $message,
					'actor_user_id' => isset($event['actorUserId']) ? intval($event['actorUserId']) : null,
					'actor_name' => $this->backup_text($event, array('actorName'), 'text'),
					'payload_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode(isset($event['payload']) && is_array($event['payload']) ? $event['payload'] : array()),
					'created_at' => $created_at,
				),
				array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s')
			);
			// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			if ($result === false) {
				throw new Exception('Failed to create event backup row.');
			}
			$summary['imported']['eventsCreated']++;
		}
		return $summary;
	}

	private function asset_row_from_backup($asset)
	{
		return array(
			'uuid' => $this->backup_text($asset, array('uuid'), 'text'),
			'asset_type' => $this->backup_text($asset, array('assetType'), 'key', 'custom'),
			'asset_number' => $this->backup_text($asset, array('assetNumber'), 'text'),
			'name' => $this->backup_text($asset, array('name'), 'text'),
			'owner_name' => $this->backup_text($asset, array('ownerName'), 'text'),
			'department' => $this->backup_text($asset, array('department'), 'text'),
			'status' => $this->backup_text($asset, array('status'), 'key', 'active'),
			'category' => $this->backup_text($asset, array('category'), 'text'),
			'purchase_price' => isset($asset['purchasePrice']) ? floatval($asset['purchasePrice']) : 0,
			'residual_value' => isset($asset['residualValue']) ? floatval($asset['residualValue']) : 0,
			'metadata_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode(isset($asset['metadata']) && is_array($asset['metadata']) ? $asset['metadata'] : array()),
			'created_at' => $this->backup_datetime($asset, 'createdAt'),
			'updated_at' => $this->backup_datetime($asset, 'updatedAt'),
		);
	}

	private function find_asset($uuid, $asset_number)
	{
		global $wpdb;
		$table = Npcink_Device_Inventory_V3_Tables::assets();
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned restore lookup.
		$row = $wpdb->get_row(
			$wpdb->prepare('SELECT * FROM %i WHERE uuid = %s LIMIT 1', $table, $uuid),
			ARRAY_A
		);
		if (!$row && $asset_number !== '') {
			$row = $wpdb->get_row(
				$wpdb->prepare('SELECT * FROM %i WHERE asset_number = %s LIMIT 1', $table, $asset_number),
				ARRAY_A
			);
		}
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		return $row;
	}

	private function remember_asset(&$asset_map, $asset, $asset_id, $uuid, $asset_number)
	{
		if (isset($asset['id'])) {
			$asset_map['by_old_id'][intval($asset['id'])] = $asset_id;
		}
		if ($uuid !== '') {
			$asset_map['by_uuid'][$uuid] = $asset_id;
		}
		if ($asset_number !== '') {
			$asset_map['by_number'][$asset_number] = $asset_id;
		}
	}

	private function asset_id_from_backup_reference($item, $asset_map)
	{
		$uuid = '';
		$asset_number = '';
		if (isset($item['asset']) && is_array($item['asset'])) {
			$asset = $item['asset'];
			$uuid = !empty($asset['uuid']) ? (string) $asset['uuid'] : '';
			$asset_number = !empty($asset['assetNumber']) ? (string) $asset['assetNumber'] : '';
			if ($uuid !== '' && isset($asset_map['by_uuid'][$uuid])) {
				return intval($asset_map['by_uuid'][$uuid]);
			}
			if ($asset_number !== '' && isset($asset_map['by_number'][$asset_number])) {
				return intval($asset_map['by_number'][$asset_number]);
			}
		}
		if (!empty($item['assetUuid']) && isset($asset_map['by_uuid'][(string) $item['assetUuid']])) {
			return intval($asset_map['by_uuid'][(string) $item['assetUuid']]);
		}
		if (!empty($item['assetNumber']) && isset($asset_map['by_number'][(string) $item['assetNumber']])) {
			return intval($asset_map['by_number'][(string) $item['assetNumber']]);
		}
		if (!empty($item['assetUuid'])) {
			$uuid = (string) $item['assetUuid'];
		}
		if (!empty($item['assetNumber'])) {
			$asset_number = (string) $item['assetNumber'];
		}
		if (isset($item['assetId']) && isset($asset_map['by_old_id'][intval($item['assetId'])])) {
			return intval($asset_map['by_old_id'][intval($item['assetId'])]);
		}
		if ($uuid !== '' || $asset_number !== '') {
			$existing = $this->find_asset($uuid, $asset_number);
			if ($existing) {
				return intval($existing['id']);
			}
		}
		return 0;
	}

	private function identity_asset_id($type, $value)
	{
		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned restore lookup.
		$asset_id = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT asset_id FROM %i WHERE identity_type = %s AND identity_value = %s LIMIT 1',
				Npcink_Device_Inventory_V3_Tables::identities(),
				$type,
				$value
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		return $asset_id ? intval($asset_id) : 0;
	}

	private function observation_exists($asset_id, $source, $schema_version, $observed_at)
	{
		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned restore lookup.
		$found = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT id FROM %i WHERE asset_id = %d AND source = %s AND schema_version = %d AND observed_at = %s LIMIT 1',
				Npcink_Device_Inventory_V3_Tables::observations(),
				$asset_id,
				$source,
				$schema_version,
				$observed_at
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		return !empty($found);
	}

	private function event_exists($asset_id, $source, $type, $message, $created_at)
	{
		global $wpdb;
		$asset_id = $asset_id ? intval($asset_id) : 0;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned restore lookup.
		$found = $asset_id
			? $wpdb->get_var(
				$wpdb->prepare(
					'SELECT id FROM %i WHERE asset_id = %d AND event_source = %s AND event_type = %s AND message = %s AND created_at = %s LIMIT 1',
					Npcink_Device_Inventory_V3_Tables::events(),
					$asset_id,
					$source,
					$type,
					$message,
					$created_at
				)
			)
			: $wpdb->get_var(
				$wpdb->prepare(
					'SELECT id FROM %i WHERE asset_id IS NULL AND event_source = %s AND event_type = %s AND message = %s AND created_at = %s LIMIT 1',
					Npcink_Device_Inventory_V3_Tables::events(),
					$source,
					$type,
					$message,
					$created_at
				)
			);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		return !empty($found);
	}

	private function backup_text($item, $keys, $mode = 'text', $fallback = '')
	{
		foreach ($keys as $key) {
			if (!array_key_exists($key, $item) || $item[$key] === null) {
				continue;
			}
			$value = is_scalar($item[$key]) ? (string) $item[$key] : '';
			if ($value === '') {
				continue;
			}
			if ($mode === 'key') {
				return sanitize_key($value);
			}
			if ($mode === 'textarea') {
				return sanitize_textarea_field($value);
			}
			return sanitize_text_field($value);
		}
		return $fallback;
	}

	private function backup_datetime($item, $key)
	{
		if (!isset($item[$key]) || !is_scalar($item[$key])) {
			return current_time('mysql');
		}
		$value = sanitize_text_field((string) $item[$key]);
		$timestamp = strtotime($value);
		if (!$timestamp) {
			return current_time('mysql');
		}
		return gmdate('Y-m-d H:i:s', $timestamp);
	}

	private function bump_cache_versions()
	{
		foreach (array('npcink_device_inventory_assets', 'npcink_device_inventory_identities', 'npcink_device_inventory_observations', 'npcink_device_inventory_events') as $group) {
			$version = wp_cache_get('list_version', $group);
			wp_cache_set('list_version', intval($version) + 1, $group);
		}
	}
}
