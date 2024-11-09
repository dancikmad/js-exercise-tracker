const express = require('express');
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

// Config project
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));

function generateObjectId() {
  return Math.floor((1 + Math.random()) * 0x100000000)
    .toString(16)
    .substring(1); // Create a random 24-character hex string
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let usersList = [];
let usersListLog = [];

app.post('/api/users', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const userProfile = {};
  const userId = generateObjectId();
  userProfile["_id"] = userId;
  userProfile["username"] = username;

  usersList.push(userProfile);
  userProfile["count"] = 0;
  userProfile["log"] = [];
  usersListLog.push(userProfile);

  res.json({ username: username, _id: userId });
});

app.get("/api/users", (req, res) =>{
  res.json(usersList);
});

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const userLog = usersListLog.find(user => user["_id"] === userId);

  if (userLog) {
    let log = [...userLog.log];

    if (from) {
      log = log.filter(entry => new Date(entry.date) >= new Date(from));
    }

    if (to) {
      log = log.filter(entry => new Date(entry.date) <= new Date(to));
    }

    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    res.json({
      _id: userLog._id,
      username: userLog.username,
      count: log.length,
      log: log
    });
  } else {
    res.json({ error: "User not found" });
  }
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = usersList.find(user => user["_id"] === userId);

  if (user) {
    const exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();
    const exerciseDuration = parseInt(duration, 10);
    const exerciseDescription = description;

    const userLog = usersListLog.find(user => user["_id"] === userId);

    if (userLog) {
      userLog.count += 1;
      userLog.log.push({
        description: exerciseDescription,
        duration: exerciseDuration,
        date: exerciseDate
      });

      res.json({
        _id: userLog._id,
        username: userLog.username,
        description: exerciseDescription,
        duration: exerciseDuration,
        date: exerciseDate
      });
    }
  } else {
    res.json({ error: "Invalid user _id" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
