
CHANGELOG
====

v2.2.3
----
* Fixed upload issue for Cordova projects.
* Added update checker.

v2.2.2
----
* Fixed transpiling issue on Vue templates.
* Added `monaca config` command with API endpoint and proxy management.
* Added `monaca docs` command.
* Added Node version compatibility check.

v2.2.1
----
* Fixed automatic browser opening and missing log on project preview.

v2.2.0
----
* Update monaca-lib version in order to support new templates.
* Fix template dependencies.

v2.1.7
----
* Update monaca-lib version.

v2.1.6
----
* Update monaca-lib version.
* Fixed Monaca project check issue.

v2.1.5
----
* Update monaca-lib version.
* Assure Monaca project before reconfigure to handle errors.

v2.1.4
----
* Update monaca-lib version.

v2.1.3
----
* Find another port when the first one is in use.
* Added command aliases.

v2.1.2
----
* New optional paramenter `--url` for `monaca create`.
* Fix path issues when using NVM or similar.
* Improve WebPack output in development mode.

v2.1.1
----
* Update monaca-lib version.
* Preview: Show all possible IPv4 addresses.

v2.1.0
----
* Support hot reloading of React templates.
* Support WebPack configurations.
* Major changes in React and Angular 2 templates.

v2.0.6
----
* Updated monaca-lib to support Cordova 6.2.0.

v2.0.5
----
* Improved `create` command to show a preview of the template.
* Minor fixes.
* Implemented command analytics.
* Updated monaca-lib for an important bug fix.

v2.0.4
----
* Updated monaca-lib.
* Combine SampleApps category with templates in `create` command.

v2.0.3
----
* Dependencies fix.
* Added --no-open parameter for `preview` command.

v2.0.2
----
* Improved UI prompt.

v2.0.1
----
* Fix for transpiling and remote build.

v2.0.0
----
* Code refactored and some major API changes.
* Improved UI with better prompt.
* Improved connection performance and responsiveness.
* Added transpiling support for React and Angular2 projects.
* Removed some dependencies to speed up installation.
* Implemented Sign-up command.
* Added --output parameter for `remote build` command.
* Removed Gulp. Added simple http-server for `preview` command.
* Enhanced error message handling.
* Minor bugs fixed.

v1.2.10
----
* monaca-login: Added optional email parameter.
* monaca-remote-build: Added optional email parameter.

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
