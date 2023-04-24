

// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const user = {
  username: undefined,
  password: undefined
}

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

app.get('/', (req, res) => {
    res.redirect('/login');
});
  
app.get('/login', (req, res) => {
    res.render("pages/login");
});

app.post('/login', async (req, res) => {
    const access = `SELECT * FROM users WHERE username = '${req.body.username}';`;

    db.task('get-everything', async task => {
      return task.any(access);
    })
      .then(async data => {
        if (await bcrypt.compare(req.body.password, data[0].password)) {
          user.username = data[0].username;
          user.password = data[0].password;
          req.session.user = user;
          req.session.save();
          res.redirect('/discover');
        } else {
          res.locals.message = 'Incorrect username or password.';
          res.render("pages/login");
        }
      })
      .catch(err => {
        res.redirect('/register');
      });
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = await bcrypt.hash(req.body.password, 10);
    const insert = `INSERT INTO users (username, password) VALUES ('${username}', '${password}');`;

    db.task('get-everything', task => {
        return task.any(insert);
    })
        .then(data => {
          res.redirect('/login');
        })
        .catch(err => {
          res.redirect('/register');
        });
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

app.get('/logout', (req, res) => {
  user.username = undefined;
  user.password = undefined;
  req.session.user = user;
  req.session.save();
  res.locals.message = 'Logged out successfully';
  res.render("pages/login");
});

app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
});



const request = require('request');    
            
var host = 'data.usajobs.gov';  
// var userAgent = 'grant.hargrav@gmail.com';  
var userAgent = 'nepalprajwal122@gmail.com'; 
// var authKey = 'QYaokDz2ueAHu3iPkUCh8Zn7wBR11Hl0l7ruwzfGJ8U='; 
var authKey = 'eqZopqznQlnIvQF9cj3OgQNjqO9fY/n+0llgOg5SvPE='; 


app.get('/home' ,(req,res) =>{
  axios({      
      url: 'https://data.usajobs.gov/api/search?JobCategoryCode=2210&Keyword=Software Development&LocationName=Washington, DC',      
      method: 'GET',      
      headers: {          
          "Host": host,          
          "User-Agent": userAgent,          
          "Authorization-Key": authKey      
      }  
  })
  .then(results => {
    console.log(results.data) 
    var data = results.data; 
    // var data = JSON.parse(results.data);  
    //let events = results.data._embedded.events;
    res.render('pages/home',{data:data})
  })
  .catch(error => {
    // Handle errors
    console.log(error)
    res.render('pages/home',{message:"Something went wrong"});
  });
  
});







// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
// app.listen(3000);
console.log('Server is listening on port 3000');

