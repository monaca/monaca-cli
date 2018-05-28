let path = require('path');
let argv = require('optimist').argv;
let Monaca = require('monaca-lib').Monaca;
let Q = require('q');
let inquirer = require('monaca-inquirer');
let lib = require(path.join(__dirname, 'lib'));
let util = require(path.join(__dirname, 'util'));

let monaca;
let _project_id;
const _helpMessage = 'To learn about a monaca signing type:\n$ monaca signing --help\n';
const _listErrorMessage = `The provided target does not support signing list capabilities.\n${_helpMessage}`;
const _generateErrorMessage = `The provided target does not support signing generate capabilities.\n${_helpMessage}`;
const _uploadErrorMessage = `The provided target does not support signing upload capabilities.\n${_helpMessage}`;
const _addErrorMessage = `The provided target does not support signing add capabilities.\n${_helpMessage}`;
const _removeErrorMessage = `The provided target does not support signing remove capabilities.\n${_helpMessage}`;
const _exportErrorMessage = `The provided target does not support signing export capabilities.\n${_helpMessage}`;
const NO_ACTION = 'no_action_selected';
const _noActionMessage = 'No action selected!';

let _methods = {
  generate: (target) => {
    switch(target) {
      case 'keystore':
        let aliasPassword;
        let keystorePassword;

        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'alias_name',
              message: 'Enter alias name:'
            },
            {
              type: 'password',
              name: 'alias_password',
              message: 'Enter alias password:',
              validate: function(alias_password) {
                aliasPassword = alias_password;
                return util.validatePassword(aliasPassword);
              }
            },
            {
              type: 'password',
              name: 'alias_password_confirm',
              message: 'Confirm alias password:',
              validate: function(alias_password_confirm) {
                return aliasPassword === alias_password_confirm;
              }
            },
            {
              type: 'password',
              name: 'keystore_password',
              message: 'Enter KeyStore password:',
              validate: function(keystore_password) {
                keystorePassword = keystore_password;
                return util.validatePassword(keystorePassword);
              }
            },
            {
              type: 'password',
              name: 'keystore_password_confirm',
              message: 'Confirm KeyStore password:',
              validate: function(keystore_password_confirm) {
                return keystorePassword === keystore_password_confirm;
              }
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.generateSigningKeyStore(_project_id, answers.alias_name, answers.alias_password, answers.keystore_password);
          }
        );
      break;

      case 'pkcsr':
        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'email',
              message: 'Enter your email address:',
              validate: function(email) {
                return util.validateEmail(email);
              }
            },
            {
              type: 'input',
              name: 'name',
              message: 'Enter your name:',
              validate: function(name) {
                return util.validateRequireField(name);
              }
            },
            {
              type: 'input',
              name: 'country',
              message: 'Enter your country (E.g. US, JP, etc):',
              validate: function(country) {
                return util.validateCountryCode(country);
              }
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.generateSigningPKCSR(answers.email, answers.name, answers.country);
          }  
        );
      break;
      
      default:
        return Q.reject(_generateErrorMessage);
      break; 
    }
  },

  upload: (target) => {
    switch(target) {
      case 'keystore':
        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'filePath',
              message: 'Enter KeyStore file path:',
              validate: function(filePath) {
                return util.validateRequireField(filePath);
              }
            },
            {
              type: 'password',
              name: 'password',
              message: 'Enter KeyStore password:',
              validate: function(password) {
                return util.validateRequireField(password);
              }
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.uploadSigningKeyStore(_project_id, answers.filePath, answers.password);
          }  
        );
      break;

      case 'certificate':
        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'filePath',
              message: 'Enter Certificate file path:',
              validate: function(filePath) {
                return util.validateRequireField(filePath); 
              }
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.uploadSigningCertificate(answers.filePath);
          }  
        );
      break;
      
      case 'provisioning':
        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'filePath',
              message: 'Enter Provisioning Profile file path:',
              validate: function(filePath) {
                return util.validateRequireField(filePath); 
              }
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.uploadSigningProvisioningProfile(answers.filePath);
          }  
        );
      break;
      
      case 'pkcs12':
        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'filePath',
              message: 'Enter P12 file path:',
              validate: function(filePath) {
                return util.validateRequireField(filePath); 
              }
            },
            {
              type: 'password',
              name: 'password',
              message: 'Enter P12 password:'
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.uploadSigningPKCS12(answers.filePath, answers.password);
          }  
        );
      break;
      
      default:
        return Q.reject(_uploadErrorMessage);
      break; 
    }
  },

  add: (target) => {
    switch(target) {
      case 'alias':
        let aliasPassword;

        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'alias_name',
              message: 'Enter alias name:'
            },
            {
              type: 'password',
              name: 'alias_password',
              message: 'Enter alias password:',
              validate: function(alias_password) {
                aliasPassword = alias_password;
                return util.validatePassword(aliasPassword);
              }
            },
            {
              type: 'password',
              name: 'alias_password_confirm',
              message: 'Confirm alias password:',
              validate: function(alias_password_confirm) {
                return aliasPassword === alias_password_confirm;
              }
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.addSigningAlias(_project_id, answers.alias_name, answers.alias_password);
          }  
        );
      break;
      
      default:
        return Q.reject(_addErrorMessage);
      break; 
    }
  },
  
  remove: (target) => {
    switch(target) {
      case 'alias':
       return monaca.fetchSigningAliasCollection(_project_id).then(
          (profiles) => {
            if (!profiles || !profiles.length || profiles.length <= 0) {
              util.print('There is no alias to be removed.');
              return NO_ACTION;
            }
            return inquirer.prompt(
              [
                {
                  type: 'list',
                  name: 'profile',
                  message: 'Please select an alias to remove:',
                  cancelable: true,
                  choices: profiles.map((profile) => {
                    return {
                      name: profile,
                      value: profile,
                      short: profile
                    };
                  })
                }
              ]
            )
            .then(
              (answers) => {
                if (!answers || !answers.profile) return NO_ACTION;
                return monaca.removeSigningAlias(_project_id, answers.profile);
              }  
            );
          }
        );
      break;

      case 'certificate':
        return monaca.fetchSigningCertificateCollection().then(
          (profiles) => {
            if (!profiles || !profiles.length || profiles.length <= 0) {
              util.print('There is no certificates to be removed.');
              return NO_ACTION;
            }
            return inquirer.prompt(
              [
                {
                  type: 'list',
                  name: 'profile',
                  message: 'Please select a profile to remove:',
                  cancelable: true,
                  choices: profiles.map((profile) => {
                    return {
                      name: `${profile.label} -- Expiration Date: ${util.getFormatExpirationDate(profile.expiration)}`,
                      value: profile.crt_id,
                      short: profile.label
                    };
                  })
                }
              ]
            )
            .then(
              (answers) => {
                if (!answers || !answers.profile) return NO_ACTION;
                return monaca.removeSigningCertificate(answers.profile);
              }  
            );
          }
        );
      break;
      
      case 'provisioning':
        return monaca.fetchSigningProvisioningProfileCollection().then(
          (profiles) => {
            if (!profiles || !profiles.length || profiles.length <= 0) {
              util.print('There is no provisioning profiles to be removed.');
              return NO_ACTION;
            }
            return inquirer.prompt(
              [
                {
                  type: 'list',
                  name: 'profile',
                  message: 'Please select a profile to remove:',
                  cancelable: true,
                  choices: profiles.map((profile) => {
                    return {
                      name: profile.label,
                      value: profile.prov_id,
                      short: profile.label
                    };
                  })
                }
              ]
            )
            .then(
              (answers) => {
                if (!answers || !answers.profile) return NO_ACTION;
                return monaca.removeSigningProvisioningProfile(answers.profile);
              }  
            );
          }
        );
      break;

      case 'pkcs12':
        return monaca.fetchSigningPrivateKeyCollection().then(
          (profiles) => {
            if (!profiles || !profiles.length || profiles.length <= 0) {
              util.print('There is no pkcs12 to be removed.');
              return NO_ACTION;
            }
            return inquirer.prompt(
              [
                {
                  type: 'list',
                  name: 'profile',
                  message: 'Please select a pkcs12 to remove:',
                  cancelable: true,
                  choices: profiles.map((profile) => {
                    return {
                      name: `${profile.email} ( ${profile.key_id} )`,
                      value: profile.key_id,
                      short: profile.email
                    };
                  })
                }
              ]
            )
            .then(
              (answers) => {
                if (!answers || !answers.profile) return NO_ACTION;
                return monaca.removeSigningPrivateKey(answers.profile);
              }  
            );
          }
        );
      break;
      
      default:
        return Q.reject(_removeErrorMessage);
      break; 
    }
  },

  export: (target) => {
    switch(target) {
      case 'keystore':
        return inquirer.prompt(
          [
            {
              type: 'input',
              name: 'downloadToDir',
              message: 'Enter the directory where the export will be saved to:'
            }
          ]
        )
        .then(
          (answers) => {
            return monaca.exportSigningKeyStore(_project_id, answers.downloadToDir);
          }  
        );
      break;

      case 'pkcsr':
        return monaca.fetchSigningPrivateKeyCollection().then(
          (profiles) => {
            if (!profiles || !profiles.length || profiles.length <= 0) {
              util.print('There is no pkcs12 to be exported.');
              return NO_ACTION;
            }
            return inquirer.prompt(
              [
                {
                  type: 'list',
                  name: 'profile',
                  message: 'Please select a pkcs12 to export:',
                  cancelable: true,
                  choices: profiles.map((profile) => {
                    return {
                      name: `${profile.email} ( ${profile.key_id} )`,
                      value: profile.key_id,
                      short: profile.email
                    };
                  })
                }
              ]
            )
            .then(
              (answers1) => {
                if (!answers1 || !answers1.profile) return NO_ACTION;

                let key = answers1.profile;

                return inquirer.prompt(
                  [
                    {
                      type: 'input',
                      name: 'downloadToDir',
                      message: 'Enter the directory where the export will be saved to:'
                    }
                  ]
                )
                .then(
                  (answers) => {
                    return monaca.exportSigningPKCSR(key, answers.downloadToDir);
                  }  
                );

              }  
            );
          }
        );
      break;
      
      default:
        return Q.reject(_exportErrorMessage);
      break; 
    }
  }
};

