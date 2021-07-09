/* -- ASSIGNMENT #6 - BY: Charles Byrne (Student Number: 97700266)
  FOR CS230[A] - Web Information Processing
  23rd April 2021 -
  - Tested in Windows at command prompt 

  - Back end - NodeJS - MongoDB

-- */

// #################################################################################
//
//    GLOBAL VARIABLES
//
// #################################################################################

var mongodb = require('mongodb');
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({  origin: "*" }));
app.use(express.json());



const MONGO_CLIENT = require('mongodb').MongoClient;
const MONGO_URI = "mongodb+srv://Assignment-05:Assignment-05@cluster0.ct1mx.mongodb.net/Assignment-05?retryWrites=true&w=majority";
const DB_NAME = "testDB";
const DEFAULT_SERVER = 3030;
const YELLOW = '\x1b[33m';
const COL_RESET = '\x1b[0m';
const COL_GREEN = '\x1b[32m';
const COL_CYAN = '\x1b[36m';
const COL_RED = '\x1b[31m';

// ------------ OTHERS:

const MAX_QTY_ITEM_ADD = 10000;

// #################################################################################

function runServer(port) {
  console.log('\x1b[44m\x1b[33m', "Server running...  on port " + port + ".", '\x1b[40m\x1b[37m');
  console.log('\x1b[40m\x1b[37m', "------------------------------------------");

  app.listen(port, function () {
    console.log('listening on ' + port)

    MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, (err, client) => {
      if (err) return console.error(err)
      console.log('Connected to Database')
      const db = client.db('testDB')

      // if connection lost: 

      
      app.get('/show/:collectionName/', (req, res) => {
        console.log("PARAM = " + req.params.collectionName);
        db.collection(req.params.collectionName).find().toArray()
          .then(results => {
            console.log(results);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results));
          })
          .catch(error => console.error(error))
      });
      // ------------------------------------------------------------------------------------- POST: UPDATE
      app.post('/update/:collectionName/', (req, res) => {
        var collectionName = req.params.collectionName;

        console.log("POST PARAM = " + collectionName);
        const postData = req.body;
        console.log("DATA", postData);
        console.log("----------------------------- Server: UPDATE - ");
        if (Object.keys(postData.update).length !== 0) {

          for (var element in postData.query) {
            console.log("PDE", postData.query[element]);
            if (postData.query[element] == '') {
              console.log("IS A IS BLANK", postData.query[element]);
              postData.query[element] = /.*/;
            } else {
              console.log("E: '" + element + "'");
              postData.query[element] = cleanData(element, postData.query[element], true); // T: useRegEx
            }

          }

          console.log(postData.update);
          console.log('UPDATE collection: ', collectionName);

          // NB: SET THE STRING CUSTOMER ID TO THE MONGO_ID TYPE:

          if (collectionName == 'orders') {
            console.log('Setting Customer ID to MONGO_ID:');
            postData.update.customer._id = getMongoDB_ID(postData.update.customer._id);
          }

          // ---------------------------------------------------------------------

          var updateObj = { $set: postData.update };

          console.log("Query Object: ", postData.query);
          console.log("update Object: ", updateObj);
          db.collection(collectionName).updateMany(postData.query, updateObj
          )
            .then(result => {
              console.log("Records updated: " + result.result.nModified);
              console.log('RESULT:', result.result.nModified);
              res.setHeader('Content-Type', 'application/json');
              res.write(JSON.stringify({ updated: result.result.nModified }));
              res.end();
            }).catch(error => console.error(error))
        } else {
          res.write(JSON.stringify({ updated: 0, message: 'No Data sent!' }));
          res.end();
        }



      }); // --------------------------------------------------------------------------------END: UPDATE POST

      // ----------------------------------------------------------------- ADD RECORD
      app.post('/add/:collectionName/', (req, res) => {
        var collectionName = req.params.collectionName;

        console.log("POST PARAM = " + collectionName);
        const postData = req.body;

        // ############################################

        console.log("----------------------------- Server: ADD - ");

        if (Object.keys(postData.update).length !== 0) {

          // NB: SET THE STRING CUSTOMER ID TO THE MONGO_ID TYPE:

          if (collectionName == 'orders') {
            console.log('Setting Customer ID to MONGO_ID:');
            postData.update.customer._id = getMongoDB_ID(postData.update.customer._id);
          }

          // ---------------------------------------------------------------------              



          console.log("Add object: ", postData.update);

          console.log("Query Object: ", postData.query);
          db.collection(collectionName).insertOne(postData.update
          )
            .then(record => {
              console.log(record);
              console.log("Inserted Item (ID): " + record.ops[0]._id);
              res.setHeader('Content-Type', 'application/json');
              res.write(JSON.stringify({ updated: record.ops[0], message: 'data added' }));
              res.end();
            }).catch(error => console.error(error))

        } else {
          res.write(JSON.stringify({ updated: 0, message: 'No Data sent!' }));
          res.end();
        }


        // ############################################

      }); // end ADD  





      // ---------------------------------------------------------------GET SHOPPING CART INFO


      app.get('/getSCInfo/', (req, res) => {
        console.log('GET Shopping Cart Data: ');


        db.collection('customers').find().toArray()
          .then(customers => {
            db.collection('items').find().toArray()
              .then(items => {
                var resObj = { customers: customers, items: items };
                console.log('res obJ: ', resObj);
                console.log('Shopping Cart extra data retrieved.');
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify(resObj));
                res.end();
              })
              .catch(error => console.error(error));
          });
      }); // END: GET SC-INFO
      // --------------------------------------------------------------- END: GET SHOPPING CART INFO


      // ----------------------------------------------------------- DELETE ADDRESS

      // -- POST IS USED HERE AS EXTRA INFORMATION IS INCLUDED IN AN OBJECT (THE SHIPPING & BILLING ADDRESS FLAG)
      //
      app.post('/deleteAddress/:recordID/:nthRec/', (req, res) => {
        var recordID = req.params.recordID;
        var nthRec = req.params.nthRec;
        var mongoDB_ID = new mongodb.ObjectID(recordID);
        const flagObj = req.body.flag;
        console.log("mongoDB_ID: ", mongoDB_ID);
        console.log("nthRec: ", nthRec);
        console.log("flagObj: ", flagObj);

        console.log("DELETE ADDRESS -> " + nthRec + " - ID: " + recordID);


        var delObject = {};
        delObject["address." + nthRec] = 1;

        db.collection('customers').updateOne({ _id: mongoDB_ID }, { $unset: delObject }).then(result => {
          db.collection('customers').updateOne({ _id: mongoDB_ID }, { $pull: { address: null } }).then(result2 => {
            delCust = result2.result.nModified;
            console.log(delCust + " document(s) updated");

            if (flagObj !== null) {
              console.log("Query Object: ", flagObj);
              //                console.log("update Object: " , updateObj);
              db.collection('customers').updateOne({ _id: mongoDB_ID }, flagObj).then(result3 => {
                console.log("Records updated: - " + result.result.nModified); // 
                var flagRecsUpdated = result3.result.nModified;
                console.log("    - with flags - " + flagRecsUpdated);
                //      printNice(collectionName, result); 
                var res_ = JSON.stringify({ updated: delCust, flagsUpdated: flagRecsUpdated });
                res.setHeader('Content-Type', 'application/json');
                res.write(res_);
                res.end();
              }).catch(error => console.error(error));
            } else {
              console.log("Address deleted: - no flags " + result);
              res.write(JSON.stringify({ delete: result, message: 'address delete' }));
              res.end();
            }

          }).catch(error => console.error(error))
        })
          .catch(error => console.error(error))



      });
      // ----------------------------------------------------------- END: DELETE ADDRESS


      // ----------------------------------------------------------- DELETE RECORD
      app.delete('/:collectionName/:recordID', (req, res) => {
        var collectionName = req.params.collectionName;
        var recordID = req.params.recordID;
        var mongoDB_ID = new mongodb.ObjectID(recordID);
        console.log("DELETE = " + collectionName + " " + recordID);

        // ############################################

        console.log("----------------------------- Server: DELETE - ");

        db.collection(collectionName).deleteOne({ _id: mongoDB_ID }).then(result => {
          console.log("Documents deleted: " + result.deletedCount);
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify({ delete: result.deletedCount, message: 'data delete' }));
          res.end();
        })
          .catch(error => console.error(error))


      });
      // ----------------------------------------------------------- END: DELETE RECORD

      app.get('/GET_DUMP/', (req, res) => {

        console.log('GET all Data: ');
        db.collection('customers').find().toArray()
          .then(customers => {
            db.collection('items').find().toArray()
              .then(items => {
                db.collection('orders').find().toArray()
                  .then(orders => {

                    var resObj = { items: items, customers: customers, orders: orders };
                    console.log('res obJ: ', resObj);


                    console.log('All data retrieved.');
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify(resObj));
                    res.end();

                  }).catch(error => console.error(error));
              }).catch(error => console.error(error));
          }).catch(error => console.error(error));

        // SERVER: general commands for communication with our front end.

      }); // END: DUMP DATABASE


    }); // CONNECTION


    // SERVER: getDUMP  // dumps the entire database as JSON

  });

} // END: function runserver()


// #####################################################################################################
// FUNCTIONS ASKED FOR IN THE SPEC: THESE CAN BE ACCESSED THROUGH PARAMS C R U D from the command line


// THESE FUNCTIONS ARE FULFILED BY deleteFromCollection(), 
// I JUST INCLUDE IT TO CLOSELY FOLLOW THE SPEC:

// DELETE: CUSTOMER ( from command prompt: d customer eg@email.com "086 123 4567" Bob  )
function deleteCustomer(deleteParameters) {
  // deleteParameters is an array. EG:   ['Email','me@email.com','Mobile','086 123 4567','FirstNames','Bob']

  console.log('Delete - Customer:');
  deleteParameters.unshift('customers');
  deleteFromCollection(deleteParameters);

} // END: function deleteCustomer()

function deleteItem(deleteParameters) {  // deleteParameters is an array. EG:   ['Model','iPhone 5']

  deleteParameters.unshift('items');
  deleteFromCollection(deleteParameters);

} // END: function deleteItem()


function deleteOrder(deleteParameters) {  // deleteParameters is an array. EG:   ['Model','iPhone 5']

  deleteParameters.unshift('orders');
  deleteFromCollection(deleteParameters);

} // END: function deleteOrder()


// #####################################################################################################



// FUNCTIONS FOR RANDOM GENERATION :

function randomInt(max) {
  return Math.floor(Math.random() * max);
}


