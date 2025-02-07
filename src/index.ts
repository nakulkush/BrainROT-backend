import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { UserModel, ContentModel, TagModel, LinkModel } from "./db";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";
import { userMiddleware } from "./middleware";
import { randomhash } from "./utils";

const app = express();
app.use(express.json());
// app.post("/api/v1/signup", async (req, res) => {
//   // //add zod validation, hash the password using the bcrypt
//   // //   Constraints -
//   // // 1. username should be 3-10 letters
//   // // 2. Password should be 8 to 20 letters, should have atleast one uppercase, one lowercase, one special character, one number
//   // const { username, password } = req.body;
//   // await UserModel.create({
//   //   username: username,
//   //   password: password, //hashed password
//   // });
//   // // 1. Status 200 - Signed up
//   // // 2. Status 411 - Error in inputs
//   // // 3. Status 403 -  User already exists with this username
//   // // 4. Status 500 - Server error
//   // res.status(200).json({
//   //   message: "User signed up :)",
//   // });
// });

app.post("/api/v1/signup", async (req: Request, res: Response) => {
  try {
    // Define schema using Zod for validation
    const userSchema = z.object({
      username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long" })
        .max(10, { message: "Username must not exceed 10 characters" }),
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(20, { message: "Password must not exceed 20 characters" }),
      // .regex(/[A-Z]/, {
      //   message: "Password must include at least one uppercase letter",
      // })
      // .regex(/[a-z]/, {
      //   message: "Password must include at least one lowercase letter",
      // })
      // .regex(/[0-9]/, {
      //   message: "Password must include at least one number",
      // })
      // .regex(/[\W_]/, {
      //   message: "Password must include at least one special character",
      // }),
    });

    // Validate user input
    const { username, password } = userSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      res
        .status(403)
        .json({ message: "User already exists with this username" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    await UserModel.create({
      username,
      password: hashedPassword,
    });

    // Success response
    res.status(200).json({ message: "User signed up :)" });
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      res.status(411).json({
        message: "Error in inputs",
        errors: (error as z.ZodError).errors, // Return detailed validation errors
      });
    }

    // Server error
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  // const { username, password } = req.body;

  // const existingUser = await UserModel.findOne({ username, password });

  // if (existingUser) {
  //   const token = jwt.sign({ id: existingUser._id }, JWT_PASSWORD);

  //   res.json({ token });
  // } else {
  //   res.status(403).json("Incorrect Credentials");
  // }

  try {
    const { username, password } = req.body;

    const existingUser = await UserModel.findOne({ username });

    if (!existingUser) {
      res.status(401).json({ message: "Invalid Email or Password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid Email or Password" });
      return;
    }

    if (existingUser && isPasswordValid) {
      const token = jwt.sign(
        {
          id: existingUser._id,
        },
        JWT_PASSWORD
      );

      res.json({
        token,
      });
    }
  } catch (e) {
    res.json({
      message: (e as any).errors,
    });
  }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const { title, link, contentType } = req.body;

    await ContentModel.create({
      title: title,
      link: link,
      type: contentType,

      //@ts-ignore
      userId: req.userId,
    });
    res.status(200).json({ message: "Content created successfully:)" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    // const contentid = req.body;
    //@ts-ignore

    const userId = req.userId;

    const content = await ContentModel.find({
      // _id: contentid,
      userId: userId,
    }).populate("userId", "username");

    res.status(200).json({ message: content });
  } catch (err) {
    res.json({
      message: err,
    });
  }
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const contentId = req.body.contentId;
    //@ts-ignore
    const userId = req.userId;

    await ContentModel.deleteMany({
      _id: contentId,
      userId: userId,
    });

    res.json("Content deleted Successfully");
  } catch (err) {
    res.json({ message: err });
  }
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const share = req.body.share;
  //@ts-ignore
  const userId = req.userId;

  const hashlink = randomhash(10);
  if (share) {
    const existinglink = await LinkModel.findOne({
      userId: userId,
    });

    if (existinglink) {
      res.json({ hash: existinglink.hash });
      return;
    }

    await LinkModel.create({
      userId: userId,
      hash: hashlink,
    });

    res.json({ message: "/share/" + hashlink });
  } else {
    await LinkModel.deleteOne({
      userId: userId,
    });

    res.json({ message: "Your shareable link has been deleted" });
  }

  // res.json("Content Shareability Updated");
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hashurl = req.params.shareLink;

  const link = await LinkModel.findOne({ hash: hashurl });

  if (!link) {
    res.json("Can't View the brain");
    return;
  }

  const content = await ContentModel.find({
    userId: link.userId,
  });

  const userinfo = await UserModel.findOne({
    _id: link.userId,
  });

  if (!userinfo) {
    res.json("This errro should not happen logically, something weird occured");
    return;
  }

  res.json({
    username: userinfo.username,
    content: content,
  });
});

app.listen(3000);
