# WordPress.org Listing Copy

This file keeps the canonical listing copy used for submission and translation.

## English Source

### Plugin Name

Npcink Device Manage

### Short Description

Manage device assets in WordPress with an admin inventory, signed client uploads, change records, import/export, and an authorized public search page.

### Long Description

Npcink Device Manage is a device asset management plugin for teams that want to keep hardware inventory inside WordPress.

The plugin provides:

- Admin device inventory for computers and custom assets.
- Device numbers, departments, status fields, purchase values, and depreciation values.
- Manual and automatic change records.
- Import and export tools for plugin-owned data tables.
- A public search page protected by a client authorization token and HMAC signature.
- A signed REST upload endpoint for an optional desktop collection client.

The WordPress plugin does not load JavaScript or CSS from third-party CDNs. Built React assets are bundled locally in the plugin package, with the corresponding React/TypeScript source and build configuration included under `vite-admin` and `vite-search`.

### Installation

1. Upload the `npcink-device-manage` folder to `/wp-content/plugins/`.
2. Activate the plugin from the WordPress Plugins screen.
3. Open Plugins > Device Asset Management.
4. Review plugin settings and generate a client authorization token before using upload or public query workflows.

### FAQ

#### Does this plugin send data to a third-party service?

No. The WordPress plugin stores device asset data in the site's own WordPress database and does not contact a third-party service for normal operation.

#### What data is stored?

The plugin can store device asset fields such as device name, number, department, status, IP address, hardware details submitted by the optional client, change records, and plugin settings.

#### Are public query and upload endpoints open to anonymous users?

No. Public query and upload endpoints require a client authorization token and HMAC signature. Admin endpoints require a WordPress user with `manage_options`.

#### What happens on uninstall?

The plugin only deletes its custom tables and settings when the administrator has enabled the delete-data setting before uninstalling.

#### Where is the source for bundled JavaScript?

The WordPress package includes the built files and the corresponding React/TypeScript source:

- Admin app source: `vite-admin/src`
- Public search app source: `vite-search/src`
- Build configuration: `vite-admin/package.json`, `vite-admin/vite.config.ts`, `vite-search/package.json`, and `vite-search/vite.config.ts`

Run `npm install && npm run build` inside each Vite app directory to rebuild the bundled assets.

### Privacy

Npcink Device Manage stores device asset data in the local WordPress database. Depending on how the site owner configures and uses the plugin, stored data may include device names, assigned users or locations, departments, status values, IP addresses, hardware identifiers, hardware details, and change history.

The plugin does not transmit this data to Npcink or any third-party server during normal plugin operation. Site administrators are responsible for informing users and employees about their own device inventory policies.

