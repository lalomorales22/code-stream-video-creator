import React from 'react';
import { Film, Play, Mic, Captions, Share2, Code, Zap, ExternalLink, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="p-4 border-2 border-white rounded-xl">
              <Film className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-7xl md:text-8xl font-bold text-white tracking-tight">
              CodeStream
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-gray-300 font-medium mb-8 leading-relaxed">
            Transform your code into stunning vertical videos with
            <br />
            <span className="text-white font-bold">AI narration, captions, and professional quality</span>
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-black border-2 border-white rounded-lg p-6 hover:bg-white hover:text-black transition-all duration-300 group">
              <Zap className="w-8 h-8 mx-auto mb-3 group-hover:text-black" />
              <h3 className="font-bold text-lg mb-2">Ultra-Fast Streaming</h3>
              <p className="text-sm opacity-80">Revolutionary speed controls from detailed tutorials to ludicrous speed</p>
            </div>
            
            <div className="bg-black border-2 border-white rounded-lg p-6 hover:bg-white hover:text-black transition-all duration-300 group">
              <Mic className="w-8 h-8 mx-auto mb-3 group-hover:text-black" />
              <h3 className="font-bold text-lg mb-2">AI Narration</h3>
              <p className="text-sm opacity-80">Professional voice synthesis with contextual script generation</p>
            </div>
            
            <div className="bg-black border-2 border-white rounded-lg p-6 hover:bg-white hover:text-black transition-all duration-300 group">
              <Captions className="w-8 h-8 mx-auto mb-3 group-hover:text-black" />
              <h3 className="font-bold text-lg mb-2">Smart Captions</h3>
              <p className="text-sm opacity-80">Automatically generated and synchronized captions with custom styling</p>
            </div>
            
            <div className="bg-black border-2 border-white rounded-lg p-6 hover:bg-white hover:text-black transition-all duration-300 group">
              <Share2 className="w-8 h-8 mx-auto mb-3 group-hover:text-black" />
              <h3 className="font-bold text-lg mb-2">Social Ready</h3>
              <p className="text-sm opacity-80">Perfect 9:16 format for TikTok, Instagram, YouTube Shorts, and X</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onEnterApp}
            className="group bg-white hover:bg-gray-200 text-black px-12 py-6 rounded-xl font-bold text-2xl 
                     transition-all duration-300 border-4 border-white hover:scale-105 flex items-center gap-4 mx-auto
                     shadow-lg hover:shadow-2xl"
          >
            <Play className="w-8 h-8" />
            Launch CodeStream
            <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform duration-300" />
          </button>

          <p className="text-gray-400 mt-6 text-lg">
            No installation required • Works in your browser • Free to use
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 border-t-2 border-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-white">
            From Code to Social Media in Minutes
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Features */}
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="p-3 border-2 border-white rounded-lg flex-shrink-0">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Upload Your Code</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Support for 15+ programming languages with smart syntax highlighting and language detection.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-3 border-2 border-white rounded-lg flex-shrink-0">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Record Streaming Animation</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Watch your code appear character by character with ultra-fast customizable speed controls.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-3 border-2 border-white rounded-lg flex-shrink-0">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">AI-Powered FullClip Studio</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Generate contextual narration, add professional voice synthesis, custom avatars, and synchronized captions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-3 border-2 border-white rounded-lg flex-shrink-0">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Share Everywhere</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Download high-quality MP4 videos optimized for all social media platforms with built-in sharing tools.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="bg-black border-2 border-white rounded-xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                
                {/* Mock Code Display */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-white font-bold ml-4">CodeStream Demo</span>
                  </div>
                  
                  <div className="font-mono text-sm space-y-2">
                    <div className="flex">
                      <span className="text-gray-400 w-8">1</span>
                      <span className="text-blue-400">function</span>
                      <span className="text-white"> </span>
                      <span className="text-yellow-400">createVideo</span>
                      <span className="text-white">(</span>
                      <span className="text-orange-400">code</span>
                      <span className="text-white">) {'{'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-400 w-8">2</span>
                      <span className="text-white">  </span>
                      <span className="text-blue-400">const</span>
                      <span className="text-white"> video = </span>
                      <span className="text-green-400">"amazing"</span>
                      <span className="text-white">;</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-400 w-8">3</span>
                      <span className="text-white">  </span>
                      <span className="text-blue-400">return</span>
                      <span className="text-white"> video;</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-400 w-8">4</span>
                      <span className="text-white">{'}'}</span>
                      <span className="text-white bg-white w-1 h-4 ml-1 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-bold">Recording...</span>
                    </div>
                    <div className="text-gray-400 text-sm">720p • 30fps • MP4</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 px-6 border-t-2 border-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-black border-2 border-white rounded-lg p-8">
              <div className="text-4xl font-bold text-white mb-2">15+</div>
              <div className="text-gray-300 text-lg">Programming Languages</div>
            </div>
            <div className="bg-black border-2 border-white rounded-lg p-8">
              <div className="text-4xl font-bold text-white mb-2">720p</div>
              <div className="text-gray-300 text-lg">High-Quality Video</div>
            </div>
            <div className="bg-black border-2 border-white rounded-lg p-8">
              <div className="text-4xl font-bold text-white mb-2">9:16</div>
              <div className="text-gray-300 text-lg">Perfect Vertical Format</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 px-6 border-t-2 border-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-8">
            Ready to Create Amazing Code Videos?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join developers worldwide who are creating engaging content with CodeStream.
            <br />
            No sign-up required. Start creating in seconds.
          </p>
          
          <button
            onClick={onEnterApp}
            className="group bg-white hover:bg-gray-200 text-black px-16 py-6 rounded-xl font-bold text-3xl 
                     transition-all duration-300 border-4 border-white hover:scale-105 flex items-center gap-6 mx-auto
                     shadow-2xl hover:shadow-white/20"
          >
            <Film className="w-10 h-10" />
            Start Creating Now
            <ArrowRight className="w-10 h-10 group-hover:translate-x-3 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Built with Bolt Footer */}
      <footer className="py-8 px-6 border-t-2 border-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-gray-400 text-lg mb-4 md:mb-0">
            © 2025 CodeStream. Transform code into content.
          </div>
          
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-black border-2 border-white text-white px-6 py-3 rounded-lg 
                     font-bold text-lg transition-all duration-200 hover:bg-white hover:text-black hover:scale-105
                     shadow-lg backdrop-blur-sm"
          >
            <span className="text-2xl">⚡</span>
            Built with Bolt
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;