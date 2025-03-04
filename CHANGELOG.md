
CHANGELOG
====
v5.0.6
----

#### Updates

* Update Blank template

v5.0.5
----

#### Updates
* Update signup docs

v5.0.4
----

#### Updates
* Update proxy configuration instructions

v5.0.3
----

#### Bug Fix
* Resolved issue in version checking functionality
  * Fixed incorrect JSON parsing that could lead to errors

v5.0.2
----

#### Bug Fix

* Fixed an error when specifying a directory in the `--output` option of `monaca remote build`. 
* Fixed `monaca debug`.

v5.0.1
----

#### Bug Fix

* Fixed `monaca import` and `monaca clone` to resolve directory path.

v5.0.0
----

#### Feature

* Support Capacitor Projects (Beta).
* Support Yarn Projects (Beta).
* Detail Changelog in [`monaca-lib@5.0.0`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v500)

v4.2.11
----

#### Bug Fix

* Fix a bug where the template was missing
* Detail Changelog in [`monaca-lib@4.1.10`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md)

v4.2.10
----

#### Updates

* Detail Changelog in [`monaca-lib@4.1.9`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md)

v4.2.9
----

#### Updates

* Add retry option when there is a problem in downloading from the cloud server
* Detail Changelog in [`monaca-lib@4.1.8`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v418)

v4.2.8
----

#### Bug Fix

* Fix HTTPS request error handling in monaca.js

v4.2.7
----

#### Bug Fix

* Handle uncaught exceptions in monaca.js
* Fix incorrect usage of util.print in loginErrorHandler

v4.2.6
----

#### Updates

* Changed the command message to set a proxy server from "monaca proxy set" to "monaca config proxy"

v4.2.5
----

#### Updates

* Remove tutorial option from docs command

v4.2.4
----

#### Updates

* Switch from optimist to minimist

v4.2.3
----

#### Updates

* Improve error message when download session has expired after running `monaca remote build`.

v4.2.2
----

#### Updates

* Support iOS Simulator Build.
* Detail Changelog in [`monaca-lib@4.1.5`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v415)

v4.2.1
----

#### Updates

* Detail Changelog in [`monaca-lib@4.1.2`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v412)
* Update dependencies

v4.2.0
----

#### Updates

* Update `monaca info` to use `child_process` to get NPM version
* Detail Changelog in [`monaca-lib@4.1.0`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v410)

v4.1.1
----

#### Updates

* Update Monaca document url

v4.1.0
----

#### Updates

* Support `debugger` build for `ios` and `android` platforms. Example: `monaca remote build ios --build-type=debugger` and `monaca remote build ios --build-type=debugger`

v4.0.2
----

#### Updates

* Detail Changelog in [`monaca-lib@4.0.2`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v402)

v4.0.1
----

#### Updates

* Detail Changelog in [`monaca-lib@4.0.1`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v401)

v4.0.0
----

#### Updates

* Detail Changelog in [`monaca-lib@4.0.0`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v400)
* Run `monaca signup` command will open the registration page if the user is not logged in
* Synchronize version with other Monaca Development Kits (Monaca Localkit and Lib)

v3.3.8
----

#### Bug Fix

* Update dependencies to resolve circular dependency warnings

v3.3.7
----

#### Feature

* Detail Changelog in [`monaca-lib@3.2.10`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v3210)

v3.3.6
----

#### Bug Fix

* Fixed running `monaca preview` on windows.

v3.3.5
----

#### Bug Fix

* Return proper 401 unauthorized access from the server for login and signup operation

v3.3.4
----

#### Feature

* Detail Changelog in [`monaca-lib@3.2.8`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v328)

v3.3.3
----

#### Bug Fix

* Fixes to support older version of Nodejs (CERT_HAS_EXPIRED).

## Announcement

* We will drop support of Node `8.x` in the future. Please upgrade Node to `10.x` or higher.

v3.3.2
----

#### Bug Fix

* Fix bugs in [`monaca-lib@3.2.6`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v326)

v3.3.1
----

#### Bug Fix

* Fix bugs in [`monaca-lib@3.2.5`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v325)

