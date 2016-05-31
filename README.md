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
create  ........  create a new Monaca project
preview ........  runs a local web server for preview
debug ..........  run app on device using Monaca Debugger
remote build  ..  build project on Monaca Cloud
login  .........  sign in to Monaca Cloud
logout  ........  sign out from Monaca Cloud
clone  .........  clone project from the Monaca Cloud
import  ........  import project from the Monaca Cloud
upload  ........  upload project to Monaca Cloud
download  ......  download project from Monaca Cloud
plugin  ........  manage installed plugins
livesync  ......  starts a server that waits for connections from Monaca Debugger
multiserve  ....  serves several projects to the Monaca Debugger
proxy  .........  configure proxy to use when connecting to Monaca Cloud
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
info  ..........  show info about Cordova environment
platform  ......  add, update and remove platforms
prepare  .......  prepare project for build
compile  .......  build the project
run  ...........  deploys project on a device / emulator
build  .........  shortcut for compile, then prepare
emulate  .......  run project in emulator
serve  .........  runs a local web server for assets
```
