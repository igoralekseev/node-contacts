var vCardParser = require('vcardparser')
var $ = require('NodObjC')
var _ = require('lodash')

vCardParser.parseStringSync = function(string) {
  var obj
  vCardParser.parseString(string, function(err, json) {
    obj = json
  })
  return obj
}




$.framework('AddressBook')

function personToVcardString(person) {
  var vcard = person('vCardRepresentation')
  var vcardString = $.NSString('alloc')('initWithData', vcard, 'encoding', $.NSUTF8StringEncoding)
  return vcardString.toString()
}

function personToJson(person) {
  var personString = personToVcardString(person)
  var personJson = vCardParser.parseStringSync(personString)
  personJson.id = personJson['x-abuid']
  // TODO Add Photos to vCard data
  // personJson.photo = { type: [ 'jpeg' ], value: 'base64' }
  return personJson
}


var withAddressBook = function(f) {
  var pool = $.NSAutoreleasePool('alloc')('init')
  var book = $.ABAddressBook('sharedAddressBook')
  if (!book) {
    throw new Error('AddressBook access disallowed by user')
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
    var uid = $(id)
    var person = book('recordForUniqueId', uid)
    return personToJson(person) 
  })
}

exports.fetchMe = function() {
  return withAddressBook(function(book) {
    var me = book('me')
    return personToJson(me) 
  })
}

function vcardCust(a,b) {
  if (_.isArray(a) && _.isArray(b)) {
    return _.uniq(a.concat(b), function(i) {
      return i.value || i
    });
  }

  if (_.isString(a) && _.isString(b)) {
    return a.length > b.length ? a : b
  }
}


exports.fetchAll = function(callback) {
  var linked = {}

  var persons = withAddressBook(function(book) {
    var everyone = book('people')
    var size = everyone('count')
    var personsObj = {}
    var person, personJson

    var s = $('uniqueId')
    for (var i = 0; i < size; i++) {
      person = everyone('objectAtIndex', i)
      personJson = personToJson(person)
      personsObj[personJson.id] = personJson

      var linkedPeople = person('linkedPeople')
      var linkedPeopleSize = linkedPeople('count')
      if (linkedPeopleSize) {
        var t = [  ]
        for (var j = 0; j < linkedPeopleSize; j++) {
          var lp = linkedPeople('objectAtIndex', j);
          t.push(lp('uniqueId').toString())
        }
        linked[personJson.id] = t
      }
    }
    return personsObj
  })

  
  // merge linked vcards
  _.forEach(linked, function(value, key) {
    var dest = persons[key]
    if (!dest) return
    ids = _.without(value, key)

    var args = [dest]
    args.concat(_.map(ids, function(v) { return persons[v] }))
    args.push(vcardCust)
    dest = _.merge.apply(_, args)

    _.forEach(ids, function(v) { 
      if (v != key)
        delete persons[v]
    })
  })

  return _.values(persons)
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
