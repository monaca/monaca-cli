Monaca CLI
==========

Command line version of Monaca. It can be used to download projects from the [Monaca](http://monaca.io) cloud service, livesyncing Cordova projects to a local device using the Monaca Debugger among a lot of other things.

Installation instructions
----

If you don't have have Node.js installed, please download it [from here](http://nodejs.org/) or install it with your favorite package manager.

When that's done you can install the Monaca CLI by using:

```bash
$ npm install -g monaca
```

On some systems you may have to prefix the command with `sudo` because of permissions:

```bash
$ sudo npm install -g monaca
```

Available commands
----

Just run

```bash
$ monaca
```

to see a list of available commands:

```
login  .........  sign in to Monaca Cloud
logout  ........  sign out from Monaca Cloud
signup  ........  register a new Monaca account
create  ........  create a new local Monaca project from a template
clone  .........  clone a project from Monaca Cloud
import  ........  import a project from Monaca Cloud
download  ......  download a project from Monaca Cloud
upload  ........  upload a project to Monaca Cloud
signing ........  manage signing configurations
remote build  ..  build a project on Monaca Cloud
remote config  ..  open the project configuration on Monaca Cloud
preview  .......  run a local web server for preview
demo  ..........  display the app appereance on iOS and Android
debug  .........  run app on device using Monaca Debugger
transpile  .....  transpile project source code
config  ........  manage Monaca configuration
reconfigure  ...  generate default project configurations
plugin  ........  manage Cordova Plugin
docs  ..........  display docs for Monaca CLI, Onsen UI and Tutorials
info  ..........  display project and environment info
```

You can run `monaca <command_name> --help` to get in-depth information about a single command:

```
$ monaca upload --help

Usage: monaca upload

Description:

  Uploads the current project to the Monaca Cloud.

  This command requires you to be logged in. The project
  files will be compared with the remote files so only
  changed and new files will be uploaded.

Examples:

  $ monaca upload
```

It also supports the command line options from Cordova CLI. The following options exactly follows the same behavior to Cordova, and Monaca Cloud is not used in this case.

```
platform  ......  add, update and remove platforms
prepare  .......  prepare project for build
compile  .......  build the project
run  ...........  deploy project on a device / emulator
build  .........  shortcut for compile, then prepare
emulate  .......  run project in emulator
serve  .........  run a local web server for assets
```
