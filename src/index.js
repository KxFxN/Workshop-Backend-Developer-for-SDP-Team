const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const Data = require("./model/data");
const User = require("./model/user");
const authenticateToken = require("./middleware/auth");

mongoose.connect(process.env.MONGO_URI);

const app = express();
app.use(express.json());

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "A simple API",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Localhost on port 3001",
      },
      {
        url: "http://127.0.0.1:3001",
        description: "Localhost IP on port 3001",
      },
    ],
    components: {
      schemas: {
        Data: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            Seed_RepDate: {
              type: "string",
            },
            Seed_Year: {
              type: "number",
            },
            Seeds_YearWeek: {
              type: "number",
            },
            Seed_Varity: {
              type: "string",
            },
            Seed_RDCSD: {
              type: "number",
            },
            Seed_Stock2Sale: {
              type: "number",
            },
            Seed_Season: {
              type: "string",
            },
            Seed_Crop_Year: {
              type: "number",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            username: {
              type: "string",
              unique: true,
              required: true,
            },
            password: {
              type: "string",
              required: true,
            },
            token: {
              type: "string",
            },
          },
        },
      },
    },
  },
  apis: ["./src/index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(process.env.API_PORT, () => {
  console.log("Server running on port 3001");
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Username already exists
 *       500:
 *         description: Error registering user
 */
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ message: "Username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    const token = jwt.sign(
      { user_id: User._id, username },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );

    const newUser = new User({
      username,
      password: encryptedPassword,
    });

    newUser.token = token;

    await newUser.save();

    res.status(201).send({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).send({ message: "Error registering user", error });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "admin1234"
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Error logging in
 */
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).send({ message: "No username" });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, username },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      user.token = token;

      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        })
        .status(200)
        .send({ message: "Login successful" });
    } else {
      res.status(401).send({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).send({ message: "Error logging in", error });
  }
});

/**
 * @swagger
 * /data:
 *   get:
 *     summary: Get all data
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Data'
 *       500:
 *         description: Error retrieving data
 */
app.get("/data", authenticateToken, async (req, res) => {
  try {
    const datas = await Data.find();
    res
      .status(200)
      .send({ message: "Data retrieved successfully!", data: datas });
  } catch (error) {
    res.status(500).send({ message: "Error retrieving data", error });
  }
});

/**
 * @swagger
 * /data/{id}:
 *   get:
 *     summary: Get data by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Data ID
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Data'
 *       404:
 *         description: Data not found
 *       500:
 *         description: Error retrieving data
 */
app.get("/data/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Data.findById(id);
    if (!data) {
      return res.status(404).send({ message: "Data not found" });
    }
    res.status(200).send({ message: "Data retrieved successfully!", data });
  } catch (error) {
    res.status(500).send({ message: "Error retrieving data", error });
  }
});

/**
 * @swagger
 * /add-data:
 *   post:
 *     summary: Add new data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               Seed_RepDate:
 *                 type: string
 *               Seed_Year:
 *                 type: number
 *               Seeds_YearWeek:
 *                 type: number
 *               Seed_Varity:
 *                 type: string
 *               Seed_RDCSD:
 *                 type: number
 *               Seed_Stock2Sale:
 *                 type: number
 *               Seed_Season:
 *                 type: string
 *               Seed_Crop_Year:
 *                 type: number
 *             required:
 *               - _id
 *               - Seed_RepDate
 *               - Seed_Year
 *               - Seeds_YearWeek
 *               - Seed_Varity
 *               - Seed_RDCSD
 *               - Seed_Stock2Sale
 *               - Seed_Season
 *               - Seed_Crop_Year
 *     responses:
 *       201:
 *         description: Data created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Data'
 *       500:
 *         description: Error creating data
 */
app.post("/add-data", authenticateToken, async (req, res) => {
  try {
    const {
      _id,
      Seed_RepDate,
      Seed_Year,
      Seeds_YearWeek,
      Seed_Varity,
      Seed_RDCSD,
      Seed_Stock2Sale,
      Seed_Season,
      Seed_Crop_Year,
    } = req.body;

    const data = new Data({
      _id,
      Seed_RepDate,
      Seed_Year,
      Seeds_YearWeek,
      Seed_Varity,
      Seed_RDCSD,
      Seed_Stock2Sale,
      Seed_Season,
      Seed_Crop_Year,
    });

    await data.save();

    res.status(201).send({ message: "Data created successfully!", data });
  } catch (error) {
    res.status(500).send({ message: "Error creating data", error });
  }
});

/**
 * @swagger
 * /data/{id}:
 *   put:
 *     summary: Update data by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Data ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Seed_RepDate:
 *                 type: string
 *               Seed_Year:
 *                 type: number
 *               Seeds_YearWeek:
 *                 type: number
 *               Seed_Varity:
 *                 type: string
 *               Seed_RDCSD:
 *                 type: number
 *               Seed_Stock2Sale:
 *                 type: number
 *               Seed_Season:
 *                 type: string
 *               Seed_Crop_Year:
 *                 type: number
 *     responses:
 *       200:
 *         description: Data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Data'
 *       404:
 *         description: Data not found
 *       500:
 *         description: Error updating data
 */
app.put("/data/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const {
      Seed_RepDate,
      Seed_Year,
      Seeds_YearWeek,
      Seed_Varity,
      Seed_RDCSD,
      Seed_Stock2Sale,
      Seed_Season,
      Seed_Crop_Year,
    } = req.body;

    const data = await Data.findByIdAndUpdate(
      id,
      {
        Seed_RepDate,
        Seed_Year,
        Seeds_YearWeek,
        Seed_Varity,
        Seed_RDCSD,
        Seed_Stock2Sale,
        Seed_Season,
        Seed_Crop_Year,
      },
      { new: true }
    );

    res.status(201).send({ message: "Data updated successfully!", data });
  } catch (error) {
    res.status(500).send({ message: "Error updating data", error });
  }
});

/**
 * @swagger
 * /data/{id}:
 *   delete:
 *     summary: Delete data by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Data ID
 *     responses:
 *       200:
 *         description: Data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Data not found
 *       500:
 *         description: Error deleting data
 */
app.delete("/data/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await Data.findByIdAndDelete(id);

    res.status(201).send({ message: "Data deleted successfully!" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting data", error });
  }
});
