# Community plugins

Plugins written by third parties are submitted as pull requests that add a folder `community/<id>/` containing `manifest.json` and the plugin files. The folder name must equal the plugin id.

Requirements for acceptance:

* The manifest declares every permission the plugin needs, and nothing more.
* A plugin that uses a service, model or program of others lists it under `credits`, with the owner's own name, the owner, the license and an https address.
* The repository does not contain models or programs that belong to others; the plugin refers to them and the user obtains them from their owners.
* The plugin runs within the limits described in [docs/plugin-api.md](../docs/plugin-api.md).

Accepted plugins are listed in the signed catalog as community plugins. They remain disabled after installation until the user has reviewed their permissions and confirmed them.
