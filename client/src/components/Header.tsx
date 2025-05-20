import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <a className="text-2xl font-bold text-primary">LottieForge</a>
          </Link>
          <span className="text-sm px-2 py-1 bg-accent/10 text-accent rounded">Beta</span>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/projects">
                <a className={`text-gray-700 hover:text-accent transition-colors ${location === "/projects" ? "text-accent" : ""}`}>
                  Projects
                </a>
              </Link>
            </li>
            <li>
              <a href="https://github.com/yourusername/lottieforge" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="text-gray-700 hover:text-accent transition-colors">
                Documentation
              </a>
            </li>
            <li>
              <button className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors">
                Sign In
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
