# node-contacts
Package to work with system Address Book/Contacts on different platforms.

##### Mac OS 10.2 and newer
At first time user will see confirm like "*** wants to access your contacts"


##### Windows Vista
not yet implemented


##### Windows 7
not yet implemented


##### Windows 8
not yet implemented




``` js
var Contacts = require('contacts')

// return contact - json with parsed vCard 3.0 data and platform specific "id" property
Contacts.fetch(id) 

// return me - json with parsed vCard 3.0 data and platform specific "id" property
Contacts.fetchMe()

// return contacts - an Array of jsons with parsed vCard 3.0 data and platform specific "id" property
Contacts.fetchAll()

// open contacts app and select person 
Contacts.open(id)

// open contacts app, select person and enter editing mode
Contacts.edit(id)

// open contacts app, create person and enter editing mode
Contacts.editNew()

```