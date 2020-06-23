const express = require("express");
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;
const app = express();
const morgan = require("morgan");
const helmet = require("helmet");
const redis = require("redis");
const axios = require("axios");
const client = redis.createClient();

// Middlewares
app.use(morgan("tiny"));
app.use(helmet());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

client.on("error", function (error) {
  console.error(error);
});

// Routes
app.get("/", function (req, res) {
  res.send("Bienvenue sur la route d'accueil");
});

// create an api/search route
app.get("/cache/:username", (req, res) => {
  const { username } = req.params;

  return client.get(`github:${username}`, (err, result) => {
    if (err) {
      console.log(err);
    }

    if (!result) {
      axios
        .get(`https://api.github.com/users/${username}`)
        .then((response) => {
          client.setex(`github:${username}`, 60, JSON.stringify(response.data));
          return res.send(JSON.stringify(response.data));
        })
        .catch((err) =>
          res.json({
            error: err.response.statusText,
          })
        );
    } else {
      return res.send(result);
    }
  });
});

app.get("/without-cache/:username", (req, res) => {
  const { username } = req.params;

  axios
    .get(`https://api.github.com/users/${username}`)
    .then((response) => {
      client.setex(`github:${username}`, 60, JSON.stringify(response.data));
      return res.send(JSON.stringify(response.data));
    })
    .catch((err) => res.json({ error: err.response.statusText }));
});

app.listen(port, () => {
  console.log(`Le serveur tourne sur le port ${port}`);
});
