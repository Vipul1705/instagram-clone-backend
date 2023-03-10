import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Pusher from "pusher";
import dbModel from "./dbModel.js";
import dotenv from "dotenv";
import mongodb from "mongodb";

//app config
dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

//middleware
app.use(express.json()); //passes the data in json through server
app.use(
  cors({
    origin: [
      "https://instagram-app-8yq5.onrender.com",
      "https://instagram-backend-buyl.onrender.com",
    ],
  })
); //use for header handles the security

//db config
const conn_url = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.xoczi1w.mongodb.net/instaDB?retryWrites=true&w=majority`;

mongoose.connect(conn_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("Database Connected...");

  const changeStream = mongoose.connection.collection("posts").watch();

  changeStream.on("change", (change) => {
    console.log("Change Triggered on pusher...");
    console.log(change);
    console.log("End of Change");

    if (change.operationType === "insert") {
      console.log("Triggering Pusher ***IMG UPLOAD***");

      const postDetails = change.fullDocument;
      pusher.trigger("posts", "inserted", {
        user: postDetails.user,
        caption: postDetails.caption,
        image: postDetails.image,
      });
    } else {
      console.log("Unknown trigger from Pusher");
    }
  });
});

//api routes
app.get("/", (req, res) => {
  res.status(200).send("Instagram backend guysss");
});
app.post("/upload", (req, res) => {
  const body = req.body;

  dbModel.create(body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/sync", (req, res) => {
  // dbModel.find((err, data) => {
  //   if (err) {
  //     res.status(500).send(err);
  //   } else {
  //     res.status(200).send(data);
  //   }
  // });
  dbModel
    .find()
    .sort({ timestamps: -1 })
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/post/comments/:id", (req, res) => {
  dbModel
    .findOne({ _id: req.params.id })
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.put("/add-comment/post/:id", (req, res) => {
  var newComment = {
    _id: mongodb.ObjectId(),
    ...req.body.comment,
  };
  dbModel.updateOne(
    { _id: req.params.id },
    { $push: { comments: newComment } },
    (err, data) => {
      if (err) {
        console.log(err);
      }
      res.status(200).send("Added SuccessFully!!");
    }
  );
});

//listen

app.listen(port, () => {
  console.log(`Listening on localhost : ${port}`);
});
