if (process.platform == 'win32') {
  module.exports = require('./win/contacts.js')
} else if (process.platform == 'darwin') {
  module.exports = require('./mac/contacts.js')
}
