<?php

define('ABSPATH', __DIR__ . '/');

class Npcink_Device_Inventory_Admin_Interface
{
	protected static $table_assets_name = 'npcink_assets';
	protected static $table_asset_identities_name = 'npcink_asset_identities';
	protected static $table_asset_observations_name = 'npcink_asset_observations';
	protected static $table_asset_events_name = 'npcink_asset_events';
}

require_once __DIR__ . '/../includes/class-npcink-device-inventory-activator.php';

function npcink_schema_assert($condition, $message)
{
	if (!$condition) {
		fwrite(STDERR, "Schema migration fixture failed: {$message}\n");
		exit(1);
	}
}

$all = Npcink_Device_Inventory_Activator::SCHEMA_REVISIONS;
npcink_schema_assert(
	Npcink_Device_Inventory_Activator::pending_schema_revisions(null) === $all,
	'a fresh install must run every migration in order'
);
npcink_schema_assert(
	Npcink_Device_Inventory_Activator::pending_schema_revisions('20260706_latest_observed') === array('20260715_atomic_identity'),
	'an existing schema must run only newer migrations'
);
npcink_schema_assert(
	Npcink_Device_Inventory_Activator::pending_schema_revisions(Npcink_Device_Inventory_Activator::SCHEMA_REVISION) === array(),
	'the current schema must not rerun migrations'
);
npcink_schema_assert(
	Npcink_Device_Inventory_Activator::pending_schema_revisions('unknown_revision') === $all,
	'an unknown development revision must be reset through the complete migration chain'
);

echo "Schema migration fixture checks passed.\n";