function createRandomUser() {
  //     $user = ['Mr', 'Mick', 'McGoo', '086 123 4567', 'mick@mcgoo.com'];

  var titles = [['Mx', 'Ms', 'Mrs', 'Miss', 'Sr'], ['Mr', 'Dr', 'Fr']]; // Titles
  var cNames = [['Philomena', 'Sandra', 'Jane', 'Mary', 'Anne', 'Catherine', 'Therese', 'Brighid', 'Clare'],
  ['Paul', 'Francis', 'James', 'Sean', 'Joseph', 'Frank', 'Anthony', 'Gerry', 'Pat', 'Louis', 'Leo', 'Mick', 'Conor']];


  var sNames = ['Murphy', 'McGoo', 'Doe', 'Byrne', 'Gaynor', 'McDonald', 'Woods', 'Clarke', 'Molloy',
    'McDonald', 'Brogan', 'Barry', 'Quinn', 'McGuffin', 'Grendon', 'Malone', 'McGuire'];
  var domainNames = ['gmail.com', 'hotmail.com', 'email.com', 'mumail.ie'];

  var sex = randomInt(2);
  var title = titles[sex][randomInt(titles[sex].length)];
  var cName = cNames[sex][randomInt(cNames[sex].length)];
  var surname = sNames[randomInt(sNames.length)];
  var mobile = "08" + randomInt(10) + " " + (100 + randomInt(900)) + " " + (1000 + randomInt(9000));
  var email = cName.toLowerCase() + '@' + domainNames[randomInt(domainNames.length)];
  var user = {
    Title: title,
    FirstNames: cName,
    Surname: surname,
    Mobile: mobile,
    Email: email
  };
  return user;
}

function getRandomProduct() {

  //          {Manufacturer:  Model:  Price: };
  var returnObj = {};
  var MakeA = ['e', 'Brick', 'Clever', 'nice', 'spy', 'great', 'wonderful', 'smart'];
  var MakeB = ['Phone', 'Mobile', 'Device', 'Tablet', 'Fone', 'Phone', 'Call'];
  var Manuf = ['Apple', 'Samsung', 'Google', 'Nokia', 'Hauawei', 'Fodavone', 'Philips', 'Sony', 'JVC', 'Bosch'];

  returnObj.Manufacturer = Manuf[randomInt(Manuf.length)];

  var suffixType = randomInt(4);
  var suffix;
  if (suffixType == 0) {
    suffix = '';
  } else if (suffixType == 1) {
    var suffixNum = 1 + randomInt(20);
    suffix = ' ' + suffixNum;
  } else if (suffixType == 2) {
    var suffixNum = 2021 - randomInt(6);
    suffix = ' ' + suffixNum;
  } else if (suffixType == 3) {
    var suffixNum = (1 + randomInt(50)) * 10;
    suffix = ' ' + suffixNum;
  }
  if (randomInt(3) == 0) {
    suffix += String.fromCharCode(65 + randomInt(26));
  }

  returnObj.Model = MakeA[randomInt(MakeA.length)] + MakeB[randomInt(MakeB.length)] + suffix;
  returnObj.Price = 20 + (randomInt(26) * 5) - (randomInt(2) / 100); // makes the .99

  return returnObj;

} // END: function getRandomProduct()

function createRandomAddress() {

  var streetNamesA = ['College', 'Melody', 'Hawthorn', 'Sycamore', 'Cottage', 'Lake', 'Greenfields', 'Mountain', 'Stream', 'Lake'];
  var streetNamesB = ['Rise', 'Drive', 'Avenue', 'Gardens', 'Green', 'Park', 'Heights', 'Valley', 'View', 'Manor', 'Terrace'];
  var RoadNamesA = ['Dublin', 'Main', 'Wide', 'Narrow', 'Scenic', 'Winding', 'Straight', 'Side'];
  var RoadNamesB = ['Road', 'Road', 'Way'];
  var towns = [
    ['Tallaght', 'Dublin 24'],
    ['Howth', 'Co Dublin'],
    ['Dun Laoghaire', 'Co Dublin'],
    ['Dalkey', 'Dublin'],
    ['Killiney​', 'Co Dublin'],
    ['Skerries', 'Co Dublin'],
    ['Santry', 'Dublin 9'],
    ['Ballymun', 'Dublin 9'],
    ['Drumcondra', 'Dublin 9'],
    ['Glasnevin', 'Dublin 9'],
    ['Clonsilla', 'Dublin 15'],
    ['Cork City', 'Co Cork'],
    ['Galway City', 'Co Galway'],
    ['Drogheda', 'Co Louth'],
    ['Swords', 'Fingal'],
    ['Dundalk', 'Louth'],
    ['Bray', 'Wicklow'],
    ['Navan', 'Meath'],
    ['Kilkenny', 'Kilkenny'],
    ['Ennis', 'Clare'],
    ['Carlow', 'Carlow'],
    ['Tralee', 'Kerry'],
    ['Newbridge', 'Kildare'],
    ['Portlaoise', 'Laois'],
    ['Balbriggan', 'Fingal'],
    ['Naas', 'Kildare'],
    ['Athlone', 'Westmeath'],
    ['Mullingar', 'Westmeath'],
    ['Celbridge', 'Kildare'],
    ['Wexford', 'Wexford'],
    ['Letterkenny', 'Donegal'],
    ['Sligo', 'Sligo']
  ];

  var houseNumber = randomInt(401);
  if (houseNumber > 0)
    var line1 = houseNumber + " ";
  else
    var line1 = "";
  line1 += streetNamesA[randomInt(streetNamesA.length)] + ' ' + streetNamesB[randomInt(streetNamesB.length)];
  if (randomInt(3) > 0) {
    var line2 = RoadNamesA[randomInt(RoadNamesA.length)] + ' ' + RoadNamesB[randomInt(RoadNamesB.length)];
  } else {
    var line2 = "";
  }
  var townAndCounty = towns[randomInt(towns.length)];
  var eircode = String.fromCharCode(65 + randomInt(26)) + randomInt(10) + randomInt(10) + ' ' + String.fromCharCode(65 + randomInt(26)) + String.fromCharCode(65 + randomInt(26)) + randomInt(10) + randomInt(10);

  var address = {
    Line1: line1,
    Line2: line2,
    Town: townAndCounty[0],
    County: townAndCounty[1],
    Eircode: eircode
  }
  return address;

} // END: function createRandomAddress()


// #####################################################################################################

// INTERATION WITH MONGODB DATABASE FUNCTIONS : 



function dropDB(dbName, cbFunction) {  // deletes all collections from this db

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    var fn;
    dbo.listCollections().toArray((err, collections) => {
      console.log("LEN: " + collections.length);
      if (collections.length == 0) {
        if (cbFunction !== null) {
          console.log("Database '" + dbName + "' empty.");
          cbFunction();
        }
      } else {
        var dropCount = 0;
        var colLen = collections.length;
        var cName;
        for (var i = 0; i < colLen; i++) {
          cName = collections[i].name;
          console.log("DROPPING: " + cName);
          dropCollection(dbName, collections[i].name, () => {
            console.log("Collection dropped");
            dropCount++;
            if (dropCount >= colLen) {
              console.log("All collections dropped! " + colLen + " of " + dropCount + ".");
              if (cbFunction !== null) {
                console.log("CALLBACK AFER DROP. " + dropCount);
                cbFunction();
              }
            }
          });
        } // for loop
      } // if there are collections to be deleted
    });
  });

} // END: function dropDB()



function insertOne(collection, record, cbFunction) {
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collection).insertOne(record, function (err, res) {
      if (err) throw err;
      db.close();
      if (cbFunction !== null) {
        cbFunction(record);
      }
    });
  });
} // END: function insertOne()



// NB: insert into database with callback functionality

function insertMultiple2_withCB(MONGO_URI, dbName, collectionName, objToInsert, cbFunction) {

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.collection(collectionName).insertMany(objToInsert, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
      if (cbFunction !== null) {
        console.log("CALL CB FUNCTION.");
        cbFunction();
      }
    });
  });
} // END: function insertMultiple2_withCB()



function insertSingle2_withCB(MONGO_URI, dbName, collectionName, objToInsert, cbFunction) {

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.collection(collectionName).insertOne(objToInsert, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
      if (cbFunction !== null) {
        cbFunction();
      }
    });
  });
} // END: function insertSingle2_withCB()


function findOne(collectionName, queryObj, cbFunction) {

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collectionName).findOne(queryObj, function (err, result) {
      if (err) throw err;
      console.log(result.name);
      db.close();
      if (cbFunction !== null) {
        cbFunction(queryObj);
      }
    });
  });
} // end function findOne()

function findAll(collectionName, cbFunction) {

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collectionName).find({}).toArray(function (err, result) {
      if (err) throw err;
      db.close();
      if (cbFunction !== null) {
        cbFunction(result);
      }
    });
  });
}




function queryDB_regularExpression(collectionName, queryObj, cbFunction) {

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collectionName).find(queryObj).toArray(function (err, result) {
      if (err) throw err;
      //      console.log(result);
      db.close();
      if (cbFunction !== null) {
        cbFunction(result);
      }
    });
  });
}

function queryWithSort(collectionName, queryObj, sortObj, cbFunction) {
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);

    // EG: sortObj  = { Surname: 1 }; // 1 = ASC ; -1 = DESc

    dbo.collection(collectionName).find(queryObj).sort(sortObj).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
      if (cbFunction !== null) {
        cbFunction(result);
      }
    });
  });

} // function queryWithSort()


function deleteRec(collectionName, myquery, cbFunction) {
  console.log('collectionName', collectionName);
  console.log('myquery', collectionName);


  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collectionName).deleteMany(myquery, function (err, result) {
      if (err) throw err;
      db.close();
      if (cbFunction !== null) {
        cbFunction(result);
      }
    });
  });

} // END: function deleteRec()


function delRecByID(collectionName, theID, cbFunction) {


  if (!mongodb.ObjectID.isValid(theID)) { // check to see if ID is a valid hex string
    console.log("Please enter a valid id. This must be a single String of 24 hex characters");
    return;
  }
  var mongoDB_ID = new mongodb.ObjectID(theID);
  console.log('theID', theID);
  //  return;

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collectionName).deleteOne({ _id: mongoDB_ID }, function (err, result) {
      if (err) throw err;
      db.close();
      if (cbFunction !== null) {
        cbFunction(result);
      }
    });
  });
} // END: function delRecByID()