v3.3.0
----

#### Feature

* improve monaca plugin add commands to update package.json according to the plugin's plugin.xml file instead of using cordova plugin add commands. For the remote repository, currently support only <https://github.com/> and <https://gitlab.com/>

v3.2.1
----

#### Bug Fix

* Fix bugs in [`monaca-lib@3.2.4`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v324)

v3.2.0
----

#### Feature

* Added support for electron (windows, macos, and linux) and pwa builds.

v3.1.4
----

#### Bug Fixes

* Generate default build filename for android and ios
* Return a proper error message if could not download the build file
* Inform user to run `monaca download --delete` after running `monaca remote config`
* Fix bugs in [`monaca-lib@3.2.2`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v322)

v3.1.3
----

#### Bug Fixes

* Minor fixed to the `monaca --help` command

v3.1.2
----

#### Bug Fixes

* Fixed to support interactive commands usage on Windows (for Node 10.x) by using `inquirer` package on Windows platform

v3.1.1
----

#### Bug Fixes

* Fixed to encode the file path param

v3.1.0
----

#### Features

* Show spinner and file information during file comparision.
* `monaca remote config` and `monaca remote build`: added `--skipUpload` to skip uploading local project to cloud when building project.
* `monaca remote config` and `monaca remote build`: added `--skipTranspile` to skip transpile process when uploading project to cloud during building.

#### Bug Fixes

* Exit the program when `SIGINT` signal is sent to the console.

v3.0.4
----

* Prompt users for project name and description when creating new project in cloud.
* Remove unused resources.
* Fix some wording.

v3.0.3
----

* Fix broken document link.
* `monaca debug`: connect to the next available port if the default port `8001` is being used.

v3.0.2
----

* `monaca update`: fixed not to stringify `package.backup.json`.
* `monaca clone`: fixed not to download `node_modules` folder and automatically run `npm install` afterward.
* Fixed `monaca download` and `monaca upload` dealing with large project files.
* `monaca upload`: fixed to upload symlinked (physical) files/directories.

v3.0.1
----

#### Features

* Added `monaca update` command. This command is used to update project created using Monaca CLI 2.x or lower to Monaca CLI 3.
* Added `monaca init` command. This command is used to initialize projects created using other CLI tools to the Monaca structure.
* Added `needToUpgrade` function to check if the user can execute a command or needs to update the project (with [`monaca-lib@3.0.0`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v300)).
* Modified `isMonacaProject` function (with [`monaca-lib@3.0.0`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v300)).

#### Deprecated

* Removed `monaca reconfigure` command.
* Removed `monaca demo` command.

#### Breaking changes

