const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const API_KEY = "AIzaSyD2zJzR9W-UtrZGEuiZGkvpUo_jTGdGkYg";
const genAI = new GoogleGenerativeAI(API_KEY);

app.use(express.json());

// Handle form-data (text + file upload)
app.post("/generate", upload.single("audio_file"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const audioFile = req.file;

    if (!prompt && !audioFile) {
      return res.status(400).json({ error: "Provide at least a prompt or audio file." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let result;
    if (audioFile) {
      result = await model.generateContent({
        contents: [{ inline_data: { data: audioFile.buffer.toString("base64"), mime_type: audioFile.mimetype } }],
      });
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Vercel needs this to export the Express app
module.exports = app;