function deleteMany(collectionName, query, cbFunction) {
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);

    dbo.collection(collectionName).deleteMany(query, function (err, obj) {
      if (err) throw err;
      db.close();
      if (cbFunction !== null) {
        cbFunction(obj);
      }
    });
  });
} // END: function deleteMany()


function dropCollection(dbName, collectionName, cbFunction) {
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.dropCollection(collectionName, function (err, delOK) {
      if (err) throw err;
      if (delOK) console.log("Collection '" + collectionName + "' deleted");
      db.close();
      if (cbFunction !== null) {
        cbFunction();
      }
    });
  });
}

function goUpdate(collectionName, theQuery, newValues, cbFunction) {
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collectionName).updateMany(theQuery, newValues, function (err, res) {
      if (err) throw err;
      db.close();
      if (cbFunction !== null) {
        cbFunction(res);
      }
    });
  });
}

function deleteFromCart(cartID, nthItem, cbFunction) {
  console.log("DELETE FROM ID: '" + cartID + "'.NTH: " + nthItem);

  var cart_ID = new mongodb.ObjectID(cartID);
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);


    var myquery = { _id: cart_ID };
    var delObject = {};
    delObject["shoppingCart." + nthItem] = 1;

    dbo.collection("orders").updateOne({ "_id": cart_ID }, { $unset: delObject }, function (err, res) {
      dbo.collection("orders").updateOne({ "_id": cart_ID }, { $pull: { shoppingCart: null } }, function (err, res) {
        if (err) throw err;
        console.log(res.result.nModified + " order(s) updated");
        db.close();
      });
    });
  });

} // END: function deleteFromCart()

function deleteAddress(customerID, nthItem, cbFunction) {
  console.log("DELETE FROM ID: '" + customerID + "'.NTH: " + nthItem);

  var customerID = new mongodb.ObjectID(customerID);
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);


    var myquery = { _id: customerID };
    var delObject = {};
    delObject["address." + nthItem] = 1;

    dbo.collection("customers").updateOne({ "_id": customerID }, { $unset: delObject }, function (err, res) {
      dbo.collection("customers").updateOne({ "_id": customerID }, { $pull: { address: null } }, function (err, res) {
        if (err) throw err;
        console.log(res.result.nModified + " document(s) updated");
        db.close();
        if (cbFunction != null) {
          cbFunction(res.result.nModified);
        }
      });
    });
  });

} // END: function deleteAddress()


function goUpdateMany(MONGO_URI) {
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    var myquery = { address: /^S/ };
    var newvalues = { $set: { name: "Minnie" } };
    dbo.collection("customers").updateMany(myquery, newvalues, function (err, res) {
      if (err) throw err;
      console.log(res.result.nModified + " document(s) updated");
      db.close();
    });
  });
}

function showOnlySoMany(MONGO_URI, number) {
  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection("customers").find().limit(number).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
    });
  });
}


function createManyAddresses(numberOfAddresses, addType) {
  var addresses;
  addresses = [];

  if (addType) {
    var sAddr = randomInt(numberOfAddresses);
    var bAddr = randomInt(numberOfAddresses);
  } else {
    var sAddr = -1;
    var bAddr = -1;
  }

  for (var i = 0; i < numberOfAddresses; i++) {
    var currentAddress = createRandomAddress();

    if (sAddr == i && bAddr == i) currentAddress.type = 1;
    else if (sAddr == i) currentAddress.type = 2;
    else if (bAddr == i) currentAddress.type = 3;
    else currentAddress.type = 0;

    addresses.push(currentAddress);
  }

  return addresses;
}

function insertMultiple2a(MONGO_URI, collection, myObj) {

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);

    dbo.collection(collection).insertMany(myObj, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
    });
  });
} // END: function insertMultiple2()

function createCustomers(n, cbFunction) {
  var newUsers = [];
  var newUser;

  console.log("CREATING CUSTOMERS... " + n);

  for (var i = 0; i < n; i++) {
    newUser = createRandomUser();

    newUser.address = createManyAddresses((randomInt(4) + 1), true);
    newUsers.push(newUser);
  }
  insertMultiple2_withCB(MONGO_URI, DB_NAME, "customers", newUsers, cbFunction);
} // END: function createCustomers(n)


function createProducts(numberOfItems, cbFunction) {
  var newItems = [];
  for (var i = 0; i < numberOfItems; i++) {
    newItems.push(getRandomProduct());
  }

  console.log('Create (' + numberOfItems + ') Products...');
  insertMultiple2_withCB(MONGO_URI, DB_NAME, "items", newItems, () => {
    console.log("Product List created");
    if (cbFunction !== null) {
      cbFunction();
    } else {
      console.log("CB NULL!!!");
    }
  });
}

function getRecords(collection, theQuery, functionAfter) {

  MONGO_CLIENT.connect(MONGO_URI, { useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db(DB_NAME);
    dbo.collection(collection).find(theQuery).toArray(function (err, result) {
      if (err) throw err;
      db.close();
      functionAfter(result);
    });
  });
} // END: function getRecords()

function isInList(shoppingCart, curProductID) {
  for (var i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i].product._id === curProductID) {
      return i;
    }
  }
  return -1;
}


// Almost the same function as in index.html: - here returns zero if no address found:

function findSAB(addr, typeWanted) {
  for (var i in addr) if (addr[i].type == typeWanted || addr[i].type == 1) return i;
  return 0; // returns zero
}

function createRandomPurchases(customers, productsForSale, cbFunction) {
  var discountTexts = [' discount for a loyal customer', ' SPECIAL DISCOUNT, thank you', ' discount', ' Holiday Discount', ' - Discount, have a nice day! :)', ' DISCOUNT - your custom is much appreciated'];
  var cLen = customers.length;
  var pLen = productsForSale.length;
  var shoppingCart = [];
  var currentPick, thisCustomer, thisProduct, curQuantity;
  var cartSize = randomInt(10) + 1;
  var _isInList;
  var totalCost = 0;

  console.log("Items bought: " + cartSize);
  if (cLen < 2) {
    thisCustomer = customers[0];
  } else {
    thisCustomer = customers[randomInt(cLen)];
  }

  for (var i = 0; i < cartSize; i++) {
    thisProduct = productsForSale[randomInt(pLen)];
    console.log(thisCustomer.FirstNames + ' ' +
      thisCustomer.Surname + ' bought :' + thisProduct.Manufacturer + ' ' + thisProduct.Model + '. Cost: € ' + thisProduct.Price);
    _isInList = isInList(shoppingCart, thisProduct._id);
    totalCost += thisProduct.Price;
    if (_isInList < 0) {
      curQuantity = 1;
      currentPick = {
        product: thisProduct,
        quantity: curQuantity
      };
      shoppingCart.push(currentPick);
    } else {
      shoppingCart[_isInList].quantity++;
    }
  } // for loop

  // figure out addresses
  if (!thisCustomer.hasOwnProperty('address')) { // this shouldn't be:
    shippingAddress = null;
    billingAddress = null;

    logColour(YELLOW, 'This customer has no address!!! ');
    console.log('Cannot complete the purchase');
    logColour(COL_RESET, 'Please create an address for this customer. (ID: ' + thisCustomer._id) + ')';
    return;

  } else if (thisCustomer.address.length == 1) {
    var shippingAddress = thisCustomer.address[0];
    var billingAddress = thisCustomer.address[0];
  } else {
    var shippingAddress = thisCustomer.address[findSAB(thisCustomer.address, 2)]; //thisCustomer.address[0];
    var billingAddress = thisCustomer.address[findSAB(thisCustomer.address, 3)]; //thisCustomer.address[1];
  }


  // the shopping Cart object is now complete!
  // add it to the database...
  var discount = {};
  if (randomInt(5) == 4) {
    var discountAmt;      // Don't always give a very high discount! :
    if (randomInt(10) > 5) discountAmt = randomInt(76) + 1;
    else if (randomInt(10) > 3) discountAmt = randomInt(50) + 1;
    else discountAmt = randomInt(25) + 1;

    var descTxt = '' + discountAmt + '% ' + discountTexts[randomInt(discountTexts.length)];
    discount = {
      amount: discountAmt,
      desc: descTxt
    }
  } else {
    discount = {
      amount: 0,
      desc: "FULL PRICE"
    }
  }
  //var date = new Date();
  var newOrder = {
    orderDate: Date.now(),
    customer: {
      _id: thisCustomer._id,
      name: thisCustomer.Title + ' ' + thisCustomer.FirstNames + ' ' + thisCustomer.Surname,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress
    },
    shoppingCart: shoppingCart,
    discount: discount
  };
  insertSingle2_withCB(MONGO_URI, DB_NAME, "orders", newOrder, cbFunction);
}

function goCreateRandomPurchases(n, cbFunction) {
  getRecords('items', {}, (productsForSale) => {
    if (!productsForSale.length > 0) {
      console.log(productsForSale.length);
      logColour(YELLOW, 'NO PRODUCTS!!! ');
      logColour(COL_RESET, 'Please create an item');
      return;
    }
    console.log("2. Getting customer details...");
    getRecords('customers', {}, (customers) => {
      if (!customers.length > 0) {
        console.log(customers.length);
        logColour(YELLOW, 'NO CUSTOMERS!!! ');
        logColour(COL_RESET, 'Please create an customer record.');
        return;
      }
      console.log("3. Creating random purchases (" + n + ")...");
      for (var i = 0; i < n; i++) {
        if (i < (n - 1)) {
          createRandomPurchases(customers, productsForSale, () => {
            console.log("Purchase " + n + " complete!");
          });
        } else {
          createRandomPurchases(customers, productsForSale, () => {
            console.log("Last Purchase, # " + n + " complete!");
            if (cbFunction !== null) {
              cbFunction();
            }
          });
        }

      }

    });
  });
  console.log("1. Getting product details...");

} // END: function goCreateRandomPurchases()



function goCreateRandomPurchases_forCustomer(customerID, n, cbFunction) {

  console.log("1. Getting product details...");
  getRecords('items', {}, (productsForSale) => {

    console.log("2. Getting this customer details...");
    getRecords('customers', { _id: customerID }, (customers) => {

      if (customers.length > 0) {
        console.log("############################################" + customers[0].FirstNames);
        console.log("3. Creating random purchases (" + n + ") for " + customers[0].FirstNames + "...");
        for (var i = 0; i < n; i++) {
          if (i < (n - 1)) {
            createRandomPurchases(customers, productsForSale, () => {
              console.log("Purchase " + n + " complete!");
            });
          } else {
            createRandomPurchases(customers, productsForSale, () => {
              console.log("Last Purchase, # " + n + " complete!");
              if (cbFunction !== null) {
                cbFunction();
              }
            });
          }

        } // for loop
      } else {
        console.log("Customer with ID " + customerID + " not found.")
      }


    }); // customers callback
  });

} // END: function goCreateRandomPurchases_forCustomer()

