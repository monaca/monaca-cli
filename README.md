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
debug  .........  run app on device using Monaca Debugger
transpile  .....  transpile project source code
update .........  update projects created with CLI 2.x to the latest Monaca project structure.
init ...........  initialize projects created using other CLI tools to be able to execute with Monaca.
config  ........  manage Monaca configuration
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

---

## Troubleshooting

### Problem after installation (Windows OS):

I successfully installed Monaca CLI, but after executing command `monaca login` and writing my credentials, nothing happens or I get UnhandledPromiseRejectionWarning:

```
$ monaca login
Use "monaca signup" command if you need to create a new account.

? Enter your email address: test@email.com
? Enter your password: ********

(node:12344) UnhandledPromiseRejectionWarning: TypeError: Cannot read property of 'hasOwnProperty' of undefined
```

### Solution:

The problem might be in the installation of Node.js. If you installed Node.js through [.msi installer](https://nodejs.org/en/download/) on Node.js official website, we suggest you to use `NVM for Windows` to manage your Node.js versions instead.

1. Uninstall Node.js from your computer. Refer to this [manual](https://stackoverflow.com/questions/20711240/how-to-completely-remove-node-js-from-windows).
2. Install [NVM for Windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows).
3. After installation, download a Node.js version 14.19.0 and set this version to be used:
   ```bash
   $ nvm install 14.19.0
   $ nvm use 14.19.0
   ```
   For more information about managing multiple Node.js versions, refer to this [documentation](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows).
4. Install the Monaca CLI again.
5. The login should be working now.

### GitHub Actions

- submodules are recursively installed by adding the submodules: 'recursive' option.

#### When merged/pushed to master branch

- Get version from package.json
- If version does not exist in GitHub tags
  - Tag it
  - Run npm publish

#### When tagged as -beta.*

- Run npm publish --beta