module.exports = {
  // Entry point for all singing tasks
  run: (task, info) => {
    monaca = new Monaca(info);
    let step = '';
    let action = '';
    let target = '';

    lib.findProjectDir(process.cwd(), monaca)
      .then(
        (cwd) => {
          // Checking project directory.
          return lib.assureMonacaProject(cwd, monaca);
        }
      )
      .then(
        (projectInfo) => {
          // Assuring this is a Monaca-like project.
          _project_id = projectInfo.projectId
        }
      )
      .then(
        () => {
          step = 'prepareSession';
          return monaca.prepareSession();
        }
      )
      .then(
        () => {
          step = 'executing';
          // The avaialble actions are: list, generate, upload, add, remove, export
          action = argv._[1];
          let hasAction = _methods.hasOwnProperty(action);

          target = argv._[2];

          // If the action exists, call the action with the target.
          if(action && hasAction && target) {
            return _methods[action](target);
          } else {
            let message = '';
            if(!action) message = 'Missing action for the signing command.';
            if(action && !hasAction) message = 'No such action for the signing command.';
            if(!target) message = 'Missing target for the signing command action.';
            if (message) {
              util.fail(`${message}\n${_helpMessage}`);
            }
          }
        }
      )
      .then(
        (message) => {
          if (message === NO_ACTION) {
            util.print(_noActionMessage);
          } else {
            util.success(`${action} ${target}: success`);            
          }
        },
        (err) => {
          if (step === 'prepareSession') {
            util.displayLoginErrors();
          } else {
            util.fail(err);
          }
        }
      )
      .catch((err) => { //catch the rest of the error
        if (step === 'prepareSession') {
          util.displayLoginErrors();
        } else {
          util.fail(err);
        }
      });
  }
};