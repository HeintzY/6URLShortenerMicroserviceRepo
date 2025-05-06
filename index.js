require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

//Project solution:
let bodyParser = require("body-parser");
let mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: {
    type: Number,
    required: true

  }
});

let UrlModel = mongoose.model("UrlModel", urlSchema);

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

app.post("/api/shorturl", bodyParser.urlencoded({ extended: false }), function (req, res) {
  let inputUrl = req.body["url"];

  if (!isValidUrl(inputUrl)) {
    return res.json({ error: 'invalid url' });
  }

  let inputUrlShort = 1;
  UrlModel.findOne({})
    .sort({ short_url: "desc" })
    .exec((err, data) => {
      if (err) {
        return console.log(err);
      }
      else if (data != null) {
        inputUrlShort = data.short_url + 1;
      }
      UrlModel.findOneAndUpdate({ original_url: inputUrl }, { original_url: inputUrl, short_url: inputUrlShort }, { new: true, upsert: true }, (err, updatedData) => {
        if (err) {
          return console.log(err);
        }
        else {
          return res.json({ original_url: inputUrl, short_url: inputUrlShort });
        }
      });
    });
});

app.get("/api/shorturl/:short_input", function (req, res) {
  UrlModel.findOne({ short_url: req.params.short_input }, (err, dataFound) => {
    if (err) {
      console.log(err);
    }
    else if (!dataFound) {
      res.json('could not find url')
    }
    else {
      res.redirect(dataFound.original_url)
    }
  });

});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
