export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} LottieForge. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-accent transition-colors">
              <i className="fab fa-github"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-accent transition-colors">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-accent transition-colors">
              <i className="fab fa-discord"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
