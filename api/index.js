// const express = require("express");
// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const app = express();
// const port = 3000;

// // Replace with your actual API key
// const API_KEY = "AIzaSyD2zJzR9W-UtrZGEuiZGkvpUo_jTGdGkYg";
// const genAI = new GoogleGenerativeAI(API_KEY);

// // Set up multer for handling file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// // ✅ API Route for form-data input (text & audio)
// app.post("/generate", upload.single("audio_file"), async (req, res) => {
//   try {
//     const prompt = req.body.prompt; // Get prompt from form-data
//     const audioFile = req.file; // Uploaded file

//     if (!prompt && !audioFile) {
//       return res.status(400).json({ error: "Either prompt or audio_file is required" });
//     }

//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//     let requestPayload = { contents: [] };

//     // If text input is provided
//     if (prompt) {
//       requestPayload.contents.push({ role: "user", parts: [{ text: prompt }] });
//     }

//     // If an audio file is provided
//     if (audioFile) {
//       const audioBuffer = fs.readFileSync(audioFile.path);
//       requestPayload.contents.push({
//         role: "user",
//         parts: [
//           {
//             inline_data: {
//               mime_type: audioFile.mimetype,
//               data: audioBuffer.toString("base64"),
//             },
//           },
//         ],
//       });

//       // Delete file after reading
//       fs.unlinkSync(audioFile.path);
//     }

//     // Send request to Gemini API
//     const result = await model.generateContent(requestPayload);
//     const responseText = result.response.text();

//     res.json({ response: responseText });
//   } catch (error) {
//     console.error("Error generating content:", error);

//     res.status(500).json({
//       error: "Internal server error",
//       details: error.message,
//     });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });

import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure multer for file upload
const upload = multer({ dest: "uploads/" });

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ensure only POST method is accepted
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Use environment variable for API key
    const API_KEY = "AIzaSyD2zJzR9W-UtrZGEuiZGkvpUo_jTGdGkYg";

    if (!API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Promisify multer upload
    return new Promise((resolve, reject) => {
      upload.single('audio_file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: "File upload failed" });
        }

        const prompt = req.body.prompt;
        const audioFile = req.file;

        if (!prompt && !audioFile) {
          return res.status(400).json({ error: "Either prompt or audio_file is required" });
        }

        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Changed to gemini-pro

          let requestPayload = { contents: [] };

          if (prompt) {
            requestPayload.contents.push({ 
              role: "user", 
              parts: [{ text: prompt }] 
            });
          }

          if (audioFile) {
            const audioBuffer = fs.readFileSync(audioFile.path);
            requestPayload.contents.push({
              role: "user",
              parts: [{
                inline_data: {
                  mime_type: audioFile.mimetype,
                  data: audioBuffer.toString("base64"),
                },
              }],
            });

            // Delete file after reading
            fs.unlinkSync(audioFile.path);
          }

          // Send request to Gemini API
          const result = await model.generateContent(requestPayload);
          const responseText = result.response.text();

          res.status(200).json({ response: responseText });
          resolve();

        } catch (error) {
          console.error("Gemini API Error:", error);
          res.status(401).json({
            error: "Authentication failed",
            details: error.message
          });
          resolve();
        }
      });
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}