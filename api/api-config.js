//* Packages : Authentication
const { v4: uuidv4, v1: uuidv1 } = require('uuid');
const bcrypt = require('bcryptjs');
//* Packages : Files
const fs = require('fs');

//* Session storage
let authUsers = {};

//* File / data handler
class handler {
  constructor(fileToWriteTo) {
    this.data = [];
    this.fileUrl = fileToWriteTo;
    this.invites = new inviteHandler('./api/data/invites.json');

    this.read();
  }
  read() {
    const data = JSON.parse(fs.readFileSync(this.fileUrl))
    this.data = data
    return data
  }
  write() {
    fs.writeFileSync(this.fileUrl, JSON.stringify(this.data, null, 4), err => {
      if (err) { console.log("ERROR:", err); }
    });
    return this.data
  }
  /**
  * Gets the user data
  * @param {Object} options Options for searching the user data
  * @param {boolean} removePrivInfo Keeps or deletes the private info of a user
  * @param {string} options.method The method to search with (email, name, id)
  * @param {string} options.email The email to search for
  * @param {string} options.name The name to search for
  * @param {string} options.id The id to search for
  */
  getUserData(options) {
    if (options.method === "id") {
      return this.data.find(element => element.id == options.id)
    }
    if (options.method === "email") {
      return this.data.find(element => element.email == options.email)
    }
    if (options.method === "name") {
      return removePrivateInfo(this.data.find(element => element.name == options.name))
    }
  }
  updateTeamData(id, newData) {
    const index = this.data.findIndex(value => value.id == id);
    for (const [key, value] of Object.entries(newData)) {
      this.data[index][key] = value;
    }
    this.write();
    return this.data[index];
  }
  userJoinEvent(user_id, team_id) {
    const index = this.data.findIndex(value => value.id == team_id);
    try {
      if(this.data[index].member_ids.includes(user_id)){ return true; }
      this.data[index].member_ids.push(user_id);
      this.write();
    } catch(err) {
      console.log('ERROR:', err)
      return null;
    }
    return true;
  }
}

class inviteHandler {
  constructor(fileToWriteTo){
    this.data = [];
    this.fileUrl = fileToWriteTo;

    this.read();
  }
  read() {
    const data = JSON.parse(fs.readFileSync(this.fileUrl));
    this.data = data;
    return data;
  }
  write() {
    fs.writeFileSync(this.fileUrl, JSON.stringify(this.data, null, 4), err => {
      if (err) { console.log("ERROR:", err); }
    });
    return this.data;
  }
  createInvite(team_id, author_id) {
    const inviteData = {
      id: generateId('invite'),
      team_id: team_id,
      author_id: author_id
    }
    this.data.push(inviteData);
    this.write();
    return inviteData;
  }
  validateInvite(id) {
    const invite = this.data.find(item => item.id == id);
    if(!invite){ return null; }
    return invite;
  }
}

function generateId(type) {
  const base_id = uuidv4();
  let added_id = "";
  if(type == 'invite'){ added_id = "-inv"; }
  else if(type == 'team'){ added_id = "-team"; }
  else if(type == 'user'){ added_id = "-user"; }
  return (base_id + added_id);
}

//* Removes private info
function removePrivateInfo(obj) {
  try { delete obj['id']; } catch{ }
  try { delete obj['password']; } catch { }
  return obj;
}

//* Checks authentication and session management
function requiresAuth(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  let lastPage = req.url
  if(req.url == '/'){ lastPage = '/dashboard' }
  authUsers[require('../server').requestIp.getClientIp(req)] = lastPage;
  res.redirect('/login');
}
function requiresNonAuth(req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/'); }
  next();
}
function clearSession(userId) {
  try { delete authUsers[userId]; }
  catch {};
}
//* Generating data
async function generateUserData(req, res, callback) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const id = generateId('user');
    const user = {
      id: id,
      password: hashedPassword,
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      picture: `https://dummyimage.com/600x600/000/fff&text=${req.body.name.substring(0, 3)}`,
      bio: "",
      team_id: "",
    };
    return callback(user);
  } catch (err) {
    console.log("ERROR:", err);
    return callback(null);
  }
}

function generateTeam(author, name) {
  const team = {
    "id": generateId('team'),
    "name": name,
    "member_ids": [author.id],
    "todo_lists": [
      
    ],
    "activity": [

    ],
    "projects": [

    ]
  }
  const teamHandler = require('../server').teamHandler;
  teamHandler.data.push(team)
  teamHandler.write()
  return team;
}

module.exports = { handler, requiresAuth, requiresNonAuth, generateUserData, bcrypt, generateTeam, clearSession, authUsers, generateId }