function fillData(customers, purchases, items, cbFunction) {
  createProducts(items, () => {
    console.log("Call create " + customers + " customers...");
    createCustomers(customers, () => {
      console.log("Call create " + purchases + " purchases...");
      goCreateRandomPurchases(purchases, cbFunction);
    });

  });
}

function justFillData(customers, purchases, items) {
  fillData(customers, purchases, items, () => {
    console.log("FINISHED");
    process.exit();
  });  // NB: IMPORTANT
}

function dropDBAndFillData(customers, purchases, items) {
  dropDB(DB_NAME, () => {
    justFillData(customers, purchases, items);
  });
}

function getSafeParam(paramNumber) { // gets the parameters if they exist otherwise return ''
  paramNumber += 2;
  if (process.argv.length > paramNumber) {
    return process.argv[paramNumber];
  } else {
    return '';
  }

} // END: function getSafeParam()

function getExtendedParams(parameters, startParam, useRegEx) {

  var paramPairs = (parameters.length - startParam) / 2;
  var returnObj = {};
  var curField, curFieldData;

  for (var i = 0; i < paramPairs; i++) {
    curField = parameters[(startParam + (i * 2))];
    curFieldData = parameters[((startParam + 1) + (i * 2))];
    if (curField == 'id') curField = '_id'; // add some leeway for ID field

    curFieldData = cleanData(curField, curFieldData, useRegEx); // important function

    returnObj[curField] = curFieldData;
  } // for loop

  return returnObj;

} // END: function getExtendedParams()

function cleanData(curField, curFieldData, useRegEx) {

  if ((curField == '_id') || (curField == 'id') || (curField.substring(curField.length - 4, curField.length) == '._id')) {


    if (mongodb.ObjectID.isValid(curFieldData)) { // check to see if ID is a valid hex string
      curFieldData = new mongodb.ObjectID(curFieldData);
    } else {
      curFieldData = '';
      console.log("Please enter a valid id. This must be a single String of 24 hex characters");
    }
  } else {
    if (curFieldData == '') {
      if (useRegEx) {
        curFieldData = /.*/;
      }
    } else if (!isNaN(curFieldData)) {     // This is needed if you want to delete/change an numerical item
      curFieldData = parseFloat(curFieldData);
    } else {
      if (useRegEx) {  // convert to RegEx if wanted
        try {
          curFieldData = new RegExp(curFieldData, 'i');
        } catch (e) { }
      }
    }
  }
  return curFieldData;

} // END: function cleanData


function deleteFromCollection(deleteParameters) { // this is the collection name

  console.log('del params', deleteParameters);

  if (deleteParameters.length == 2) {  //  'delete customer [ID]'
    console.log("DELETE: " + deleteParameters[0] + ", " + deleteParameters[1]); // this is the ID number
    delRecByID(deleteParameters[0], deleteParameters[1], (result) => {
      console.log("Documents deleted: " + result.deletedCount);

    });
  } else if ((deleteParameters.length - 1) % 2 === 0) { // parameters = delete [collection] [field1] [value1] [field2] [value2], etc.

    delObj = getExtendedParams(deleteParameters, 1, true);
    console.log('\x1b[41m\x1b[37m', "DELETE from " + deleteParameters[0] + " : ", '\x1b[40m\x1b[37m');
    console.log('Delete Parameters:', delObj);

    deleteRec(deleteParameters[0], delObj, (result) => {
      console.log("Documents deleted: " + result.deletedCount);
      console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");
    });

  } else {
    console.log("You need an even number of parameters. EG: delete customers Email pat@gmail.com  Mobile \"087 946 2517\" FirstNames Pat ");
  }

} // END: function deleteFromCollection()

function deleteCustomerAddress(deleteParameters) {

  if (deleteParameters.length < 3 || deleteParameters.length > 4) {
    console.log("You need 4 (or 5) parameters: 'delete address [customer ID] [nth address index (0 = 1st)]");
    console.log(" {optional: which index to give shipping and or billing flag to");
    console.log(" if blank this will be the first record, -1 = don't change] }");
    console.log(" -- EG: 'delete address 60772f5308920c0dfcefb9d0 0' ");
  } else {
    console.log("DELETE ADDRESS: Customer ID [" + deleteParameters[1] + "] - Address # " + deleteParameters[2]);
    // STEP 1: get record # ID x
    // 60772f5208920c0dfcefb9cd

    if (mongodb.ObjectID.isValid(deleteParameters[1])) { // check to see if ID is a valid hex string
      var mongoDB_ID = new mongodb.ObjectID(deleteParameters[1]); //60772f5208920c0dfcefb9cd
      console.log('ID: ' + mongoDB_ID);
      queryDB_regularExpression('customers', { '_id': mongoDB_ID }, (result) => {
        console.log("RESULT: ", result);
        if (result.length > 0) {
          console.log(result[0].address);
          console.log("STEP 1: ", result);
          // now you need to remove this address record AND change the other records to see
          // if shipping & billing info has to be updated
          var addressPart = result[0].address;
          if (addressPart == null) {
            console.log("No addresses!");
          } else if (isNaN(deleteParameters[2]) || deleteParameters[2] < 0) {
            console.log(" Please select an index between 0 - " + (addressPart.length - 1) + ".");
          } else if (addressPart.length <= deleteParameters[2]) {
            console.log("There are only " + addressPart.length + " addresses for this record.");
            console.log("-- You wanted to delete # " + (parseInt(deleteParameters[2]) + 1) + ". (Index starts at 0). Select a value 0 - " + (addressPart.length - 1) + ".");
          } else {
            var delRec = addressPart.splice(deleteParameters[2], 1);
            var addressTypeFlag = delRec[0].type;
            console.log("AT: " + addressTypeFlag);
            if (addressTypeFlag > 0) { // transfer flag if there is one 1, 2 or 3
              // need to update shipping & billing addresses
              var deleteFlag = 0;
              if (deleteParameters.length == 4) {
                deleteFlag = deleteParameters[3];
                if (deleteFlag == deleteParameters[2]) deleteFlag = -1; // if the same, do nothing
                else if (deleteFlag > deleteParameters[2]) deleteFlag--; // account for the one removed (NB)
              }
              // if this is -1 - do no flag transfer
              if (deleteFlag > -1 && deleteFlag < addressPart.length) {
                console.log("DP:" + deleteFlag);
                if (addressTypeFlag == 1) {
                  console.log("Address " + deleteFlag + " NOW S&B");
                  addressPart[deleteFlag].type = 1;
                } else {
                  if (addressPart[deleteFlag].type == 0) {
                    console.log("Address " + deleteFlag + " NOW " + addressTypeFlag);
                    addressPart[deleteFlag].type = addressTypeFlag;
                  } else {
                    console.log("Address " + deleteFlag + " NOW S & B");
                    addressPart[deleteFlag].type = 1; // must be shipping & billing
                  }
                }
              }

            } // END: flag transfer

            // Update the mongoDB

            if (addressPart.length < 1) {
              addressPart = [];
            }
            var theQuery = { _id: mongoDB_ID };
            var newValues = { $set: { address: addressPart } };
            goUpdate('customers', theQuery, newValues, (res) => {
              //                  console.log("UPDATED: ", res.result);
              console.log(res.result.nModified + " document " + ((res.result.nModified != 1) ? 's' : '') + " updated");
            });

            console.log("Removed: ", delRec);
            console.log("NOW: ", addressPart);

          }
        } else {
          console.log("Record with id " + deleteParameters[1] + " not found.")
        }
      });
    } else {
      console.log("Please enter a valid id. This must be a single String of 24 hex characters");
    }
  }

} // END: function deleteCustomerAddress()


function deleteCustomerAndOrders(customerArray) {        // called recursively with callback

  var customerID = customerArray.splice(0, 1);
  customerID = customerID[0];
  console.log('CUSTOMER_ID:', customerID);
  console.log('customerArray', customerArray);


  if (mongodb.ObjectID.isValid(customerID)) { // check to see if ID is a valid hex string
    var mongoDB_ID = new mongodb.ObjectID(customerID); //60772f5208920c0dfcefb9cd
    console.log('Deleting orders from customer with id ' + mongoDB_ID + ' ...');
    deleteMany('orders', { 'customer._id': mongoDB_ID }, (result) => {
      console.log(result.result.n + " order(s) deleted");
      console.log('Deleting customer with id ' + mongoDB_ID + ' ...');
      deleteRec('customers', { '_id': mongoDB_ID }, (result) => {
        console.log("Customer records deleted: " + result.deletedCount);
        // you could recursively call deleteCustomerAndOrders
        if (customerArray.length > 0) {
          deleteCustomerAndOrders(customerArray);
        }
      });
    });
  } else {
    console.log("ID: " + customerID);
    console.log("Please enter a valid id. This must be a single String of 24 hex characters");
  }

} // END: function deleteCustomerAndOrders()

function goUpdateCollection(params) {

  // the same function does for all three collections: 

  // item - customer - address - order
  //  --- update customer Name Bob [WHERE] Name Fred

  // ###################################################################################


  if (params.length < 6) {
    logColour(YELLOW, "You need at least 6 parameters: update [collection name] [field name] [Field Value] WHERE [Field Name] [regular expression]");
    console.log(" - regular expressions used = for exact match use \"^Bob$\". ");
    console.log('You can use dots: e.g.: update orders customer.name "Mrs Mary McDonald" WHERE customer.name "Miss Mary Murphy" ');
    console.log("PL: " + params.length);
    console.log("PA" + params[0]);
  } else {
    var queryExample = 'EG: update customers Surname McDonald WHERE Surname McDuck';

    var collectionName = params[0];

    if (collectionName == 'customer') collectionName = 'customers';
    else if (collectionName == 'item') collectionName = 'items';
    else if (collectionName == 'order') deleteParameters = 'orders';

    var whereIsWhere = findWhere(params);
    if (whereIsWhere == -1) {
      logColour(YELLOW, "You need to use the WHERE KEYWORD.");
      console.log(queryExample);
    } else {
      var beforeWhere = params.slice(1, whereIsWhere);
      var afterWhere = params.slice(whereIsWhere + 1, params.length);
      if (beforeWhere.length < 2 || afterWhere.length < 2) {
        logColour(YELLOW, "After '" + collectionName + "', you need at least 2 parameters for your query before WHERE and after.");

        console.log(queryExample);
      } else if (beforeWhere.length % 2 != 0 || afterWhere.length % 2 != 0) {
        logColour(YELLOW, "After '" + collectionName + "', you need an even number of params before WHERE and after.");
        console.log(queryExample);
      } else {
        var queryObj = getExtendedParams(afterWhere, 0, true);
        var updateObj = { $set: getExtendedParams(beforeWhere, 0, false) }; //{$set: {  }};
        console.log("Query Object: ", queryObj);
        console.log("update Object: ", updateObj);
        goUpdate(collectionName, queryObj, updateObj, (result) => {
          console.log("Records updated: " + result.result.nModified);
        });
      }

    } // END: WHERE KEYWORD EXISTS

  } // END: ENOUGH PARAMS

} // END: function goUpdateCollection()


