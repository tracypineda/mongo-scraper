// var path = require("path");
var db = require("../models");


module.exports = function (app) {

    app.get("/", function (req, res) {
        // res.render("index");

        db.Article.find({})
        .then(function (dbArticle) {
            var hbObj = {
                articles:dbArticle
            }
          // If we were able to successfully find Articles, send them back to the client
          res.render("index", hbObj);
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });

    app.get("/saved", function(req,res){
         res.render("saved");

        db.Article.find({
            status: true
          })
          .then(function (dbSaved) {
            // If we were able to successfully find Articles, send them back to the client
            var hbObj = {
                save:dbSaved
            }

            res.render("saved", hbObj);
          })
          .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
    })
};