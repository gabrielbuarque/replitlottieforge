import ImportSection from "@/components/ImportSection";
import ProjectsSection from "@/components/ProjectsSection";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <Helmet>
        <title>LottieForge - Edit Lottie Animations</title>
        <meta name="description" content="Import, edit, and customize Lottie animations. Change colors, export to different formats, and manage your animation projects easily." />
      </Helmet>
      
      <ImportSection />
      <ProjectsSection />
    </div>
  );
}
