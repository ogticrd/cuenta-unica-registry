"use client";

import { Play } from "lucide-react";
import { useState } from "react";

interface YouTubeVideoProps {
  videoId?: string;
  title?: string;
  className?: string;
}

export function YouTubeVideo({
  videoId = "dQw4w9WgXcQ",
  title = "Cuenta Única Ciudadana - Tutorial",
  className = "",
}: YouTubeVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    // In a real implementation, this would load the actual YouTube video
    console.log("Playing video:", videoId);
  };

  if (isPlaying) {
    return (
      <div
        className={`relative w-full aspect-video bg-black rounded-lg ${className}`}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`relative w-full aspect-video bg-black rounded-lg cursor-pointer group ${className}`}
      onClick={handlePlay}
    >
      {/* YouTube-style thumbnail */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-red-700 transition-colors">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
            </div>
            <span className="text-white text-xl font-semibold">YouTube</span>
          </div>
        </div>
      </div>

      {/* Video title overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm text-left">
          {title}
        </div>
      </div>
    </button>
  );
}
