/**
 * @todo improve comment
 * Targets: alias, keystore, provisioning, privatekeys, pkcsr, certificate, pkcs12
 * 
 * monaca signing list alias
 * monaca signing list provisioning
 * monaca signing list privatekeys
 * 
 * monaca signing generate keystore
 * monaca signing generate pkcsr
 * 
 * monaca signing upload keystore
 * monaca signing upload certificate
 * monaca signing upload provisioning
 * monaca signing upload pkcs12
 * 
 * monaca signing add alias
 * 
 * monaca signing export keystore
 * monaca signing export pkcsr
 * 
 * monaca signing remove alias
 * monaca signing remove certificate
 * monaca signing remove provisioning
 * monaca signing remove pkcs12
 */

/**
 * @todo remove unused items.
 */
let path = require('path');
let argv = require('optimist').argv;
let shell = require('shelljs');
let Monaca = require('monaca-lib').Monaca;
let Q = require('q');
let inquirer = require('monaca-inquirer');
let colors  = require('colors');
let lib = require(path.join(__dirname, 'lib'));
let util = require(path.join(__dirname, 'util'));

let monaca;
let _project_id;

let _methods = {
  /**
   * @todo Delete list methods.
   */
  // list: (target) => {
  //   switch(target) {
  //     case 'alias':
  //       return monaca.fetchSigningAliasCollection(_project_id);
  //     break;

  //     case 'provisioning':
  //       return monaca.fetchSigningProvisioningProfileCollection();
  //     break;
      
  //     case 'privatekeys':
  //       return monaca.fetchSigningPrivateKeyCollection();
  //     break;
      
  //     default:
  //       return Q.reject('The provided target does not support signing list capabilities.');
  //     break; 
  //   }
  // },

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
                return true;
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
                return true;
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
              message: 'Enter your email:'
            },
            {
              type: 'input',
              name: 'name',
              message: 'Enter your name:'
            },
            {
              type: 'input',
              name: 'country',
              message: 'Enter your country (E.g. US, JP, etc):'
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
        return Q.reject('The provided target does not support signing generate capabilities.');
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
              message: 'Enter KeyStore file path:'
            },
            {
              type: 'password',
              name: 'password',
              message: 'Enter KeyStore password:'
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
              message: 'Enter Certificate file path:'
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
              message: 'Enter Provisioning Profile file path:'
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
              message: 'Enter P12 file path:'
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
        return Q.reject('The provided target does not support signing upload capabilities.');
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
                return true;
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
        return Q.reject('The provided target does not support signing add capabilities.');
      break; 
    }
  },
  
  remove: (target) => {
    switch(target) {
      /**
       * @todo implement
       */
      case 'alias':
        return monaca.fetchSigningAliasCollection(_project_id)
          .then(
            (aliases) => {
              console.log(aliases);
            }
          );

        // return monaca.removeSigningAlias(_project_id, alias_name);
      break;

      /**
       * @todo implement
       */
      case 'certificate':
        return monaca.removeSigningCertificate(id);
      break;
      
      case 'provisioning':
        return monaca.fetchSigningProvisioningProfileCollection().then(
          (profiles) => {
            return inquirer.prompt(
              [
                {
                  type: 'list',
                  name: 'profile',
                  message: 'Please select a profile to remove:',
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
                return monaca.removeSigningProvisioningProfile(answers.profile);
              }  
            );
          }
        );
      break;

      /**
       * @todo implement
       */
      case 'pkcs12':
        return monaca.removeSigningPrivateKey(id);
      break;
      
      default:
        return Q.reject('The provided target does not support signing remove capabilities.');
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

      /**
       * @todo Add step to display list of avaiable CSR to select for export.
       */
      case 'pkcsr':
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
            return monaca.exportSigningPKCSR(csr_id, answers.downloadToDir);
          }  
        );
      break;
      
      default:
        return Q.reject('The provided target does not support signing export capabilities.');
      break; 
    }
  }
};

/**
 * @todo improve run to display help and error when missing action and/or item.
 */
module.exports = {
  // Entry point for all singing tasks
  run: (task, info) => {
    monaca = new Monaca(info);

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
          return monaca.prepareSession();
        }
      )
      .then(
        () => {
          // The avaialble actions are: list, generate, upload, add, remove, export
          let action = argv._[1];
          let hasAction = _methods.hasOwnProperty(action);

          let target = argv._[2];

          // If the action exists, call the action with the target.
          if(action && hasAction && target) {
            return _methods[action](target);
          } else {
            if(!action) util.fail('Missing action for the signing command.');
            if(action && !hasAction) util.fail('No such action for the signing command.');
            if(!target) util.fail('Missing target for the signing command action.');
          }
        },

        util.displayLoginErrors
      )
      .then(
        (data) => {
          if(data) console.log(data);
        },

        (message) => {
          console.log(message);
        }
      );
  }
};