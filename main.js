const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
//For Youtube Search
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
var TOKEN_DIR = __dirname + '\\.credentials\\';
var TOKEN_PATH = TOKEN_DIR + 'google-apis-nodejs-quickstart.json';

var searchHistory = []; //store all search results

const {app, BrowserWindow, Menu, ipcMain} = electron;

//Set environment
//process.env.NODE_ENV = 'production';

let mainWindow;
let addWindow;

// Listen for app to be readyState
app.on('ready', function(){
    //Create new window
    mainWindow = new BrowserWindow({resizable: true});
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'searchVideo.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });
    
    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);

});

//Handle create add window
function createAddWindow(){
    //Create new window
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title:'Add Shopping List Item'
    });
    // Load html into window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Garbage collection handle
    addWindow.on('close', function(){
        addWindow = null;
    });
};


//Catch item:add
ipcMain.on('item:add', function(e, item){
    console.log(item);
    mainWindow.webContents.send('item:add', item);
    addWindow.close();
});

//Catch item:write
ipcMain.on('item:write', function(e, item1, item2){
    console.log(item1+" "+item2);
    myWriteFile(item1, item2);
    //mainWindow.webContents.send('item:write', item);
});

//Send List of Previously Searched Items
ipcMain.on('youtube:searchHistory', function(e){
    console.log(searchHistory);
    mainWindow.webContents.send('youtube:searchHistory', searchHistory);
});

//Catch youtube:search
ipcMain.on('youtube:search', function(e, videoName){
    console.log("*********************************************");
    console.log("Searching for: "+videoName);
    searchHistory.push(videoName);
    //mainWindow.webContents.send('item:write', item);

    // Load client secrets from a local file.
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the YouTube API.
      //See full code sample for authorize() function code.
    authorize(JSON.parse(content), {'params': {'maxResults': '12',
                     'part': 'snippet',
                     'q': videoName,
                     'type': ''}}, searchListByKeyword);

    //mainWindow.webContents.send('item:add', item) is embedded in the searchListByKeyword() function

    });
});



function myWriteFile(fileName, data){
    var filePath = path.join(__dirname, '/text_files/'+fileName);

    try{
        fs.writeFile(filePath, data, function(err){
            console.log("Wrote to file "+fileName)
        });
    }catch(err){
        return console.log(err);
    }
    
};

// Create menu template
const mainMenuTemplate = [
    {
        label:'File',
        submenu:[ //array of objects
            {
                label: 'Add Item',
                accelerator: process.platform == 'darwin' ? 'Command+Shift+A' : 'Ctrl+Shift+A',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Clear Item',
                click(){
                    mainWindow.webContents.send('item:clear');
                }
            },

            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q', 

                click(){
                    app.quit();
                }
            }

        ]
    }
];

//If mac, add empty object to menu
//fixed menu issues at tool
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({}); //array method shifts on at beginning
}

//Add developer tools item if not in prod
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I', 
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });
}

//Functions to help with Youtube Search Functionality
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, requestData, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, requestData, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, requestData);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, requestData, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, requestData);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Remove parameters that do not have values.
 *
 * @param {Object} params A list of key-value pairs representing request
 *                        parameters and their values.
 * @return {Object} The params object minus parameters with no values set.
 */
function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}

/**
 * Create a JSON object, representing an API resource, from a list of
 * properties and their values.
 *
 * @param {Object} properties A list of key-value pairs representing resource
 *                            properties and their values.
 * @return {Object} A JSON object. The function nests properties based on
 *                  periods (.) in property names.
 */
function createResource(properties) {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value) {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    // Leave properties that don't have values out of inserted resource.
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    };
  }
  return resource;
}


function searchListByKeyword(auth, requestData) {
  var my_obj = {};
  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(requestData['params']);
  parameters['auth'] = auth;
  service.search.list(parameters, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    my_obj = response;
    console.log(my_obj.items);
    console.log("Sending Object now");
    mainWindow.webContents.send('youtube:search', response); //send the JSON object to be parsed at the other end
    console.log("Sent");
    console.log("*****************************************");
  });
}