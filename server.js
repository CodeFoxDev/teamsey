//* Packages : Server
const express = require('express');
const app = express();
const requestIp = require('request-ip');
const domain = "http://localhost:8080/"; //* Must contain slash at the end!
//* Packages : Auth
const passport = require('passport');
const session = require('express-session');
const methodOverride = require('method-override');
const { initializeLocal } = require('./api/passport-config');
const api = require('./api/api-config');
//* Initialization
initializeLocal(
  passport,
  async (email) => apiHandler.getUserData({
    method: "email",
    email: email
  }),
  async (id) => apiHandler.getUserData({
    method: "id",
    id: id
  })
);
//* Global variables

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "lax"
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

//* Static files
app.use("/static", express.static("static"));

app.get('/', (req, res) => {
  res.render('index.ejs', { user: req.user ?? null });
});

app.get('/dashboard', api.requiresAuth, (req, res) => {
  let teamData = teamHandler.data.find(data => data.member_ids.includes(req.user.id))
  res.render('dashboard/dashboard.ejs', { user: req.user , teamData: teamData});
});

app.get('/dashboard/settings', api.requiresAuth, (req, res) => {
  let teamData = teamHandler.data.find(data => data.member_ids.includes(req.user.id));
  teamData.members = [];
  teamData.member_ids.forEach(id => {
    teamData.members.push(apiHandler.getUserData({ method: "id", id: id }));
  });
  res.render('dashboard/settings.ejs', { user: req.user, teamData: teamData});
});

app.post('/dashboard/settings', api.requiresAuth, (req, res) => {
  if(!req.user){ return res.send("You don't have permissions to do that!"); }
  if(req.user.id != req.body.user_id){ return res.send("You don't have permissions to do that!"); }
  const teamData = teamHandler.data.find(data => data.id == req.body.team_id);
  if(!teamData.member_ids.includes(req.user.id)){ return res.send("You don't have permissions to do that!"); }
  const data = {
    name: req.body.name,
    description: req.body.description
  }
  if(teamHandler.updateTeamData(req.body.team_id, data)){
    res.redirect(`/dashboard?type=success&msg=${decodeURIComponent('Successfully updated team setttings!')}`);
  } else {
    res.redirect(`/dashboard?type=error&msg=${decodeURIComponent('Failed to update team setttings!')}`);
  }
});

app.post('/dashboard/settings/users/delete/:user_id', api.requiresAuth, (req, res) => {
  //Delete user from team
})

app.get('/profile', api.requiresAuth, (req, res) => {
  const returnData = req.user;
  delete returnData._id;
  delete returnData.id;
  delete returnData.password;
  res.send(returnData);
});

//* Auth pages
app.post('/login', api.requiresNonAuth, (req, res, next) => {
  passport.authenticate('login', (err, user, info) => {
    if(err){ return res.redirect(`/login?logErr=${JSON.stringify(err)}`); }
    if(!user){ return res.redirect(`/login?logErr=${JSON.stringify(info)}`); }
    req.logIn(user, (err) => {
      if(err){ return next(err); }
      const lastPage = api.authUsers[requestIp.getClientIp(req)];
      res.redirect(lastPage ?? '/dashboard');
      api.clearSession(req.user.id)
      return;
    });
  })(req, res, next);
});
app.get('/login', api.requiresNonAuth, (req, res) => {
  let err = req.query.logErr;
  if(err){
    return res.render('auth/login.ejs', { user: null, err: err });
  }
  res.render('auth/login.ejs', { user: null, err: null });
});
app.get('/logout', (req, res) => {
  if(req.isAuthenticated()){ return req.logOut(() => { res.redirect('/'); }) }
  res.redirect('/');
});

//* Invites
app.get('/invite/create', api.requiresAuth, (req, res) => {
  const invite = apiHandler.invites.createInvite(req.user.team_id, req.user.id);
  res.send(`<a href="${domain}invite/${invite.id}">${domain}invite/${invite.id}</a>`)
})
app.get('/invite/:invite_id', api.requiresAuth, (req, res) => {
  const invite = apiHandler.invites.validateInvite(req.params.invite_id);
  if(!invite) { return res.send('Invite is invalid'); }
  if (teamHandler.userJoinEvent(req.user.id, invite.team_id)) { return res.send("Successfully joined team!"); }
  res.send('Failed to join team!');
});

const apiHandler = new api.handler("./api/data/users.json");
const teamHandler = new api.handler("./api/data/teams.json");

app.listen(8080, async () => {
  console.log("SERVER:", "Listining on port: 8080");
});

module.exports = {
  apiHandler,
  teamHandler,
  app,
  requestIp
}