import { apiRequest } from "./queryClient";

interface LottieMetadata {
  id: string;
  name: string;
  jsonUrl: string;
}

export async function extractLottieFromUrl(url: string): Promise<LottieMetadata> {
  try {
    const response = await apiRequest('POST', '/api/extract-lottie', { url });
    return await response.json();
  } catch (error) {
    console.error('Error extracting Lottie:', error);
    throw new Error('Failed to extract Lottie animation. Please ensure the URL is valid.');
  }
}

export async function getLottieJsonData(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Lottie JSON: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Lottie JSON:', error);
    throw new Error('Failed to load Lottie animation data.');
  }
}

// Convert a Lottie JSON object to a .lottie file (ZIP)
export async function convertJsonToLottie(jsonData: any, name: string): Promise<Blob> {
  try {
    const response = await apiRequest('POST', '/api/create-lottie-package', { 
      jsonData,
      name
    });
    return await response.blob();
  } catch (error) {
    console.error('Error creating .lottie package:', error);
    throw new Error('Failed to create .lottie package.');
  }
}

// Function to generate HTML embed code
export function generateEmbedCode(jsonUrl: string, width = 300, height = 300): string {
  return `<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
<lottie-player 
  src="${jsonUrl}"  
  background="transparent"  
  speed="1"  
  style="width: ${width}px; height: ${height}px;" 
  loop  
  autoplay>
</lottie-player>`;
}
