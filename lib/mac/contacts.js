var vCardParser = require('vcardparser')
var $ = require('NodObjC')

vCardParser.parseStringSync = function(string) {
  var obj
  vCardParser.parseString(string, function(err, json) {
    obj = json
  })
  return obj
}

//TODO Add Photos to vCard data

$.framework('AddressBook')

function personToVcardString(person) {
  var vcard = person('vCardRepresentation')
  var vcardString = $.NSString('alloc')('initWithData', vcard, 'encoding', $.NSUTF8StringEncoding)
  return vcardString.toString()
}

function personToJsonWithId (person) {
  var personString = personToVcardString(person)
  var personJson = vCardParser.parseStringSync(personString)
  personJson.id = personJson['x-abuid']
  return personJson
}


var withAddressBook = function(f) {
  var pool = $.NSAutoreleasePool('alloc')('init')
  var book = $.ABAddressBook('sharedAddressBook')
  if (!book) {
    throw new Error('AddressBook access dissalowed by user')
  }
  var result
  try {
    result = f(book)
  } catch(e) {
    console.log('Error working with AddressBook', e);
  }

  pool('drain')
  return result
}
  

exports.fetch = function(id) {
  return withAddressBook(function(book) {
    var uid = $(uid)
    var person = book('recordForUniqueId', uid)
    return personToJsonWithId(person) 
  })
}

exports.fetchMe = function() {
  return withAddressBook(function(book) {
    var me = book('me')
    return personToJsonWithId(me) 
  })
}


exports.fetchAll = function(callback) {
  return withAddressBook(function(book) {
    var everyone = book('people')
    var personJsonArray = []
    var size = everyone('count')
    var person
    for (var i = 0; i < size; i++) {
      person = everyone('objectAtIndex', i);
      personJsonArray.push(personToJsonWithId(person))
    }
    return personJsonArray
  })
}


function open(uid, editMode) {
  var urlString = $("addressbook://" + uid + (editMode ? "?edit" : ""))
  var url = $.NSURL('URLWithString', urlString)
  $.NSWorkspace('sharedWorkspace')('openURL', url)
}

exports.open = function(uid) {
  open(uid)
}

exports.edit = function(uid) {
  open(uid, true)
}

exports.editNew = function() {
  withAddressBook(function(book) {
    var newPerson = $.ABPerson('alloc')('init')
    book('addRecord', newPerson)
    book('save')
    open(newPerson('uniqueId'), true)
  })
}
