"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const db_1 = require("./db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
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
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Define schema using Zod for validation
        const userSchema = zod_1.z.object({
            username: zod_1.z
                .string()
                .min(3, { message: "Username must be at least 3 characters long" })
                .max(10, { message: "Username must not exceed 10 characters" }),
            password: zod_1.z
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
        const existingUser = yield db_1.UserModel.findOne({ username });
        if (existingUser) {
            res
                .status(403)
                .json({ message: "User already exists with this username" });
        }
        // Hash the password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create the user in the database
        yield db_1.UserModel.create({
            username,
            password: hashedPassword,
        });
        // Success response
        res.status(200).json({ message: "User signed up :)" });
    }
    catch (error) {
        // Handle validation errors from Zod
        if (error instanceof zod_1.z.ZodError) {
            res.status(411).json({
                message: "Error in inputs",
                errors: error.errors, // Return detailed validation errors
            });
        }
        // Server error
        res
            .status(500)
            .json({ message: "Server error", error: error.message });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingUser = yield db_1.UserModel.findOne({ username });
        if (!existingUser) {
            res.status(401).json({ message: "Invalid Email or Password" });
            return;
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, existingUser.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid Email or Password" });
            return;
        }
        if (existingUser && isPasswordValid) {
            const token = jsonwebtoken_1.default.sign({
                id: existingUser._id,
            }, config_1.JWT_PASSWORD);
            res.json({
                token,
            });
        }
    }
    catch (e) {
        res.json({
            message: e.errors,
        });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, link, contentType } = req.body;
        yield db_1.ContentModel.create({
            title: title,
            link: link,
            type: contentType,
            //@ts-ignore
            userId: req.userId,
        });
        res.status(200).json({ message: "Content created successfully:)" });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
}));
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const contentid = req.body;
        //@ts-ignore
        const userId = req.userId;
        const content = yield db_1.ContentModel.find({
            // _id: contentid,
            userId: userId,
        }).populate("userId", "username");
        res.status(200).json({ message: content });
    }
    catch (err) {
        res.json({
            message: err,
        });
    }
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contentId = req.body.contentId;
        //@ts-ignore
        const userId = req.userId;
        yield db_1.ContentModel.deleteMany({
            _id: contentId,
            userId: userId,
        });
        res.json("Content deleted Successfully");
    }
    catch (err) {
        res.json({ message: err });
    }
}));
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    //@ts-ignore
    const userId = req.userId;
    const hashlink = (0, utils_1.randomhash)(10);
    if (share) {
        const existinglink = yield db_1.LinkModel.findOne({
            userId: userId,
        });
        if (existinglink) {
            res.json({ hash: existinglink.hash });
            return;
        }
        yield db_1.LinkModel.create({
            userId: userId,
            hash: hashlink,
        });
        res.json({ message: "/share/" + hashlink });
    }
    else {
        yield db_1.LinkModel.deleteOne({
            userId: userId,
        });
        res.json({ message: "Your shareable link has been deleted" });
    }
    // res.json("Content Shareability Updated");
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hashurl = req.params.shareLink;
    const link = yield db_1.LinkModel.findOne({ hash: hashurl });
    if (!link) {
        res.json("Can't View the brain");
        return;
    }
    const content = yield db_1.ContentModel.find({
        userId: link.userId,
    });
    const userinfo = yield db_1.UserModel.findOne({
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
}));
app.listen(3000);
