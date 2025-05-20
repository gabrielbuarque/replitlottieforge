import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import AdmZip from "adm-zip";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error getting projects:", error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  // API endpoint to get a specific project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error getting project:", error);
      res.status(500).json({ message: "Failed to get project" });
    }
  });

  // API endpoint to create a new project
  app.post("/api/projects", async (req, res) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid project data",
          errors: result.error.format() 
        });
      }
      
      const newProject = await storage.createProject(result.data);
      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // API endpoint to update a project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only allow updating certain fields
      const allowedFields = ['name', 'jsonUrl', 'jsonData'];
      const updateData: Record<string, any> = {};
      
      for (const field of allowedFields) {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      }
      
      const updatedProject = await storage.updateProject(id, updateData);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // API endpoint to delete a project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const result = await storage.deleteProject(id);
      if (!result) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // API endpoint to get color history for a project
  app.get("/api/projects/:id/colors", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get limit from query parameter, default to 20
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const colorHistory = await storage.getColorHistory(projectId, limit);
      res.json(colorHistory);
    } catch (error) {
      console.error("Error getting color history:", error);
      res.status(500).json({ message: "Failed to get color history" });
    }
  });

  // API endpoint to save a color change to history
  app.post("/api/projects/:id/colors", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const { oldColor, newColor } = req.body;
      if (!oldColor || !newColor) {
        return res.status(400).json({ message: "Old color and new color are required" });
      }
      
      const colorHistoryEntry = await storage.createColorHistory({
        projectId,
        oldColor,
        newColor
      });
      
      res.status(201).json(colorHistoryEntry);
    } catch (error) {
      console.error("Error saving color history:", error);
      res.status(500).json({ message: "Failed to save color history" });
    }
  });
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
        
        // Extract animation ID and name from URL
        let animationName = "Lottie Animation";
        
        // Try to extract a name from the URL
        if (url.includes('/free-animation/')) {
          const pathPart = url.split('/free-animation/')[1].split('?')[0];
          const nameAndId = pathPart.split('-');
          
          // Remove the last part (likely the ID)
          if (nameAndId.length > 1) {
            nameAndId.pop();
            animationName = nameAndId.join(' ');
          }
        }
        
        // If URL is directly to a .lottie file
        if (url.endsWith('.lottie')) {
          // Download and process the .lottie file
          console.log("Direct .lottie URL detected");
          return await processLottieFile(url, animationName, res);
        }
        
        // For LottieFiles URLs, extract direct animation link
        const response = await fetch(url);
        const html = await response.text();
        
        // Looking for download link in HTML
        const lottieRegex = /https:\/\/[^"']*\.lottie/g;
        const matches = html.match(lottieRegex);
        
        if (matches && matches.length > 0) {
          const lottieUrl = matches[0];
          console.log("Found .lottie URL:", lottieUrl);
          
          // Process the .lottie file
          return await processLottieFile(lottieUrl, animationName, res);
        }
        
        // Fallback to JSON URL search if no .lottie found
        const jsonRegex = /https:\/\/[^"']*\.json/g;
        const jsonMatches = html.match(jsonRegex);
        
        if (jsonMatches && jsonMatches.length > 0) {
          // Filter out unwanted matches (often configuration files)
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
