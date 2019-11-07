var axios = require("axios");
var cheerio = require("cheerio");
// Requiring our models and passport as we've configured it
var db = require("../models");

module.exports = function (app, axios, cheerio) {

  app.get("/api/articles", function (req, res){
    db.Article.findAll({})
    .then(function(dbArticle) {
      console.log(dbArticle);
      res.render("saved", {
        saved: dbArticle
      });
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

   app.get("/api/notes/:id", function (req, res) {
    var id = req.params.id;
    db.Note.findOne({id:id})
      .then(function (dbNote) {
        // If we were able to successfully find Articles, send them back to the client
        console.log(dbNote);
        res.json(dbNote);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });



  app.post("/api/notes/", function (req, res) {
    db.Note.deleteOne({id:req.body.id}).then(function (err, delOK) {
      if (delOK) console.log("Collection deleted");
    })
    .catch(function(err){
      console.log("Delete error, " + err);
    })

    var result = {};
    result.title = req.body.title;
    result.body = req.body.body;
    result.id = req.body.id;

    db.Note.create(result)
      .then(function (dbNote) {
        console.log("created, " + dbNote);
        res.send(true);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.send(false);
        return (err);
      });
  });

  app.delete("/api/notes/", function (req, res) {
    db.Note.deleteOne({id:req.body.id}).then(function (err, delOK) {
      if (delOK) console.log("Note deleted");
      res.send("deleted");
    })
    .catch(function(err){
      console.log("Delete error, " + err);
    })
  });

// gets saved articles from db and displays them
app.get("/saved", function(req, res) {
  Articles.find({"status": true}, function(err, data) {
      if (err) { 
          console.log(err);
      } else {
          res.render("saved", {articles: data, saved: true});
      }
  });
});

// assigns saved status to article 
app.put("/saved/:id", function(req, res) {
  Articles.findOneAndUpdate({_id: req.params.id}, {$set : {status: true}})
  .catch(function(err, data) {
      if (err) {
          console.log(err);
      } else {
          res.send("Article Saved");
      }
  });
});

// removes articles from saved status 
app.post("/unsave", function(req, res) {
  Articles.findOneAndUpdate({"_id": req.body.articleId}, {$set : {"status": false}})
  .exec(function(err, data) {
      if (err) {
          console.log(err);
      } else {
          res.send("Post successful");
      }
  });
});

  app.put("/api/articles/:id", function (req, res) {
    // Grab every document in the Articles collection
        db.Article.findOne({
        _id: req.params.id
      })
      .then(function (dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        console.log(dbArticle);

        if (dbArticle.saved === true) {
          res.send(false);
          return db.Article.findOneAndUpdate({
            _id: req.params.id
          }, {
            saved: false
          });
        } else if (dbArticle.saved === false) {
          res.send(true);
          return db.Article.findOneAndUpdate({
            _id: req.params.id
          }, {
            saved: true
          });
        }
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        console.log(dbArticle)
      });
  });

//   app.get("/api/scrapeArticles", function (req, res) {
//     db.Article.deleteMany(function (err, delOK) {
//       if (err) throw err;
//       if (delOK) console.log("Collection deleted");
//     });

    
    // Get route to scrape articles from ironman.com site
    app.get("/api/scrapeArticles", function (req, res) {
    
   axios.get("https://www.ironman.com/#axzz63OTOjcNS").then(function (response) {
        var $ = cheerio.load(response.data);

        $("article div .storyContent").each(function (i, element) {
            var result = {};

            result.title = $(this).children("a").children("h5").text();
            result.excerpt = $(this)
                .children("p")
                .text();
            result.link = $(this).children("a").attr("href");
            result.saved = false;

        db.Article.create(result)
          .then(function (dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function (err) {
            // If an error occurred, send it to the client
            return (err);
          });
      })

    });
    res.send("Scrape Completed");
  });
};