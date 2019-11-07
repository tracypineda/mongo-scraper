var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Our scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
var results = [];

// Routes

app.get("/", function (req, res) {
  res.render("index");
});

// A GET route for scraping the NPR website
app.get("/scrape", function (req, res) {
  var found;
  var titleArr = [];
  db.Article.find({})
    .then(function (dbArticle) {
      for (var i = 0; i < dbArticle.length; i++) {
        titleArr.push(dbArticle[i].title)
      }
      console.log(titleArr);
      axios.get("https://www.npr.org/sections/news/").then(function (response) {
        var $ = cheerio.load(response.data);

        $("body h2").each(function (i, element) {
          var result = {};

          result.title = $(element).children("a").text();
          found = titleArr.includes(result.title);
          result.link = $(this).children("a").attr("href");
          result.excerpt = $(this)
          result.excerpt = $(element).parent().children("p .teaser").text().trim();
          if (!found && result.title && result.link) {
            results.push(result);
          }
        });
        res.render("scrape", {
          articles: results
        });
      })
    });
});


//route to save an article
app.post("/save", function (req, res) {
  var newArticle = new Article(req.body);
  newArticle.save(function (error, doc) {
    if (error) {
      console.log(error);
    } else {
      res.send("Article has been saved");
    }
  })
});

//delete article == make sure notes are deleted, too
app.delete("/delete/:id", function (req, res) {
  //find article to delete its notes
  Article.findOne({ "_id": req.params.id }, function (err, data) {
    if (err) {
      console.log(err);
    } else if (data.note) {
      console.log("deleting note");
      var noteIDs = data.note;
      //loop through notes array to delete all notes linked to this article
      for (var i = 0; i < noteIDs.length; i++) {
        Note.findByIdAndRemove(noteIDs[i], function (error, doc) {
          if (error) {
            console.log(error)
          }
        });
      }
    }
  });

  //delete article
  Article.findByIdAndRemove(req.params.id, function (error, doc) {
    if (error) {
      console.log(error);
    }
    res.send(doc);
  });
});

//add a note to an article
app.post("/articles/:id", function (req, res) {
  //create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);
  //save new note to database
  newNote.save(function (error, doc) {
    if (error) {
      console.log(error);
    } else {
      //use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "note": doc._id } }, { new: true })
        //execute the above entry
        .exec(function (err, doc) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/articles");
          }
        });
    }
  });
});

//delete a note
app.delete("/delete/notes/:id", function (req, res) {
  var id = req.params.id;

  Note.findByIdAndRemove({ "_id": req.params.id }, function (err, doc) {
    if (err) {
      console.log(err);
    }
  });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});