function goDelete(deleteParameters) {

  if (deleteParameters.length < 2) {
    console.log("You need at least 2 parameters [collection name customers, address, items or orders] and ID.");
    console.log("1. 'delete customer 6076fa133da4513f1099c3dc' - deletes customer with ID 6076fa133...");
    console.log(" -- EG: 'delete customers_with_orders 60772f5308920c0dfcefb9d0 ' ");
    console.log(" -- EG: 'delete order 60772f5308920c0dfcefb9d0 ' ");
    console.log(" -- EG: 'delete fromcart 60772f5308920c0dfcefb9d0 4' ");
    console.log(" -- EG: 'delete address 60772f5308920c0dfcefb9d0 0' ");
    console.log(" -- EG: ' delete customers_orders 60772f5308920c0dfcefb9d0 ' ");
    console.log(" -- EG: ' delete address CUSTOMER_ID nthADDRESS");
    console.log(" -- EG: ' delete customers 60772f5308920c0dfcefb9d0");

  } else { // we have at least:  delete param1 param2

    // SPECIAL CASES FIRST: 

    var firstDeleteParameter = deleteParameters[0].toLocaleLowerCase();

    if (firstDeleteParameter == 'fromcart') {
      if (deleteParameters != 3) {
        console.log("You need 4 parameters: 'delete fromcart [order ID] [position in cart]");
        console.log(" -- EG: 'delete fromcart 60772f5308920c0dfcefb9d0 4' ");
      } else {
        deleteFromCart(deleteParameters[1], deleteParameters[2], () => {
          console.log("Item in Checkout delete complete.");
        });
      }
    }

    // DELETE ADDRESS
    // param 1 = collection name param 2 = id

    else if (firstDeleteParameter == 'address') {
      deleteCustomerAddress(deleteParameters);
    } else if (firstDeleteParameter == 'customer_orders') {
      if (deleteParameters.length != 2) {
        console.log("You need 3 parameters: 'delete customer_orders [customer ID] ");
        console.log(" -- EG: ' delete customer_orders 60772f5308920c0dfcefb9d0 ' ");
      } else {
        console.log("Delete all orders from customer with ID: " + deleteParameters[1]);


        if (mongodb.ObjectID.isValid(deleteParameters[1])) { // check to see if ID is a valid hex string
          var mongoDB_ID = new mongodb.ObjectID(deleteParameters[1]); //60772f5208920c0dfcefb9cd
          deleteMany('orders', { 'customer._id': mongoDB_ID }, (result) => {
            console.log(result.result.n + " order(s) deleted");
            //            queryDB_regularExpression('orders', 'customer._id', mongoDB_ID, (result)=> {
            //              console.log("DELETED: " , result.result.rescn);
          });
        } else {
          console.log("Please enter a valid id. This must be a single String of 24 hex characters");
        }
      }
    } else if (firstDeleteParameter == 'customers_with_orders'
      || firstDeleteParameter == 'customer_with_orders') {
      if (deleteParameters.length < 2) {
        logColour(YELLLOW, 'You need at least 3 parameters: \'delete customer_with_orders [customer ID]\'');
        console.log(" -- EG: ' delete customers_with_orders 60772f5308920c0dfcefb9d0 ' ");
      } else if (deleteParameters.length == 2) {

        deleteCustomerAndOrders([deleteParameters[1]]); // this is the CUSTOMER_ID

      } else if ((deleteParameters.length - 1) % 2 === 0) { // parameters = delete [collection] [field1] [value1] [field2] [value2], etc.
        console.log("Delete customers_with_orders ----------------------------");

        delObj = getExtendedParams(deleteParameters, 1, true);
        console.log("DELETE COMPLEX: Params", delObj);
        queryDB_regularExpression('customers', delObj, (result) => {
          if (result.length > 0) {
            console.log("Records found: " + result.length);
            customerIDArray = [];
            for (var i = 0; i < result.length; i++) {
              customerIDArray.push(result[i]._id);
            }
            deleteCustomerAndOrders(customerIDArray); // runs recursively until array if ids empty
          } else {
            console.log("No records found.");
          }
        });

      } else {
        logColour(YELLLOW, 'You need an even number of parameters.');
      }
    }
    // END: special cases 'delete fromcart' and 'delete address'

    // NOW NORMAL CASES: Delete from items, orders and customers :

    else {             // PRESUME _id if only one parameter is left
      if (deleteParameters.length == 2) {
        deleteParameters = [deleteParameters[0], '_id', deleteParameters[1]];
        console.log('_id field presumed.')
      }
      // ###############################  allow some flexibility :

      deleteParameters[0] = MaybeAdd_S(deleteParameters[0]);

      // the following function takes deletes from collection deleteParameters[0]
      // the rest of the parameters contain the field name and the value to match

      deleteFromCollection(deleteParameters);

      //    WE COULD USE THIS: (To fulfill the spec:)
      //    var parameters = deleteParameters.slice(1);

      //      deleteCustomer(parameters);
      //      deleteItem(parameters);
      // or:  deleteOrder(parameters);
    }
  }

} // END: function goDelete()

function shippingType(value) { // no complex validation required for shipping value

  if (isNaN(value) || value < 0 || value > 3) {
    return 0;
  } else {
    return parseInt(value);
  }

} // function shippingType()

function createAddressesFromParams(params, startParam) { // THIS IS AN IMPORTANT FUNCTION

  //  var paramsLeft = params.length;
  var paramsLeft = params.length - startParam;
  var newAddresses = [];
  var addressesToCreate = 0;

  if (paramsLeft == 5) { // allow some libery if addresstype left out and only one address added:
    paramsLeft++;
    params.push(1);       // 1 = shipping and billing
  }

  var addressesToCreate = paramsLeft / 6;

  console.log("------------------------PL: " + paramsLeft);
  if (paramsLeft % 6 !== 0) {
    logColour(YELLOW, "You need 5 parameters for the user and then 6 for every address.");
    console.log("--- Line1, Line2, Town, County, Eircode, Type (0-3).");
  } else if (addressesToCreate > 0) {
    console.log("Create " + addressesToCreate + " addresses");
    var pp = startParam;
    for (var i = 0; i < addressesToCreate; i++, pp += 6) {

      var currentAddress = {
        Line1: params[pp],
        Line2: params[pp + 1],
        Town: params[pp + 2],
        County: params[pp + 3],
        Eircode: params[pp + 4],
        type: shippingType(params[pp + 5])
      }
      newAddresses.push(currentAddress);
    }
  }
  return newAddresses;

} // END: function createAddressesFromParams()

function createCustomerRecordFromParams(params) {
  console.log("CREATE CUSTOMER RECORD: ");

  var newCustomer = null;

  var paramsLeft = params.length;

  if (paramsLeft > 5) {

    newCustomer = {
      Title: params[1],
      FirstNames: params[2],
      Surname: params[3],
      Mobile: params[4],
      Email: params[5]
    };

    // if there are 6 or a multiple of 6 params left, use these for addresses:

    var newAddresses = createAddressesFromParams(params, 6);

    if (newAddresses.length > 0) {
      newCustomer.address = newAddresses;
    } else {
      console.log("No address data added.");
    }



    console.log("CUSTOMER & ADDRESES TO CREATE: ", newCustomer);


  } // END: If there are sufficient parameters
  else {
    logColour(YELLOW, "You need at least 5 parameters for customer: Title FirstNames Surnames Mobile Email. Enclose strings with spaces in \"quotes\".")
  }

  // validate data ???????????????????????????????

  return newCustomer;

} // END: function createCustomerRecordFromParams()


function cleanUpShippingAndBillingFlags(addressPart) { // ensures that there is only 1 S&B, or 1 S & 1 B
  var flags = [false, false, false];
  var flagLeft = 1;
  var lastFlag = 0;
  if (addressPart.length < 1) {
    return addressPart;
  } else if (addressPart.length == 1) {
    addressPart[0].type = 1;
    return addressPart;
  } else {
    for (var i = addressPart.length - 1; i >= 0; i--) {
      if (flagLeft == 0) {
        addressPart[i].type = 0;
      } else {
        if ((addressPart[i].type == 1 && flagLeft != 1) || (addressPart[i].type == 2 && flagLeft == 3)
          || (addressPart[i].type == 3 && flagLeft == 2)
        ) {
          addressPart[i].type = flagLeft;
          flagLeft = 0;
        } else if (addressPart[i].type == 1) {
          flagLeft = 0;
        } else if (addressPart[i].type == 2) {
          flagLeft = 3;
          lastFlag = i;
        } else if (addressPart[i].type == 3) {
          flagLeft = 2;
          lastFlag = i;
        }
      }
    } // for loop
    if (flagLeft == 1) addressPart[addressPart.length - 1].type = 1; // set last address as S&B if none were set
    if (flagLeft > 1) addressPart[lastFlag].type = 1;
  }
  return addressPart;

} // END: function cleanUpShippingAndBillingFlags()

function appendAddresses(mongoDB_ID, addressData) { // addressData either a number (for random insertion or a number of addresses)

  // 1. get user

  queryDB_regularExpression('customers', { _id: mongoDB_ID }, (result) => {
    console.log("record to add address data to: ", result);

    // 2. Add random addresses:
    if (result.length > 0) {
      if (result[0].hasOwnProperty('address')) {
        var addressPart = result[0].address;
      } else {
        var addressPart = [];
      }

      // var newAddresses = createManyAddresses(addressData);
      //console.log("OLD ADDRESSES: ", result[0].address);

      if (isNaN(addressData)) {// if addressData is an object
        var addressesToAdd = addressData;
      } else {  // create random addresses
        var addressesToAdd = createManyAddresses(addressData, (addressPart.length < 1));
      }

      addressPart = [...addressPart,
      ...addressesToAdd]; //.push([...newAddresses]); adds type if none exist
      // 3. update user
      addressPart = cleanUpShippingAndBillingFlags(addressPart); // ensures that there is one S&B address or 1 S & 1 B
      console.log("record to update: ", addressPart);
      goUpdate('customers', { _id: mongoDB_ID }, { $set: { address: addressPart } }, (res) => {
        console.log(res.result.nModified + " customer" + ((res.result.nModified != 1) ? 's' : '') + " updated");
      });
    } else {
      console.log('This record was not found.');
    }

  });

}  // END: function appendAddresses();

