const express = require('express');
const authRouter = require("./routes/auth.routes")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const multer = require("multer")
const app = express();

const interviewRouter = require("./routes/interview.routes")


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials:true
}));
app.use("/api/auth",authRouter)
app.use("/api/interview", interviewRouter)

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error)
    }

    if (error.name === "ValidationError") {
        console.warn("Generated interview report failed validation:", error.message)
        return res.status(502).json({
            message: "The generated report was incomplete. Please try again."
        })
    }

    if (error instanceof multer.MulterError) {
        const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Resume must be 10MB or smaller."
            : "The uploaded resume could not be accepted."
        return res.status(status).json({ message })
    }

    console.error("Request failed:", error)
    res.status(error.status || 500).json({
        message: error.status && error.status < 500 ? error.message : "Internal server error."
    })
})



module.exports = app;