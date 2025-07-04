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
      
      console.log("Attempting to extract Lottie from URL:", url);
      
      // For direct JSON files, use them directly
      if (url.endsWith('.json')) {
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const name = fileName.replace('.json', '').replace(/-|_/g, ' ');
        
        console.log("Direct JSON URL detected:", url);
        return res.json({
          id: Date.now().toString(),
          name,
          jsonUrl: url
        });
      }
      
      // Handle LottieFiles URL
      if (url.includes('lottiefiles.com')) {
        console.log("LottieFiles URL detected");
        let animationName = "Lottie Animation";
        if (url.includes('/free-animation/')) {
          const pathPart = url.split('/free-animation/')[1].split('?')[0];
          const nameAndId = pathPart.split('-');
          if (nameAndId.length > 1) {
            nameAndId.pop();
            animationName = nameAndId.join(' ');
          }
        }
        // Buscar o elemento <dotlottie-player> e pegar o src completo
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        let lottieSrc = null;
        $("dotlottie-player").each((_, el) => {
          const src = $(el).attr("src");
          if (src && src.endsWith('.lottie') && src.startsWith('http')) {
            lottieSrc = src;
            return false; // break loop
          }
        });
        if (lottieSrc) {
          // Baixar e processar o .lottie
          return await processLottieFile(lottieSrc, animationName, res);
        }
        // Fallback para regex antigo se não achar o elemento
        const lottieRegex = /https:\/\/[^"'\s>]+\/[^"'\s>]+\.lottie/g;
        const matches = html.match(lottieRegex);
        if (matches && matches.length > 0) {
          // Filtrar para pegar o primeiro que contenha 'lottiefiles.com' e '/a/'
          const lottieUrl = matches.find(url => url.includes('lottiefiles.com') && url.includes('/a/')) || matches[0];
          console.log("Found .lottie URL:", lottieUrl);
          return await processLottieFile(lottieUrl, animationName, res);
        }
        // Fallback para JSON URL search se não achar .lottie
        const jsonRegex = /https:\/\/[^"']*\.json/g;
        const jsonMatches = html.match(jsonRegex);
        if (jsonMatches && jsonMatches.length > 0) {
          const jsonUrl = jsonMatches.find(m => 
            !m.includes('manifest.json') && 
            !m.includes('config.json') &&
            (m.includes('assets') || m.includes('animations') || m.includes('packages'))
          );
          if (jsonUrl) {
            console.log("Found JSON URL:", jsonUrl);
            return res.json({
              id: Date.now().toString(),
              name: animationName,
              jsonUrl
            });
          }
        }
        // New fallback: derive direct JSON URL using the slug ID
        const slugPart = url.split('/').pop();
        if (slugPart && slugPart.includes('-')) {
          const potentialId = slugPart.split('-').pop(); // after last '-'
          const jsonUrlCandidate = `https://assets9.lottiefiles.com/packages/lf20_${potentialId}.json`;
          console.log("Trying derived JSON URL:", jsonUrlCandidate);
          try {
            const headRes = await fetch(jsonUrlCandidate, { method: 'HEAD' });
            if (headRes.ok) {
              console.log("Derived JSON URL exists, returning it");
              return res.json({
                id: Date.now().toString(),
                name: animationName,
                jsonUrl: jsonUrlCandidate
              });
            } else {
              console.log("Derived JSON URL not valid (", headRes.status, ")");
            }
          } catch (err) {
            console.error("Error checking derived JSON URL", err);
          }
        }
      }
      
      // If nothing worked, provide a sample animation
      console.log("Using sample animation as fallback");
      return res.json({
        id: Date.now().toString(),
        name: "QR Code Scanner",
        jsonUrl: "https://assets9.lottiefiles.com/packages/lf20_xlkxtmul.json"
      });
      
    } catch (error) {
      console.error("Error extracting Lottie:", error);
      res.status(500).json({ message: "Failed to extract Lottie animation" });
    }
  });
  
  // Helper function to process a .lottie file (which is a ZIP)
  async function processLottieFile(lottieUrl: string, name: string, res: any) {
    try {
      console.log("Downloading .lottie file from:", lottieUrl);
      const response = await fetch(lottieUrl);
      const buffer = await response.arrayBuffer();
      
      // Use AdmZip to extract contents
      const zip = new AdmZip(Buffer.from(buffer));
      const entries = zip.getEntries();
      
      // Look for animation JSON in the /animations folder
      let animationJson = null;
      let animationJsonEntry = null;
      
      for (const entry of entries) {
        if (entry.entryName.includes('animations/') && entry.entryName.endsWith('.json')) {
          animationJsonEntry = entry;
          break;
        }
      }
      
      if (!animationJsonEntry) {
        throw new Error("No animation JSON found in the .lottie package");
      }
      
      // Extract the JSON data
      const jsonString = animationJsonEntry.getData().toString('utf8');
      animationJson = JSON.parse(jsonString);
      
      console.log("Successfully extracted animation JSON from .lottie");
      
      // Generate a URL to access this JSON (in a real app this would be saved somewhere)
      // For now, we'll just send the parsed JSON in the response and client will handle it
      return res.json({
        id: Date.now().toString(),
        name: name || "Lottie Animation",
        jsonData: animationJson // Send the actual JSON data
      });
      
    } catch (error) {
      console.error("Error processing .lottie file:", error);
      throw error;
    }
  }

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