function getDefaultAddress(address, shippingType) {
  if (address.length < 1) return -1;
  if (address.length == 1) return 0;

  for (var i = 0; i < address.length; i++) {
    if (address[i].type == shippingType)
      return i;
  } // for loop

  return 0; // the first address is the default if none other specified

} // END: function getDefaultAddress()

function getItemByID(productsForSale, targetID) {
  for (var i = 0; i < productsForSale.length; i++) {
    if (productsForSale[i]._id == targetID) {
      return productsForSale[i];
    }
  }
  return null;

} // END: function getItemByID()


function sendOrdersFromParams(customerID, params) {

  console.log("SEND ORDERS FROM PARAMS: ");

  var newOrder = null;

  var paramsLeft = params.length - 2;

  console.log("PL:", paramsLeft);
  if (paramsLeft < 6) {
    console.log("You need at least 6 parameters.")
    return null;
  }


  console.log("1. Getting product details...");
  getRecords('items', {}, (productsForSale) => {
    console.log("2. Getting this customer details... " + customerID);

    getRecords('customers', { _id: customerID }, (customers) => {
      if (customers.length > 0) {

        var thisCustomer = customers[0];

        // ######################################################################################

        // #1 

        var shippingNo = params[2];
        var billingNo = params[2];

        if (thisCustomer.address.length < 1) {

          logColour(YELLOW, 'This customer has no address!!! ');
          console.log('Cannot complete the purchase');
          logColour(COL_RESET, 'Please create an address for this customer. (ID: ' + thisCustomer._id) + ')';
          return;
        }

        //       Set the address according to the nunbers given



        if (isNaN(shippingNo) || shippingNo < 0 || shippingNo > thisCustomer.address.length) {
          shippingNo = getDefaultAddress(thisCustomer.address, 2);
        }
        if (isNaN(billingNo) || billingNo < 0 || billingNo > thisCustomer.address.length) {
          billingNo = getDefaultAddress(thisCustomer.address, 3);
        }
        if (shippingNo < 0 || shippingNo > thisCustomer.address.length) {
          shippingNo = 0;
        }
        if (billingNo < 0 || billingNo > thisCustomer.address.length) {
          billingNo = 0;
        }

        var shippingAddress = thisCustomer.address[shippingNo];
        var billingAddress = thisCustomer.address[billingNo];

        var discountAmt = params[5];

        // % DISCOUNT: MUST BE FROM 0 - 100:

        if (isNaN(discountAmt) || discountAmt < 0 || discountAmt > 100) {
          discountAmt = 0;
        }
        //        var date = new Date();
        newOrder = {
          orderDate: Date.now(),
          customer: {
            _id: thisCustomer._id,
            name: thisCustomer.Title + ' ' + thisCustomer.FirstNames + ' ' + thisCustomer.Surname,
            shippingAddress: shippingAddress,
            billingAddress: billingAddress
          },
          discount: { amount: discountAmt, desc: params[4] }
        };
        newOrder.shoppingCart = [];

        // add order from params...
        var curQty;
        for (var i = 6; i < params.length; i += 2) {
          curQty = parseInt(params[i + 1]);
          if (isNaN(curQty)) curQty = 0;
          console.log(params[i] + " - " + params[i + 1]);
          var curItem = getItemByID(productsForSale, params[i]);
          console.log("CUR ITEM: ######### ", curItem);
          if (curItem != null) {
            var curProduct = {
              product: {
                _id: curItem._id,
                Manufacturer: curItem.Manufacturer,
                Model: curItem.Model,
                Price: curItem.Price
              }, quantity: curQty
            }
            newOrder.shoppingCart.push(curProduct);
          }
        }
        insertSingle2_withCB(MONGO_URI, DB_NAME, "orders", newOrder, () => {
          console.log("Order added");
        });


        // ######################################################################################


      } else {
        console.log("Customer with ID " + customerID + " not found.")
      }


    }); // customers callback
  });

} // function sendOrdersFromParams()



function getMongoDB_ID(param) {
  // check param to see if it is a valid id

  if (!mongodb.ObjectID.isValid(param)) { // check to see if ID is a valid hex string
    return -1;
  } else { // params[1] = valid ID
    return new mongodb.ObjectID(param);
  }

} // END: function getMongoDB_ID()

function showAddressType(addressType) {

  if (addressType == 1) return 'Shipping & Billing';
  else if (addressType == 2) return 'Shipping ';
  else if (addressType == 3) return 'Billing';
  else return '';

} // END: function showAddressType()

function showItems(productData) {

  console.log('\x1b[44m\x1b[33m', "Show - Products : " + productData.length + " records:", '\x1b[40m\x1b[37m');
  console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");

  //  console.log(productData);
  productData.forEach((product, i) => {
    console.log('\x1b[37m', (i + 1) + '. ' + product.Manufacturer + ' \t' +
      product.Model + ' \t€' + product.Price);
  });

  console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");

} // END: function showItems()

function showAddresses(AddressData) {
  var sat;
  if (typeof AddressData !== "undefined") {
    AddressData.forEach(ad => {
      sat = showAddressType(ad.type);
      if (sat != '') sat = '(' + sat + ')';
      console.log('\x1b[37m', '\t -- ' + ad.Line1 + (ad.Line1.length > 0 ? ', ' : '') +
        ad.Line2 + (ad.Line2.length > 0 ? ', ' : '') +
        ad.Town + (ad.Town.length > 0 ? ', ' : '') +
        ad.County + ' ' + ad.Eircode + '\t ' + sat);
    });
  }

} // END: function showCustomers()

function showCart(cartData) {
  var sat;
  //  console.log("-------------------------------");
  //  console.log(cartData);
  //  console.log("-------------------------------");
  var totalCost = 0;
  cartData.forEach(order => {
    console.log('\x1b[32m', order.quantity + ' x ' + order.product.Manufacturer + ' ' + order.product.Model +
      ' €' + order.product.Price + ' (' + order.product._id + ') ');
    totalCost += order.product.Price;
  });
  //  console.log("-------------------------------");
  return totalCost;

} // END: function showCart()

function showCustomers(customerData) {

  console.log('\x1b[44m\x1b[33m', "Show - Default : customers : " + customerData.length + " records:", '\x1b[40m\x1b[37m');
  console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");
  customerData.forEach(cd => {
    console.log('\x1b[33m', cd._id + '\t ' + cd.Title + ' ' + cd.FirstNames + ' ' + cd.Surname + '\t '
      + cd.Mobile + '\t ' + cd.Email);
    showAddresses(cd.address);
  });
  console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");

} // END: function showCustomers()


function showOrders(ordersData) {

  console.log('\x1b[44m\x1b[33m', "Show - Orders : " + ordersData.length + " records:", '\x1b[40m\x1b[37m');
  console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");
  ordersData.forEach((order, i) => {
    var date = new Date(order.orderDate);
    console.log('\x1b[33m', (i + 1) + '. ' + order._id + ' ' + date.toLocaleString() + '\t ' + order.customer.name + ' (' + order.customer._id + ') ');
    console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");
    showAddresses([order.customer.shippingAddress]);
    showAddresses([order.customer.billingAddress]);
    console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");

    var totalPrice = showCart(order.shoppingCart);
    var discount = 0;
    if (totalPrice > 0) {
      if (order.discount.amount > 0) {
        discount = Math.round(parseFloat(totalPrice / 100 * order.discount.amount) * 100) / 100;
        console.log('\x1b[40m\x1b[31m', 'Discount: ' + order.discount.desc);
        console.log('\x1b[37m', 'Total Price: €' + totalPrice);
        console.log('\x1b[37m', 'Minus Discount (' + order.discount.amount + '%) : €' + discount);
      }
      var netPrice = Math.round((totalPrice - discount) * 100) / 100;
      console.log('\x1b[33m', 'Price to Pay: €' + netPrice);
    }

    console.log('\x1b[40m\x1b[37m', "================================================================");
  });

} // END: function showOrders()

function printNice(collectionName, result) {

  if (collectionName == 'customers') {
    showCustomers(result);
  } else if (collectionName == 'orders') {
    showOrders(result);
  } else if (collectionName == 'items') {
    showItems(result);
  } else {
    console.log("Show - Default : " + collectionName + " " + result.length + " records:");
    console.log("----------------------------------");
    console.log(result);
    console.log("----------------------------------");
    //      console.log(result);
  }


  // ####################################



} // END: function printNice()


function findWhere(params) {
  for (var i = 1; i < params.length; i++) { // can't be first param
    if (params[i].toLowerCase() == 'where') return i;
  }
  return -1;

} // function findWhere()

function logColour(colour, txt) {
  console.log(colour, txt, '\x1b[40m\x1b[37m');
}

// Allow some flexibility on the console : 

function MaybeAdd_S(collectionName) {
  if (collectionName == 'customer'
    || collectionName == 'item'
    || collectionName == 'order')
    return collectionName + 's';
  else return collectionName;
}

function retrieveCollection(mainParam, params) {

  if (params.length < 2) { // SPECIAL CASES FOR BOTH SHOW AND QUERY:

    if (mainParam == 'show') {
      // if no param given - show all the tables...

      if (params.length < 1) {

        console.log('\x1b[41m\x1b[37m', "Showing all the tables...", '\x1b[40m\x1b[37m');
        findAll('items', (result) => {
          printNice('items', result);
          findAll('customers', (result) => {
            printNice('customers', result);
            findAll('orders', (result) => {
              printNice('orders', result);
              console.log('\x1b[40m\x1b[37m', "---------------------------------------------------------------");
            });
          });
        });

      } else {
        var collectionName = params[0];
        collectionName = MaybeAdd_S(collectionName);

        console.log('\x1b[41m\x1b[37m', "Showing all records for collection '" + collectionName + "'...", '\x1b[40m\x1b[37m');
        findAll(collectionName, (result) => printNice(collectionName, result));

      }




    } else { // ############# QUERY (PARAMS < 2)
      console.log(params);
      logColour(YELLOW, "You should have at least 3 parameters [collection name] [field name] [regular expression]");
      console.log('If only 2 parameters are given then id is assumed for the field. Eg: query customer 6087b8e1e51a090ed436dd90');

    }

    // ##########################    MORE THAN ONE PARAMETER

  } else {


    if (params.length < 3) {
      // assumes that the only remaining param is for the ID field

      params.splice(1, 0, "_id");
      console.log("PA", params);
    }

    // You can make complex searches such as: query orders shoppingCart.product.Manufacturer Nokia

    var queryObj = getExtendedParams(params, 1, true);
    var collectionName = params[0];
    collectionName = MaybeAdd_S(collectionName);

    console.log('Query Parameters: ', queryObj);

    queryDB_regularExpression(collectionName, queryObj, (result) => {
      printNice(collectionName, result);
    });


  } // END: QUERY


} // END: function retrieveCollection()