* Remove `port` and `no-open` option from `monaca preview`.
* Remove `generate-config` and `install-dependencies` option from `monaca transpile`.
* Modified `monaca preview`, `monaca transpile` and `monaca debug` to execute the new Monaca Commands (with [`monaca-lib@3.0.0`](https://github.com/monaca/monaca-lib/blob/master/CHANGELOG.md#v300)):
  * `'monaca:preview'`
  * `'monaca:transpile'`
  * `'monaca:debug'`
* Modified `cordova` commands to execute Cordova from project dependency instead of using global Cordova.

v2.7.14
----

* Fixed bugs in `monaca remote build`, `monaca remote config`, `monaca upload` and `monaca download` (with `monaca-lib@2.7.13`).

v2.7.13
----

* Revert changes made in `2.7.12` due to Monaca proxy server. It only applies to `Monaca Cloud IDE`.

v2.7.12
----

* fixed the hot reloading for transpile project templates in Monaca Cloud IDE.

v2.7.11
----

* appended `path` to the `upload` and `download` request url (with `monaca-lib@2.7.11`)
* return `upload` and `download` progress to `localkit` (with `monaca-lib@2.7.11`)
* remove `platforms` from default `.monacaignore` for project with lower cordova version (with `monaca-lib@2.7.11`)

v2.7.10
----

* Modified `monaca preview` to include `loader.js` and `loader.css` to `index.html` (with `monaca-lib@2.7.10`)

v2.7.9
----

* Modified `monaca remote build` to ask users providing the build directory if it is not specified. In addition, the default build directory is changed to `Desktop` directory.
* Fixed `monaca import` to NOT set `project_id` to `local_properties.json` (with `monaca-lib@2.7.9`)

v2.7.8
----

* Always append `webpack-dev-server/client` to webpack configuration to fix `Angular`'s `live reloading` with `monaca-lib@2.7.8`

v2.7.7
----

* Appended `webpack-dev-server/client` to webpack configuration only if `inline` and `hot` are set to true
* Appended `webpack-dev-server/client` to `entry.watch` if supplied
* Modified `monaca preview` to write files to `www` directory in `monaca-lib@2.7.7` so that the `monaca debugger` will see the changes immediately without running `monaca transpile`

v2.7.6
----

* Added `skipTranspile` option to `monaca upload` to skip transpiling if supplied
* Generated `.monacaignore` for all project templates and Improved retrieving local project files in `monaca-lib@2.7.6`

v2.7.5
----

* Fixed `monaca demo` issues for transpile projects.

v2.7.4
----

* Added `monaca signing` command. This command is used to manage iOS and Android signing configuration such as keystore, certificate, provisioning profile, etc.

v2.7.0
----

* Stopped livereload in case of transpilable project
* Changed web server program

v2.6.1
----

* Bumped built-in Cordova CLI dependency to 7.1.0.

v2.6.0
----

* Added React-Native Project Support

v2.5.3
----

* Temporary disabled project link on creation because of output issues with recent npm versions.

v2.5.2
----

* Fixed npm issue during project creation.
* Improved error message when a remote build fails.

v2.5.1
----

* Fixed `debug` inspector issue.

v2.5.0
----

**All previous Monaca CLI versions will not be anymore compatible with Monaca Cloud Services**

* Security enhancements.
* Webpack config updates.

v2.4.6
----

* Allowed `preview|serve|demo|debug|transpile|reconfigure` commands to be executed from subdirectories.
* Minor bug fix.

v2.4.5
----

* Fixed broken `transpile`, `preview | serve` commands in specific conditions.

v2.4.4
----

* Improved compatibility with [Onsen UI vue-cordova-webpack](https://github.com/OnsenUI/vue-cordova-webpack) template.
* Warning message fix.

v2.4.3
----

* Fixed broken `monaca -v` command.
* Improved internal login in `monaca-lib` dependency.

v2.4.2
----

* Bumped up built-in Cordova CLI to version 6.5
* Added `monaca remote config` command.
* Added extended general purpose helper by executing `monaca --help`.
* Deprecated `monaca --all` command.

v2.4.1
----

* Integrated remote build history (`monaca remote build --build-list`).
* Improved logout function.
* Added distinction notification between Monaca CLI and Cordova CLI commands.

v2.4.0
----

* Added Cordova 6.5 support.
* Filtered displayed tasks depending on the current dir.
* Improved login by adding direct override.
* Fixed `monaca info` command to properly work in subdirectories.

v2.3.2
----

* Added `link to IDE` option during project creation.
* Updated Webpack resolvers for transpilable templates.
* Added support to updated transpilable templates.

v2.3.1
----

* Improved `monaca create` command with new options.
* Bug fix for Vue templates.

v2.3.0
----

* Added support to the latest Vue.js 2 and ReactJS templates with Onsen UI 2.4.0.
* Fixed debug for the new transpilable projecs when `monaca preview` is executed.
* Added `monaca info` command.
* Bumped up built-in Cordova CLI to version 6.2
* Improved task organization and documentation.
* Updated Onsen UI reference in `monaca docs`.
* Improved various error messages with docs references.

v2.2.7
----

* Fixed auto-reloading in `monaca preview/serve/demo`.
* New HTTP Server support.

v2.2.6
----

* Added `monaca demo` command.

v2.2.5
----

* Fixed local debug bug. Fixed #92.
* Fixed project path on Monaca Debugger.

v2.2.4
----

* Fixed critical sync bug for projects containing special characters in the path.
* General performance improvement due to leak fix.

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
