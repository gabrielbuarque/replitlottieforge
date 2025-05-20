import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Add LottiePlayer web component
import "@lottiefiles/lottie-player";

createRoot(document.getElementById("root")!).render(<App />);
