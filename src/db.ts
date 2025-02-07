import mongoose, { model, Schema } from "mongoose";

mongoose.connect("ADD YOUR MONGO_DB URL HERE");

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
export const UserModel = model("User", UserSchema);

const tagSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
});
export const TagModel = model("Tag", tagSchema);

const contentTypes = ["image", "video", "article", "audio"];

const ContentSchema = new Schema({
  title: { type: String, required: true },

  link: { type: String, required: true },

  type: { type: String, enum: contentTypes, required: true },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});
export const ContentModel = model("Content", ContentSchema);

const LinkSchema = new Schema({
  hash: String,
  userId: { type: mongoose.Types.ObjectId, required: true, unique: true },
});
export const LinkModel = model("links", LinkSchema);
console.log(module.exports);
