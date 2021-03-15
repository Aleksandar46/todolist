//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const itemsSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist",
});

const item2 = new Item({
  name: "Hit + button to add new item",
});

const item3 = new Item({
  name: "<-- hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, result) {
    if (!err) {
      if (!result) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items,
        });
      }
    }
  });
});

app.get("/", function (req, res) {
  Item.find({}, function (err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function (error) {
        if (error) {
          console.log(error);
        } else {
          console.log("Default items added successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = (req.body.list).trim();

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const itemToRemove = (req.body.checkbox).trim();
  const listName = (req.body.listName).trim();

  if(listName === "Today"){
    Item.findByIdAndRemove(itemToRemove, function (err) {
      if (!err) {
        console.log("deleted " + itemToRemove);
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemToRemove}}}, function(err,doc){
      if(err){
        console.log(err);
      }else{
        console.log("deleted item " + itemToRemove);
        res.redirect("/"+listName);
      }
    })
  }

});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
