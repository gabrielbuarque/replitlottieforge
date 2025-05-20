import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import AdmZip from "adm-zip";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to extract Lottie animation from a URL
  app.post("/api/extract-lottie", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // Fetch the webpage content
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse with cheerio
      const $ = cheerio.load(html);
      
      // Try to find lottie player and get its source
      const lottiePlayer = $("dotlottie-player, lottie-player");
      
      if (lottiePlayer.length === 0) {
        return res.status(404).json({ message: "No Lottie animation found on this page" });
      }
      
      const src = lottiePlayer.attr("src");
      
      if (!src) {
        return res.status(404).json({ message: "Lottie animation source not found" });
      }
      
      // Extract name from URL or page title
      let name = $("title").text().trim();
      
      // If title is too long or has special chars, extract from URL
      if (name.length > 50 || /[^\w\s-]/.test(name)) {
        const urlParts = url.split("/");
        const lastPart = urlParts[urlParts.length - 1];
        name = lastPart.split("-").join(" ").trim() || "lottie-animation";
      }
      
      // Clean name further
      name = name
        .replace(/lottie(files)?|animation/gi, "")
        .replace(/\s+/g, " ")
        .trim() || "animation";
      
      // Return the animation metadata
      res.json({
        id: Date.now().toString(),
        name,
        jsonUrl: src
      });
    } catch (error) {
      console.error("Error extracting Lottie:", error);
      res.status(500).json({ message: "Failed to extract Lottie animation" });
    }
  });

  // API endpoint to create a .lottie package from JSON
  app.post("/api/create-lottie-package", async (req, res) => {
    try {
      const { jsonData, name } = req.body;
      
      if (!jsonData) {
        return res.status(400).json({ message: "JSON data is required" });
      }
      
      // Create a new zip file
      const zip = new AdmZip();
      
      // Add the animation JSON
      zip.addFile("animations/animation.json", Buffer.from(JSON.stringify(jsonData)));
      
      // Add a basic manifest
      const manifest = {
        animations: [
          {
            id: "animation",
            speed: 1,
            autoplay: true,
            loop: true,
            direction: 1,
            name: name || "Lottie Animation"
          }
        ]
      };
      
      zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest)));
      
      // Generate the .lottie file
      const zipBuffer = zip.toBuffer();
      
      // Send as response
      res.set({
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=${name || "animation"}.lottie`
      });
      
      res.send(zipBuffer);
    } catch (error) {
      console.error("Error creating .lottie package:", error);
      res.status(500).json({ message: "Failed to create .lottie package" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
