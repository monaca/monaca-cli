
CHANGELOG
====

v1.2.8.1
----
* monaca-upload: Fixed delete parameter.

v1.2.8
----
* monaca-download/upload: Allowed upload/download for config files inside the root directory.

v1.2.7
----
 * monaca-download: Fixed wrong files deletion in `downloadProject()`.

v1.2.6
----
 * monaca-remote-build: Added missing `options` parameter.

v1.2.5
----
 * monaca-download: Fixed to download some files that were exempted.

v1.2.4
----
 * monaca-upload: Added --force, --delete, and --dry-run options.
 * monaca-download: Added --force, --delete, and --dry-run options

v1.2.3
----
 * monaca-clone: Fixed project import bug.

v1.2.2
----
 * monaca-upload: Fixed file uploading error.
 * monaca-remote-build: Removed timeout error.
 * monaca-multiserve: Fixed issue when calling Ctrl-C in multiserve.
 * monaca-create: Fixed monaca create to include project name.

v1.2.1
----
 * monaca: Fixed line encoding for bin/monaca.

v1.2.0
----
 * monaca-remote-build: Added non-interactive build for CI purpose.
 * monaca-create: Now it will create an app from Cloud templates.
 * monaca-help: Removed local build options, and supported `--help` parameter.
 * monaca-clone: Rename to monaca-import. New monaca-clone will save local project.
 * Updated monaca-lib to fix binary upload error.

v1.1.1
----
 * monaca-sync: Fixed bug where it cannot clone the project.

v1.1.0
----
 * monaca-login: Support authentication parameters.

v1.0.10
----
 * monaca-livesync: Support new `Localkit.initInspector` method.

v1.0.9
----
 * monaca-upload: This command will now only work for Monaca projects and it will search parent directories until it finds one.
 * monaca-download: This command will now only work for Monaca projects and it will search parent directories until it finds one.

v1.0.7
----
 * monaca-upload: Fixed bug where it didn't upload if .monaca was empty.

v1.0.5
----
 * monaca-login: Added version parameter when signing in.

v1.0.4
----
 * core: Updated dependencies.

v1.0.3
----
 * monaca-plugin: Improved docs.
 * monaca-upload: Made prompt case-insensitive.
 * monaca-download: Made prompt case-insensitive.

v1.0.2
----
 * monaca-proxy: Added proxy support.

v1.0.1
----
 * monaca-create: Improved docs.
 * monaca-clone: Use the project name as default destination directory.

v1.0.0
------
 * Initial version.