function logCreate() {
  console.log("1. " + YELLOW + " 'create customer' " + COL_RESET + " - creates a random customer.");
  console.log("2. " + YELLOW + "'create customer " + COL_RESET + " Title FirstNames SurName Mobile Email '.");
  console.log(' ---- ' + COL_CYAN + ' EG: create customer Mr Bob Doe "086 123 4567" bob@doe.com "1 Some Street" "Some Road" NiceTown "County Lovely" "ABC 123 " ' + COL_RESET + ' ');
  console.log("3. " + YELLOW + "'create address " + COL_RESET + " CustomerID - creates a random customer address and adds it to this customer record.");
  console.log("4. " + YELLOW + "'create address " + COL_RESET + " CustomerID Line1 Line2 Town County Eircode AddressType (1=Shipping & Billing, 2=Shipping, 3=Billing, 0= unspecified.");
  console.log(' ---- EG: create address 6087f57e27bf03353461c636 Line1 Line2 Town County Eircode 0');
  console.log("--- Set to 1 if no other shipping or billing address exists. Other addresses updated automatically.");
  console.log("5. " + YELLOW + "'create orders " + COL_RESET + " - with these parameters a random order will be created");
  console.log("5a. 'create orders n - with these parameters a random order will be created for a random customer");
  console.log("5b. 'create orders CustomerID - with these parameters 1 random order will be created for [ID]");
  console.log("5c. 'create orders CustomerID n - with these parameters [n] random orders will be created");
  console.log("5d. 'create orders CustomerID ItemID Quantity, ItemID2,Quantity... etc...");
  console.log('create orders 6087e894f32142213831240e 10 3 "Small discount" 30 6087e643f32142213831240c 14');
  console.log("6. " + YELLOW + "'create item " + COL_RESET + " Manufacturer Model Price' ");
  console.log(" -- eg: create item CBLTD myPHONE 403");
}


function createOrders(params) {


  // EG: create orders 6079b3235e7b9b0c68a0f522 0 0 'none' 0 6079b3235e7b9b0c68a0f51c 2 6079b3235e7b9b0c68a0f51d 4

  if (params.length > 1) {
    // check params[1] to see if it is a valid id
    //            console.log("PPPPP!: '" + params[1] + "'");
    var mongoDB_ID = getMongoDB_ID(params[1]);
    //            console.log("PPPPP!: '" + mongoDB_ID + "'");
    if (mongoDB_ID == -1) {
      if (params.length > 2) {
        console.log("Please enter a valid customer ID. This must be a single String of 24 hex characters");
      }
    }
    // params[1] = valid ID
  } else {
    console.log('Creating random orders. (use parameters to specify orders)')
    var mongoDB_ID = -2; // create random purchases to random customers
  }

  // 2 params - create 1 order for random ids
  // 3 create n orders "
  // 4 [ID] n - create n orders for ID

  // MORE = actual orders...

  // ##########################################################################
  //    NEED TO CREATE : PURCHASE (ACTUAL), ADDRESS (RANDOM + ACTUAL)
  // ##########################################################################        

  if (params.length < 4) { // if 3, [1] = id
    if (params.length == 3) {
      params.splice(1, 1);
    } else if (params.length == 2 && mongoDB_ID != -1 && mongoDB_ID != -2) {

      params.splice(1, 1);
      params.push(1);
    }

    var howMany = 0;
    if (params.length == 1) {
      howMany = 1;
    } else {
      if (isNaN(params[1]) || params[1] < 1 || params[1] > 100) {
        logColour(YELLOW, "Parameter 2 must be a number from 1-100; How many random purchases do you want created?");
        return;
      } else {
        howMany = params[1];
      }
    }

    // create random

    if (howMany > 0) {
      if (mongoDB_ID != -1 && mongoDB_ID != -2) {
        goCreateRandomPurchases_forCustomer(mongoDB_ID, howMany, () => {
          console.log(howMany + " random purchases created for ID " + mongoDB_ID + ".");
        });

      } else {
        goCreateRandomPurchases(howMany, () => {
          console.log(howMany + " random purchases created.");
        });

      }


    }



  } else if (params.length < 8) {
    logColour(YELLOW, "You need 7 parameters minimum: (Use \"quotes\" for params with spaces). ")
    console.log("create orders CUSTOMERID SHIPPING# BILLING# DISCOUNTTXT DISCOUNT [ PRODUCTID, QTY,... ] etc");
  } else {
    //          console.log("################ " + mongoDB_ID);
    if (mongoDB_ID != -1 && mongoDB_ID != -2) {
      if (params.length % 2 != 0) {

        logColour(YELLOW, 'You need an even number of parameters: ');

        console.log("create order CUSTOMERID SHIPPING# BILLING# DISCOUNTTXT DISCOUNT [ PRODUCTID, QTY,... ] etc");
      } else {
        console.log("CREATE ORDER:");

        // get customer details:
        sendOrdersFromParams(mongoDB_ID, params);

      }

    }

  }

  // ##########################################################################        


} //END: function createOrders()


// -------------------------------------
// GLOBAL CODE:
// -----------------------------------------------------------------------

var params = [...process.argv].slice(3);
//console.log("PARAMS: " + params);

