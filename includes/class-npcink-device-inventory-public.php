<?php

if (!defined('ABSPATH')) {
	exit;
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Public search reads plugin-owned asset table and returns a limited allow-list response.

class Npcink_Device_Inventory_Public
{
	public function register_shortcode()
	{
		add_shortcode('npcink_device_inventory_public_search', array($this, 'render_public_search'));
	}

	public function register_routes()
	{
		register_rest_route(
			'npcink-device-inventory/v1',
			'/public-query',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array($this, 'query_assets'),
				'permission_callback' => '__return_true',
				'args' => array(
					'keyword' => array(
						'type' => 'string',
						'required' => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'accessCode' => array(
						'type' => 'string',
						'required' => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	public function render_public_search()
	{
		$options = Npcink_Device_Inventory_V3_Tables::options();
		$endpoint = rest_url('npcink-device-inventory/v1/public-query');
		$enabled = !empty($options['public_query_enabled']);
		$requires_code = !empty($options['public_query_access_code_hash']);
		$root_id = function_exists('wp_unique_id') ? wp_unique_id('npcink-public-query-') : 'npcink-public-query-' . wp_rand(1000, 999999);
		$config_data = array(
			'endpoint' => esc_url_raw($endpoint),
			'enabled' => $enabled,
			'requiresCode' => $requires_code,
			'rootId' => $root_id,
		);

		ob_start();
		?>
		<div id="<?php echo esc_attr($root_id); ?>" class="npcink-public-query" data-npcink-public-query>
			<div class="npcink-public-query__hero">
				<div>
					<div class="npcink-public-query__eyebrow"><?php echo esc_html__('设备资产管理', 'npcink-device-inventory'); ?></div>
					<h2><?php echo esc_html__('资产公开查询', 'npcink-device-inventory'); ?></h2>
					<p><?php echo esc_html__('输入资产编号或名称，查看允许公开展示的资产状态和归属信息。', 'npcink-device-inventory'); ?></p>
				</div>
				<span class="npcink-public-query__status <?php echo $enabled ? 'is-enabled' : 'is-disabled'; ?>">
					<?php echo $enabled ? esc_html__('可查询', 'npcink-device-inventory') : esc_html__('未启用', 'npcink-device-inventory'); ?>
				</span>
			</div>
			<?php if (!$enabled) : ?>
				<div class="npcink-public-query__notice">
					<strong><?php echo esc_html__('公开查询尚未启用', 'npcink-device-inventory'); ?></strong>
					<span><?php echo esc_html__('管理员可在插件设置中启用查询页面，并按需要设置访问码。', 'npcink-device-inventory'); ?></span>
				</div>
			<?php else : ?>
				<form class="npcink-public-query__form <?php echo $requires_code ? 'npcink-public-query__form--with-code' : ''; ?>" data-npcink-public-query-form>
					<div class="npcink-public-query__fields">
						<?php if ($requires_code) : ?>
							<label class="npcink-public-query__field">
								<span><?php echo esc_html__('访问码', 'npcink-device-inventory'); ?></span>
								<input type="password" name="accessCode" autocomplete="current-password" placeholder="<?php echo esc_attr__('请输入访问码', 'npcink-device-inventory'); ?>" />
							</label>
						<?php endif; ?>
						<label class="npcink-public-query__field">
							<span><?php echo esc_html__('查询内容', 'npcink-device-inventory'); ?></span>
							<input type="search" name="keyword" autocomplete="off" required placeholder="<?php echo esc_attr__('资产编号或资产名称', 'npcink-device-inventory'); ?>" />
						</label>
						<button type="submit"><?php echo esc_html__('查询资产', 'npcink-device-inventory'); ?></button>
					</div>
					<p><?php echo esc_html__('仅支持按资产编号或名称查询，不提供完整资产列表。', 'npcink-device-inventory'); ?></p>
				</form>
				<div class="npcink-public-query__message" data-npcink-public-query-message></div>
				<div class="npcink-public-query__results" data-npcink-public-query-results></div>
			<?php endif; ?>
		</div>
		<style>
			.npcink-public-query {
				--npcink-public-blue: #2f6fed;
				--npcink-public-blue-strong: #2155d8;
				--npcink-public-text: #17202f;
				--npcink-public-muted: #667085;
				--npcink-public-border: #d9e1ee;
				max-width: 980px;
				margin: 32px auto;
				padding: 0;
				background: #fff;
				border: 1px solid var(--npcink-public-border);
				border-radius: 16px;
				color: var(--npcink-public-text);
				font-size: 16px;
				line-height: 1.55;
				box-shadow: 0 18px 50px rgba(22, 31, 49, 0.08);
				overflow: hidden;
			}
			.npcink-public-query *,
			.npcink-public-query *::before,
			.npcink-public-query *::after {
				box-sizing: border-box;
			}
			.npcink-public-query__hero {
				display: flex;
				align-items: flex-start;
				justify-content: space-between;
				gap: 24px;
				padding: 34px 38px 30px;
				background: linear-gradient(135deg, #f6f9ff 0%, #ffffff 62%);
				border-bottom: 1px solid #e8edf5;
			}
			.npcink-public-query__eyebrow {
				margin-bottom: 10px;
				color: var(--npcink-public-blue);
				font-size: 13px;
				font-weight: 700;
				letter-spacing: 0.04em;
			}
			.npcink-public-query__hero h2 {
				margin: 0 0 8px;
				font-size: 30px;
				line-height: 1.25;
				font-weight: 700;
			}
			.npcink-public-query__hero p,
			.npcink-public-query__message,
			.npcink-public-query__notice {
				color: var(--npcink-public-muted);
			}
			.npcink-public-query__hero p {
				max-width: 600px;
				margin: 0;
			}
			.npcink-public-query__status {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				min-width: 76px;
				height: 30px;
				padding: 0 12px;
				border-radius: 999px;
				font-size: 13px;
				font-weight: 700;
				white-space: nowrap;
			}
			.npcink-public-query__status.is-enabled {
				color: #18633b;
				background: #e8f8ef;
			}
			.npcink-public-query__status.is-disabled {
				color: #8a4217;
				background: #fff2df;
			}
			.npcink-public-query__form {
				padding: 26px 38px 14px;
				border-bottom: 1px solid #eef2f7;
			}
			.npcink-public-query__fields {
				display: grid;
				grid-template-columns: minmax(0, 1fr) 132px;
				gap: 14px;
				align-items: end;
			}
			.npcink-public-query__form--with-code .npcink-public-query__fields {
				grid-template-columns: 210px minmax(0, 1fr) 132px;
			}
			.npcink-public-query__field {
				display: flex;
				flex-direction: column;
				gap: 8px;
				font-weight: 600;
			}
			.npcink-public-query__field span {
				font-size: 14px;
			}
			.npcink-public-query__form input {
				width: 100%;
				min-height: 46px;
				padding: 9px 14px;
				border: 1px solid #cfd8e6;
				border-radius: 10px;
				color: var(--npcink-public-text);
				font: inherit;
				background: #fff;
				outline: none;
				transition: border-color 0.16s ease, box-shadow 0.16s ease;
			}
			.npcink-public-query__form input:focus {
				border-color: var(--npcink-public-blue);
				box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
			}
			.npcink-public-query__form input::placeholder {
				color: #a8b1bf;
			}
			.npcink-public-query__form button {
				min-height: 46px;
				color: #fff;
				font-weight: 700;
				background: var(--npcink-public-blue);
				border: 0;
				border-radius: 10px;
				cursor: pointer;
				transition: background 0.16s ease, transform 0.16s ease;
			}
			.npcink-public-query__form button:hover {
				background: var(--npcink-public-blue-strong);
			}
			.npcink-public-query__form button:active {
				transform: translateY(1px);
			}
			.npcink-public-query__form button:disabled {
				cursor: wait;
				opacity: 0.72;
			}
			.npcink-public-query__form p {
				margin: 12px 0 0;
				color: var(--npcink-public-muted);
				font-size: 14px;
			}
			.npcink-public-query__message {
				min-height: 28px;
				padding: 16px 38px 0;
				font-size: 14px;
			}
			.npcink-public-query__message.is-error {
				color: #b42318;
			}
			.npcink-public-query__message.is-success {
				color: #2155d8;
			}
			.npcink-public-query__notice {
				display: grid;
				gap: 6px;
				margin: 30px 38px 38px;
				padding: 18px 20px;
				border: 1px solid #f5d29b;
				border-radius: 12px;
				background: #fffaf0;
			}
			.npcink-public-query__notice strong {
				color: #7a3b12;
			}
			.npcink-public-query__results {
				display: grid;
				gap: 12px;
				padding: 12px 38px 38px;
			}
			.npcink-public-query__card {
				overflow: hidden;
				padding: 0;
				border: 1px solid #e4eaf3;
				border-radius: 16px;
				background: #fff;
				box-shadow: 0 18px 42px rgba(22, 31, 49, 0.08);
			}
			.npcink-public-query__card-head {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 18px;
				padding: 20px 22px;
				background: linear-gradient(135deg, #f4f8ff 0%, #ffffff 68%);
				border-bottom: 1px solid #edf2f8;
			}
			.npcink-public-query__identity {
				display: flex;
				align-items: center;
				gap: 14px;
				min-width: 0;
			}
			.npcink-public-query__mark {
				display: grid;
				flex: 0 0 46px;
				width: 46px;
				height: 46px;
				place-items: center;
				color: #fff;
				font-size: 18px;
				font-weight: 800;
				background: linear-gradient(135deg, #2f6fed, #6f95ff);
				border-radius: 14px;
				box-shadow: 0 10px 24px rgba(47, 111, 237, 0.24);
			}
			.npcink-public-query__card-title {
				margin: 0;
				overflow: hidden;
				font-size: 21px;
				font-weight: 700;
				line-height: 1.28;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.npcink-public-query__card-subtitle {
				margin-top: 5px;
				color: var(--npcink-public-muted);
				font-size: 13px;
				font-weight: 600;
			}
			.npcink-public-query__badge {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				min-width: 64px;
				height: 30px;
				padding: 0 12px;
				border-radius: 999px;
				color: #2457c5;
				background: #eef4ff;
				font-size: 13px;
				font-weight: 700;
				white-space: nowrap;
			}
			.npcink-public-query__card dl {
				display: grid;
				grid-template-columns: repeat(4, minmax(0, 1fr));
				gap: 12px;
				margin: 0;
				padding: 18px 22px;
			}
			.npcink-public-query__meta-item {
				display: grid;
				gap: 5px;
				min-width: 0;
				padding: 13px 14px;
				background: #f8fafc;
				border: 1px solid #edf1f6;
				border-radius: 12px;
			}
			.npcink-public-query__card dt {
				color: var(--npcink-public-muted);
				font-size: 13px;
				font-weight: 600;
			}
			.npcink-public-query__card dd {
				margin: 0;
				overflow: hidden;
				color: var(--npcink-public-text);
				font-weight: 600;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.npcink-public-query__empty {
				padding: 34px 18px;
				text-align: center;
				border: 1px dashed #d4dce9;
				border-radius: 12px;
				color: var(--npcink-public-muted);
				background: #fbfcff;
			}
			.npcink-public-query__hardware {
				margin: 0 22px 22px;
				padding: 18px;
				background: linear-gradient(135deg, #fbfdff 0%, #f5f8ff 100%);
				border: 1px solid #e6edf8;
				border-radius: 14px;
			}
			.npcink-public-query__hardware h4 {
				margin: 0 0 14px;
				color: var(--npcink-public-text);
				font-size: 15px;
				font-weight: 700;
			}
			.npcink-public-query__hardware-grid {
				display: grid;
				grid-template-columns: repeat(5, minmax(0, 1fr));
				gap: 10px;
			}
			.npcink-public-query__spec {
				display: grid;
				gap: 8px;
				min-width: 0;
				padding: 12px;
				background: #fff;
				border: 1px solid #e6ecf5;
				border-radius: 12px;
			}
			.npcink-public-query__spec span {
				display: inline-flex;
				align-items: center;
				gap: 7px;
				color: var(--npcink-public-muted);
				font-size: 13px;
				font-weight: 600;
			}
			.npcink-public-query__spec span::before {
				content: attr(data-short);
				display: inline-grid;
				width: 24px;
				height: 24px;
				place-items: center;
				color: #2f6fed;
				font-size: 11px;
				font-weight: 800;
				background: #edf4ff;
				border-radius: 8px;
			}
			.npcink-public-query__spec strong {
				min-width: 0;
				overflow: hidden;
				color: var(--npcink-public-text);
				font-size: 14px;
				font-weight: 700;
				line-height: 1.35;
				text-overflow: ellipsis;
				white-space: normal;
			}
			@media (max-width: 780px) {
				.npcink-public-query {
					margin: 18px auto;
					border-radius: 12px;
				}
				.npcink-public-query__hero {
					padding: 24px;
					flex-direction: column;
				}
				.npcink-public-query__hero h2 {
					font-size: 25px;
				}
				.npcink-public-query__form,
				.npcink-public-query__message,
				.npcink-public-query__results {
					padding-left: 24px;
					padding-right: 24px;
				}
				.npcink-public-query__fields,
				.npcink-public-query__form--with-code .npcink-public-query__fields {
					grid-template-columns: 1fr;
				}
				.npcink-public-query__notice {
					margin: 24px;
				}
				.npcink-public-query__card dl {
					grid-template-columns: repeat(2, minmax(0, 1fr));
				}
				.npcink-public-query__hardware-grid {
					grid-template-columns: repeat(2, minmax(0, 1fr));
				}
				.npcink-public-query__form button {
					width: 100%;
				}
			}
			@media (max-width: 520px) {
				.npcink-public-query__card-head {
					align-items: flex-start;
					flex-direction: column;
				}
				.npcink-public-query__card-title {
					white-space: normal;
				}
				.npcink-public-query__card dl,
				.npcink-public-query__hardware-grid {
					grid-template-columns: 1fr;
				}
			}
		</style>
		<script>
			(function () {
				const config = <?php echo wp_json_encode($config_data); ?>;
				const root = document.getElementById(config.rootId);
				const form = root && root.querySelector('[data-npcink-public-query-form]');
				const message = root && root.querySelector('[data-npcink-public-query-message]');
				const results = root && root.querySelector('[data-npcink-public-query-results]');
				const button = form && form.querySelector('button[type="submit"]');
				if (!form || !message || !results || !config.enabled) {
					return;
				}
				const text = (value) => value === null || value === undefined || value === '' ? '-' : String(value);
				const escapeHtml = (value) => text(value).replace(/[&<>"']/g, (char) => ({
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#039;',
				}[char]));
				const setMessage = (content, type = '') => {
					message.textContent = content;
					message.className = `npcink-public-query__message${type ? ` is-${type}` : ''}`;
				};
				const row = (label, value) => `<div class="npcink-public-query__meta-item"><dt>${escapeHtml(label)}</dt><dd title="${escapeHtml(value)}">${escapeHtml(value)}</dd></div>`;
				const hardwareRow = (label, value, short) => value ? `<div class="npcink-public-query__spec"><span data-short="${escapeHtml(short)}">${escapeHtml(label)}</span><strong title="${escapeHtml(value)}">${escapeHtml(value)}</strong></div>` : '';
				const hardwareBlock = (hardware) => {
					if (!hardware || typeof hardware !== 'object') {
						return '';
					}
					const rows = [
						hardwareRow('CPU', hardware.cpu, 'CPU'),
						hardwareRow('内存', hardware.memory, 'RAM'),
						hardwareRow('硬盘', hardware.disk, 'SSD'),
						hardwareRow('显卡', hardware.graphics, 'GPU'),
						hardwareRow('主板 / 型号', hardware.baseboard, 'MB'),
					].filter(Boolean).join('');
					if (!rows) {
						return '';
					}
					return `<section class="npcink-public-query__hardware"><h4>硬件信息</h4><div class="npcink-public-query__hardware-grid">${rows}</div></section>`;
				};
				const render = (items) => {
					if (!items.length) {
						results.innerHTML = '<div class="npcink-public-query__empty">没有找到匹配资产，请确认编号或名称后重试。</div>';
						return;
					}
					results.innerHTML = items.map((item) => `
						<article class="npcink-public-query__card">
							<div class="npcink-public-query__card-head">
								<div class="npcink-public-query__identity">
									<div class="npcink-public-query__mark" aria-hidden="true">${escapeHtml((item.category || 'PC').slice(0, 2).toUpperCase())}</div>
									<div>
										<h3 class="npcink-public-query__card-title">${escapeHtml(item.name || item.assetNumber)}</h3>
										<div class="npcink-public-query__card-subtitle">资产编号 ${escapeHtml(item.assetNumber)}</div>
									</div>
								</div>
								<span class="npcink-public-query__badge">${escapeHtml(item.statusLabel)}</span>
							</div>
							<dl>
								${row('部门', item.department)}
								${row('分类', item.category)}
								${row('更新时间', item.updatedAt)}
							</dl>
							${hardwareBlock(item.hardware)}
						</article>
					`).join('');
				};
				form.addEventListener('submit', async function (event) {
					event.preventDefault();
					setMessage('查询中...');
					results.innerHTML = '';
					if (button) {
						button.disabled = true;
					}
					const data = new FormData(form);
					try {
						const response = await fetch(config.endpoint, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								keyword: data.get('keyword') || '',
								accessCode: data.get('accessCode') || '',
							}),
						});
						const payload = await response.json();
						if (!response.ok) {
							throw new Error(payload && payload.message ? payload.message : '查询失败');
						}
						const items = payload && payload.data ? payload.data : [];
						setMessage(items.length ? `找到 ${items.length} 条资产` : '', items.length ? 'success' : '');
						render(items);
					} catch (error) {
						setMessage(error && error.message ? error.message : '查询失败', 'error');
					} finally {
						if (button) {
							button.disabled = false;
						}
					}
				});
			}());
		</script>
		<?php
		return ob_get_clean();
	}

	public function query_assets($request)
	{
		$options = Npcink_Device_Inventory_V3_Tables::options();
		if (empty($options['public_query_enabled'])) {
			return new WP_Error('public_query_disabled', '公开查询尚未启用。', array('status' => 403));
		}

		if (!empty($options['public_query_access_code_hash'])) {
			$access_code = (string) $request->get_param('accessCode');
			if ($access_code === '' || !wp_check_password($access_code, (string) $options['public_query_access_code_hash'])) {
				return new WP_Error('invalid_access_code', '访问码不正确。', array('status' => 403));
			}
		}

		$keyword = trim((string) $request->get_param('keyword'));
		if ($keyword === '') {
			return new WP_Error('missing_keyword', '请输入资产编号或名称。', array('status' => 400));
		}

		global $wpdb;
		$table = Npcink_Device_Inventory_V3_Tables::assets();
		$observations_table = Npcink_Device_Inventory_V3_Tables::observations();
		$like = '%' . $wpdb->esc_like($keyword) . '%';
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT a.asset_number, a.name, a.department, a.status, a.category, a.updated_at,
					a.metadata_json,
					lo.summary_json AS latest_summary_json,
					lo.hardware_json AS latest_hardware_json
				FROM %i a
				LEFT JOIN %i lo ON lo.id = (
					SELECT o.id
					FROM %i o
					WHERE o.asset_id = a.id
					ORDER BY o.observed_at DESC, o.id DESC
					LIMIT 1
				)
				WHERE a.status <> 'deleted'
				AND (a.asset_number = %s OR a.name LIKE %s)
				ORDER BY a.updated_at DESC, a.id DESC
				LIMIT 10",
				$table,
				$observations_table,
				$observations_table,
				$keyword,
				$like
			),
			ARRAY_A
		);

		return rest_ensure_response(
			array(
				'data' => array_map(array($this, 'format_public_asset'), $rows ?: array()),
			)
		);
	}

	private function format_public_asset($row)
	{
		$status = isset($row['status']) ? (string) $row['status'] : '';
		$status_labels = array(
			'active' => '在用',
			'inactive' => '停用',
			'maintenance' => '维护',
			'retired' => '归档',
			'idle' => '闲置',
		);

		return array(
			'assetNumber' => isset($row['asset_number']) ? (string) $row['asset_number'] : '',
			'name' => isset($row['name']) ? (string) $row['name'] : '',
			'department' => isset($row['department']) ? (string) $row['department'] : '',
			'status' => $status,
			'statusLabel' => isset($status_labels[$status]) ? $status_labels[$status] : $status,
			'category' => isset($row['category']) ? (string) $row['category'] : '',
			'updatedAt' => isset($row['updated_at']) ? mysql2date('Y-m-d H:i', (string) $row['updated_at']) : '',
			'hardware' => $this->format_public_hardware($row),
		);
	}

	private function format_public_hardware($row)
	{
		$metadata = $this->decode_json(isset($row['metadata_json']) ? (string) $row['metadata_json'] : '', array());
		$imported_hardware = $this->get_record(isset($metadata['importedHardware']) ? $metadata['importedHardware'] : array());
		$imported_raw = $this->get_record(isset($imported_hardware['raw']) ? $imported_hardware['raw'] : array());
		$latest_summary = $this->decode_json(isset($row['latest_summary_json']) ? (string) $row['latest_summary_json'] : '', array());
		$latest_hardware = $this->decode_json(isset($row['latest_hardware_json']) ? (string) $row['latest_hardware_json'] : '', array());
		$has_latest = !empty($latest_summary) || !empty($latest_hardware);
		$summary = $has_latest ? $latest_summary : array(
			'cpu' => isset($imported_hardware['cpu']) ? $imported_hardware['cpu'] : '',
			'graphics' => isset($imported_hardware['graphics']) ? $imported_hardware['graphics'] : '',
			'device_model' => $this->first_text(
				isset($imported_hardware['deviceModel']) ? $imported_hardware['deviceModel'] : '',
				isset($this->get_record(isset($imported_raw['system']) ? $imported_raw['system'] : array())['model']) ? $this->get_record($imported_raw['system'])['model'] : ''
			),
		);
		$hardware = $has_latest ? $latest_hardware : $imported_raw;
		$hardware_summary = $this->hardware_summary($summary, $hardware);

		return array(
			'cpu' => $this->first_text($hardware_summary['cpu'], isset($imported_hardware['cpu']) ? $imported_hardware['cpu'] : ''),
			'memory' => $this->first_text(
				$this->format_bytes(isset($summary['memory_bytes']) ? $summary['memory_bytes'] : 0),
				isset($imported_hardware['memory']) ? $imported_hardware['memory'] : '',
				implode('；', $hardware_summary['memoryLines'])
			),
			'disk' => $this->first_text(
				$this->format_bytes(isset($summary['disk_bytes']) ? $summary['disk_bytes'] : 0),
				isset($imported_hardware['disk']) ? $imported_hardware['disk'] : '',
				$hardware_summary['primaryDisk']
			),
			'graphics' => $this->first_text($hardware_summary['graphics'], isset($imported_hardware['graphics']) ? $imported_hardware['graphics'] : ''),
			'baseboard' => $this->first_text($hardware_summary['baseboard'], $hardware_summary['deviceModel']),
		);
	}

	private function hardware_summary($summary, $hardware)
	{
		$summary = $this->get_record($summary);
		$hardware = $this->get_record($hardware);
		$cpu = $this->get_record(isset($hardware['cpu']) ? $hardware['cpu'] : array());
		$graphics = $this->get_record(isset($hardware['graphics']) ? $hardware['graphics'] : array());
		$controllers = $this->get_array(isset($graphics['controllers']) ? $graphics['controllers'] : array());
		$system = $this->get_record(isset($hardware['system']) ? $hardware['system'] : array());
		$baseboard = $this->get_record(isset($hardware['baseboard']) ? $hardware['baseboard'] : array());
		$disks = $this->get_array(isset($hardware['disks']) ? $hardware['disks'] : array());
		if (empty($disks)) {
			$disks = $this->get_array(isset($hardware['disk']) ? $hardware['disk'] : array());
		}
		if (empty($disks)) {
			$disks = $this->get_array(isset($hardware['diskLayout']) ? $hardware['diskLayout'] : array());
		}
		$memory = $this->get_array(isset($hardware['memory']) ? $hardware['memory'] : array());
		if (empty($memory)) {
			$memory = $this->get_array(isset($hardware['mem']) ? $hardware['mem'] : array());
		}
		if (empty($memory)) {
			$memory = $this->get_array(isset($hardware['memLayout']) ? $hardware['memLayout'] : array());
		}
		$primary_disk = !empty($disks) ? $this->get_record($disks[0]) : array();
		$primary_controller = !empty($controllers) ? $this->get_record($controllers[0]) : array();

		return array(
			'cpu' => $this->first_text(
				isset($summary['cpu']) ? $summary['cpu'] : '',
				isset($cpu['brand']) ? $cpu['brand'] : '',
				isset($cpu['model']) ? $cpu['model'] : '',
				isset($cpu['manufacturer']) ? $cpu['manufacturer'] : ''
			),
			'graphics' => $this->first_text(
				isset($summary['graphics']) ? $summary['graphics'] : '',
				isset($primary_controller['model']) ? $primary_controller['model'] : '',
				isset($graphics['model']) ? $graphics['model'] : ''
			),
			'deviceModel' => $this->first_text(
				isset($summary['device_model']) ? $summary['device_model'] : '',
				isset($system['model']) ? $system['model'] : ''
			),
			'baseboard' => $this->first_text(
				isset($baseboard['model']) ? $baseboard['model'] : '',
				isset($system['model']) ? $system['model'] : ''
			),
			'memoryLines' => $this->memory_lines($memory),
			'primaryDisk' => $this->first_text(
				isset($primary_disk['name']) ? $primary_disk['name'] : '',
				isset($primary_disk['device']) ? $primary_disk['device'] : '',
				isset($primary_disk['model']) ? $primary_disk['model'] : '',
				isset($primary_disk['size']) ? $this->format_bytes($primary_disk['size']) : ''
			),
		);
	}

	private function memory_lines($memory)
	{
		$lines = array();
		foreach ($memory as $item) {
			$record = $this->get_record($item);
			$parts = array();
			$clock = $this->first_text(isset($record['clockSpeed']) ? $record['clockSpeed'] : '', isset($record['clock']) ? $record['clock'] : '');
			if ($clock !== '') {
				$parts[] = '频率: ' . $clock . ' MHz';
			}
			if (!empty($record['size'])) {
				$parts[] = '大小: ' . $this->format_bytes($record['size']);
			}
			if (!empty($parts)) {
				$lines[] = implode(' ', $parts);
			}
		}
		return $lines;
	}

	private function decode_json($value, $fallback)
	{
		if (!is_string($value) || trim($value) === '') {
			return $fallback;
		}
		$decoded = json_decode($value, true);
		return is_array($decoded) ? $decoded : $fallback;
	}

	private function get_record($value)
	{
		return is_array($value) ? $value : array();
	}

	private function get_array($value)
	{
		if (!is_array($value)) {
			return array();
		}
		return array_values(
			array_filter(
				$value,
				static function ($item) {
					return is_array($item);
				}
			)
		);
	}

	private function first_text()
	{
		$values = func_get_args();
		foreach ($values as $value) {
			if (is_string($value) && trim($value) !== '') {
				return trim($value);
			}
			if (is_numeric($value)) {
				return (string) $value;
			}
		}
		return '';
	}

	private function format_bytes($value)
	{
		$bytes = is_numeric($value) ? floatval($value) : 0;
		if ($bytes <= 0) {
			return '';
		}
		$units = array('B', 'KB', 'MB', 'GB', 'TB', 'PB');
		$index = 0;
		while ($bytes >= 1024 && $index < count($units) - 1) {
			$bytes /= 1024;
			$index++;
		}
		$precision = $bytes >= 10 ? 0 : 1;
		return rtrim(rtrim(number_format($bytes, $precision, '.', ''), '0'), '.') . ' ' . $units[$index];
	}
}
