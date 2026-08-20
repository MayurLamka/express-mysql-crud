const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
const mysql = require("mysql2");
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
require("dotenv").config();

const app = express();

// Middleware
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

// EJS configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.log("MySQL connection failed:", err);
        return;
    }

    console.log("MySQL Connected Successfully");
});

// Generate random user
const getRandomUser = () => {
    return [
        faker.string.uuid(),
        faker.internet.username(),
        faker.internet.email(),
        faker.internet.password()
    ];
};

// Home page
app.get("/", (req, res) => {

    const q = `SELECT COUNT(*) AS count FROM user`;

    connection.query(q, (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Some error in database");
        }

        const count = result[0].count;

        res.render("home.ejs", { count });
    });
});

// Show add-user form
app.get("/user/addnew", (req, res) => {
    res.render("adduser.ejs");
});

// Create new user
app.post("/users", (req, res) => {

    const { username, email, password } = req.body;
    const id = uuidv4();

    const q = `
        INSERT INTO user (id, username, email, password)
        VALUES (?, ?, ?, ?)
    `;

    connection.query(
        q,
        [id, username, email, password],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.send("Database error");
            }

            res.redirect("/users");
        }
    );
});

// Show all users
app.get("/users", (req, res) => {

    const q = `SELECT * FROM user`;

    connection.query(q, (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Some error in database");
        }

        res.render("showusers.ejs", { result });
    });
});

// Show edit form
app.get("/user/:id/edit", (req, res) => {

    const { id } = req.params;

    const q = `SELECT * FROM user WHERE id = ?`;

    connection.query(q, [id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        const user = result[0];

        if (!user) {
            return res.send("User not found");
        }

        res.render("edit.ejs", { user });
    });
});

// Update username
app.patch("/user/:id", (req, res) => {

    const { id } = req.params;

    const {
        password: formpass,
        username: newusername
    } = req.body;

    // Find user
    const q = `SELECT * FROM user WHERE id = ?`;

    connection.query(q, [id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        const user = result[0];

        if (!user) {
            return res.send("User not found");
        }

        // Check password
        if (user.password !== formpass) {
            return res.send("Password is incorrect");
        }

        // Update username
        const updateQuery = `
            UPDATE user
            SET username = ?
            WHERE id = ?
        `;

        connection.query(
            updateQuery,
            [newusername, id],
            (err, result) => {

                if (err) {
                    console.log(err);
                    return res.send("Database error");
                }

                res.redirect("/users");
            }
        );
    });
});

// Show delete confirmation page
app.get("/user/:id/delete", (req, res) => {

    const { id } = req.params;

    const q = `SELECT * FROM user WHERE id = ?`;

    connection.query(q, [id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        const user = result[0];

        if (!user) {
            return res.send("User not found");
        }

        res.render("delete.ejs", { user });
    });
});

// Delete user
app.delete("/user/:id", (req, res) => {

    const { id } = req.params;

    const {
        email: delEmail,
        password: delPassword
    } = req.body;

    // Find user
    const q = `SELECT * FROM user WHERE id = ?`;

    connection.query(q, [id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        const user = result[0];

        if (!user) {
            return res.send("User not found");
        }

        // Verify email and password
        if (
            user.email !== delEmail ||
            user.password !== delPassword
        ) {
            return res.send("Email or password incorrect");
        }

        // Delete user
        const deleteQuery = `DELETE FROM user WHERE id = ?`;

        connection.query(
            deleteQuery,
            [id],
            (err, result) => {

                if (err) {
                    console.log(err);
                    return res.send("Database error");
                }

                res.redirect("/users");
            }
        );
    });
});

// Start server
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});