if (process.argv.length > 2) {
  var mainParam = process.argv[2].toLowerCase();

  if (mainParam == 'server') {
    if (params.length < 1) runServer(DEFAULT_SERVER); // default server port
    else runServer(params[0]);
  } else if (mainParam == 'start') {
    console.log("Filling DB with random data" + params.length);
    if (params.length == 3) {
      console.log('Creating data: ' + params[0] + ' customers; ' + params[1] + ' purchases; ' + params[2] + ' items...');
      dropDBAndFillData(params[0], params[1], params[2]);
    } else {
      // customers, purchases, items
      dropDBAndFillData(30, 30, 30);
    }
  }

  // ==================================================
  //     DELETE [collection name ] [parameters]



  // ==================================================



  else if (mainParam == 'create') {
    if (params.length < 1) {
      logColour(COL_CYAN, "You need at least 2 parameters [collection name customers, address, items or orders].");
      logCreate();
    } else {
      var param2 = params[0].toLowerCase(); //getSafeParam(1).toLowerCase();
      if (param2 == 'item') {
        if (params.length < 3) {
          var howMany = 0;
          if (params.length == 1) {
            howMany = 1;
          } else {
            if (isNaN(params[1]) || params[1] < 1 || params[1] > 100) {
              console.log("Parameter 2 must be a number from 1-100; How many random items do you want created?");
            } else {
              howMany = params[1];
            }
          }
          var newItem;
          for (var i = 0; i < howMany; i++) {
            newItem = getRandomProduct();
            console.log(i + ". ADDING random item to Store: ", newItem);
            insertOne('items', newItem, (record) => {
              console.log("Inserted Random Item (ID): " + record._id);
            });
          }
        } else if (params.length != 4) {
          logColour(YELLOW, "You need 5 parameters: ['create item Manufacturer Model Price']. (Use \"quotes\" for params with spaces). ");
        } else {
          logColour("\x1b[36m", "CREATE ITEM:");
          var newItem = { Manufacturer: params[1], Model: params[2], Price: params[3] };
          if (newItem.Manufacturer.length < 1) {
            logColour(YELLOW, "Item Manufacturer cannot be blank");
          } else if (newItem.Model.length < 1) {
            logColour(YELLOW, "Item Model cannot be blank");
          } else if (isNaN(newItem.Price) || newItem.Price <= 0 || newItem.Price > 10000) {
            logColour(YELLOW, "Item Price must be a number > 0 < 10000");
          } else {
            newItem.Price = Math.round(newItem.Price * 100) / 100; // make sure there are only 2 digits.
            console.log("ADDING Item to Store: ", newItem);
            insertOne('items', newItem, (record) => {
              console.log("Inserted Item (ID): " + record._id);
            });
          }
        }

        // ####################################### CREATE CUSTOMER ###########################################

      } else if (param2 == 'customer' || param2 == 'customers') {

        if (param2 == 'customer') { // allow some flexibility
          param2 = 'customers';
          params[0] = 'customers';
        }

        if (params.length < 3) {
          var howMany = 0;
          if (params.length == 1) {
            howMany = 1;
          } else {
            if (isNaN(params[1]) || params[1] < 1 || params[1] > 100) {
              logColour(YELLOW, "Parameter 2 must be a number from 1-100; How many random customers do you want created?");
              return;
            } else {
              howMany = params[1];
            }
          }
          createCustomers(howMany, () => {
            console.log(howMany + " random customers created.");
          });

        } else {

          // ####################################### CREATE CUSTOMER ###########################################

          // Title FirstNames Surname Mobile Email  [5]
          //  Line1, Line2, Town, County, Eircode, type [6] = total 11
          //  Line1, Line2, Town, County, Eircode, type [6] = total 17

          // ####################################### CREATE CUSTOMER ###########################################


          console.log("CREATE customer:");

          var newCustomer = createCustomerRecordFromParams(params);

          if (newCustomer !== null) {

            console.log("ADDING Customer Record: ", newCustomer.FirstNames + ' ' + newCustomer.Surname);
            insertOne('customers', newCustomer, (record) => {
              console.log("Inserted Customer: ", record);
            });

          }



        } // if there are 3 or more params

      } else if (param2 == 'orders' || param2 == 'order') {

        createOrders(params);

      } // END: create orders    
      else if (param2 == 'address') {

        // EG: create address 6079412e0565890e9c092623 - creates one random address
        // EG: create address 6079412e0565890e9c092623 2 - creates two random address

        // EG: create address 6079412e0565890e9c092623 "7 College Green" "" Drogheda "Co Louth" "ABC 123"
        console.log("Params:", params);
        if (params.length < 2) {
          console.log("you need at least one parameter 'create address [customerID]");

        } else {

          // check params[1] to see if it is a valid id
          var mongoDB_ID = getMongoDB_ID(params[1]);
          if (mongoDB_ID == -1) {
            console.log("Please enter a valid customer ID. This must be a single String of 24 hex characters");
          } else { // params[1] = valid ID

            if (params.length < 4) {
              var howMany = 0;
              if (params.length == 2) {
                howMany = 1;
              } else {
                if (isNaN(params[2]) || params[2] < 1 || params[2] > 5) {
                  console.log("Parameter 2 must be a number from 1-5; How many random addresses do you want created?");
                } else {
                  howMany = parseInt(params[2]);
                }
              }

              if (howMany > 0) {

                console.log("Create " + howMany + " random address" + ((howMany != 1) ? 'es' : '') + " for ID: " + mongoDB_ID + "...");
                // mongoDB_ID
                // params[2 on ->> rest of data]

                appendAddresses(mongoDB_ID, howMany);

              }

              //          createCustomers(howMany, () => {
              //              console.log(howMany + " random customers created.");
              //          });

            } else {

              // ####################################### CREATE ADDRESS FOR CUSTOMER #################################

              //  CUSTOMER_ID Line1, Line2, Town, County, Eircode, type [6] = total ( 6 * 1 ) + 1 = 7
              //  CUSTOMER_ID Line1, Line2, Town, County, Eircode, type [6] = total ( 6 * 2 ) + 1 = 13

              // ####################################### CREATE ADDRESS FOR CUSTOMER #################################


              console.log("ADD ADDRESSES TO customer:" + mongoDB_ID);

              var newAddresses = createAddressesFromParams(params, 2);
              console.log("NEW ADDRESS: ", newAddresses);
              if (newAddresses.length > 0) {
                //          newCustomer.address = newAddresses;
                appendAddresses(mongoDB_ID, newAddresses);
              } else {
                console.log("No address data added.");
              }

              //          var newCustomer = createCustomerRecordFromParams(params);

              if (newAddresses !== null) {

                //          appendAddresses(mongoDB_ID, {});

                //            console.log("ADDING Customer Record: ", newCustomer.FirstNames + ' ' + newCustomer.Surname);
                //            insertOne('customers', newCustomer, (record) => {
                //              console.log("Inserted Customer: ", record );
                //            }); 

              }

            } // if there are 3 or more params
          } // if param[1] is a valid customerID
        } // has enough parameters       
      } // END: Create address
      else if (param2 == 'cartitem') {

        // EG: create cartitem 6079b3235e7b9b0c68a0f524 6079b3235e7b9b0c68a0f516

        console.log("Add item to cart..."); // Normally this would be done on front end.
        console.log("create cartitem [orderID] [ItemID] [QTY]");
        console.log("Params", params);
        if (params.length < 3 || params.length > 4) {
          console.log("You need at least 3 parameters: ");
          console.log("EG: create cartitem [orderID] [ItemID] {QTY - set to 1 if not specified.} ");
        } else {

          // STEP 1: get the quantity:

          if (params.length == 3) {
            var addQuantity = 1;
          } else {
            var addQuantity = parseInt(params[3]);
            if (isNaN(params[3]) || params[3] < 1 || params[3] > MAX_QTY_ITEM_ADD) { // RESTRICTION MAX Quantity to add
              addQuantity = 0;
            }
          }
          console.log("Quantity: ", addQuantity);

          // Step 2: query for the Customer and Item

          var orderID = getMongoDB_ID(params[1]);
          var itemID = getMongoDB_ID(params[2]);
          if (orderID == -1) {
            console.log("Please enter a valid orderID. This must be a single String of 24 hex characters");
          } else if (itemID == -1) {
            console.log("Please enter a valid itemID. This must be a single String of 24 hex characters");
          } else {

            console.log("1. Getting product details..." + itemID);
            getRecords('items', { _id: itemID }, (productsForSale) => {
              if (productsForSale.length < 1) {
                console.log("Product not found. ID: " + itemID);
              } else {
                console.log("2. Getting this order details... " + orderID);
                getRecords('orders', { _id: orderID }, (orders) => {
                  if (orders.length < 1) {
                    console.log("Order not found. ID: " + orderID);
                  } else {
                    // BOTH ITEMS FOUND, now add this to the order:

                    var orderToAddTo = orders[0];
                    var itemToAdd = { product: productsForSale[0], quantity: addQuantity };
                    //console.log("ORDER: ", orderToAddTo);
                    // look in shopping cart if already there, add quantity to it

                    var isAlreadyInBasket = -1;
                    if (!orderToAddTo.hasOwnProperty('shoppingCart')) {
                      orderToAddTo['shoppingCart'] = [];
                    }
                    for (i = 0; i < orderToAddTo.shoppingCart.length; i++) {
                      if (orderToAddTo.shoppingCart[i].product._id == params[2]) { // need to use params[2] here, same type
                        isAlreadyInBasket = i;
                        break;
                      }
                    }

                    console.log('isAlreadyInBasket', isAlreadyInBasket);
                    if (isAlreadyInBasket > -1) {

                      // add to the quantity:
                      orderToAddTo.shoppingCart[isAlreadyInBasket].quantity += addQuantity;

                    } else {

                      // otherwise append this product to the shopping cart
                      orderToAddTo.shoppingCart.push(itemToAdd);

                    }
                    //console.log(orderToAddTo);
                    // STEP 3: Update this order 

                    //console.log("orderToAddTo Object: " , orderToAddTo);
                    goUpdate('orders', { _id: orderID }, { $set: orderToAddTo }, (result) => {
                      console.log("Records updated: " + result.result.nModified);
                    });

                  }
                });
              }
            });


          } // END: both IDs valid




        } // CREATE CARTTIEM - ENOUGH PARAMS
      } // END: create cartitem

    } // END: at least one sub parameter after create

  } else if (mainParam == 'delete') {
    goDelete(params);
  } else if (mainParam == 'show' || mainParam == 'query') {
    retrieveCollection(mainParam, params);
  }

  // ##############################################################



  // ##############################################################

  else if (mainParam == 'update') {

    // the same function does for all three collections: 

    goUpdateCollection(params);


    // ##########################################################################################



  } // END: UPDATE

} // END: if at least 1 parameter

else {
  console.log('\x1b[44m\x1b[33m', "Welcome to Assignment 06.", '\x1b[40m\x1b[37m');
  console.log('\x1b[40m\x1b[37m', "------------------------------------------");
  console.log("parameter: " + YELLOW + "'start' " + COL_RESET + " - initialises database and fills it with random sample data. " + COL_RED + " Warning: this will drop the database." + COL_RESET);
  console.log(" -- optional parameters (3): # of customers, purchases, items; default = 30 each.");
  console.log("parameter: " + YELLOW + " 'server' " + COL_GREEN + "- starts the server on port " + DEFAULT_SERVER + "." + COL_RESET + " ");
  console.log(" -- optional parameter: (1) server port, e.g. 8080 ");
  console.log("-------------------------------------------------------------------------");
  console.log(YELLOW + " 'The following are left from Assignment 5 - to aid testing' " + COL_RESET );
  console.log(YELLOW + " 'create customer' " + COL_RESET + " - creates a random customer.");
  console.log(YELLOW + "'create customer " + COL_RESET + " Title FirstNames SurName Mobile Email '.");
  console.log(' ---- ' + COL_CYAN + ' EG: create customer Mr Bob Doe "086 123 4567" bob@doe.com "1 Some Street" "Some Road" NiceTown "County Lovely" "ABC 123 " ' + COL_RESET + ' ');
  console.log(YELLOW + "'create address " + COL_RESET + " CustomerID - creates a random customer address and adds it to this customer record.");
  console.log(' ---- EG: create address 6087f57e27bf03353461c636 Line1 Line2 Town County Eircode 0');
  console.log(YELLOW + "'create orders " + COL_RESET + " - with these parameters a random order will be created");
  console.log(YELLOW + "'create item " + COL_RESET + " Manufacturer Model Price' ");
  console.log(" -- eg: create item CBLTD myPHONE 403");
  console.log("parameter: " + YELLOW + " 'show' or 'query' " + COL_RESET + "[collection name - 'customers = default']");
  console.log("parameter: " + YELLOW + " 'show' " + COL_RESET + "[collection name] [Field Name] [\"Reg Ex\"] EG: query FieldNames \"^P\"");
  console.log('You can use WHERE and dots: e.g.: ' + COL_GREEN + 'update orders customer.name "Mrs Mary McDonald" ' + YELLOW + 'WHERE ' + COL_GREEN + 'customer.name "Miss Mary Murphy" ');

  console.log("parameter: " + YELLOW + " 'delete' " + COL_RESET + "[collection name] [ID] EG: delete customers 60772f5208920c0dfcefb9ca ");
  console.log("parameter: " + YELLOW + " 'delete fromcart' " + COL_RESET + "[orderID] [nth item from cart] EG: delete fromcart 60772f5308920c0dfcefb9d0 4 ");
  console.log("parameter: " + YELLOW + " 'delete address' " + COL_RESET + "[customerID] [nth address] EG: delete address 60772f5208920c0dfcefb9ca 2 ");
  console.log("--- updates shipping and billing settings automatically.");
  logColour(COL_CYAN, 'YOU CAN DUMP THE DATABASE FROM THE FRONT-END.')
  console.log('========================================================');

}

/* #################################################################################

  A BRIEF DESCRIPTION OF DATABASE DESIGN:

  In line with NOSQL comon practice I denormalised the data as much as possible. This
  reduces the database reads, and so, the potential cost, if this was a commercial solution.

  Product details are kept in a lightweight table :

              items = { _id , Manufacturer, Model, Price }, { _id, Manufacturer, ... }


  Customers are separated from purchases but all the relevent customer data is in the
  purchases collection.

        customers =

              {_id , Title, FirstNames, Surname, Mobile, Email, address:
                    [ { Line1, Line2, Town, County, Eircode, type },
                      { Line1, Line2, Town, County, Eircode, type }
                    ]
              } ,
            {_id , Title, FirstNames, Surname ...



  If I am filling orders I can get all the information I want without having to go to the customers, or items, collection:
  Deleting either a customer or an item should not effect the order record, as this most-likely will be needed
  as an enduring record.

        orders =

              {_id, orderDate, customer:
                                {_id, name , shippingAddress: { Line1, Line2 ... }, billingAddress: { ... } },
                                shoppingCart:
                                [ {product { _id , Manufacturer , Model , Price },  quantity }, { [product... ]}...]
              }

  I think that this structre provides for a good balance,
  giving sufficiently organised data and avoiding excessive database reads.





  ################################################################################# */