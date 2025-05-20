import fetch from "node-fetch";
import * as cheerio from "cheerio";
import AdmZip from "adm-zip";

export async function extractLottieFromUrl(url: string) {
  try {
    // Fetch the webpage content
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse with cheerio
    const $ = cheerio.load(html);
    
    // Try to find lottie player and get its source
    const lottiePlayer = $("dotlottie-player, lottie-player");
    
    if (lottiePlayer.length === 0) {
      throw new Error("No Lottie animation found on this page");
    }
    
    const src = lottiePlayer.attr("src");
    
    if (!src) {
      throw new Error("Lottie animation source not found");
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
    return {
      id: Date.now().toString(),
      name,
      jsonUrl: src
    };
  } catch (error) {
    console.error("Error extracting Lottie:", error);
    throw new Error("Failed to extract Lottie animation");
  }
}

export async function createLottiePackage(jsonData: any, name: string) {
  try {
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
    return zip.toBuffer();
  } catch (error) {
    console.error("Error creating .lottie package:", error);
    throw new Error("Failed to create .lottie package");
  }
}
