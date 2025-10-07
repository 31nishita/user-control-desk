import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Video, Users, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            VlogHub
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-300">
            Share your story, inspire the world
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join our community of creators and viewers. Upload your vlogs, discover amazing content, and connect with people who share your passions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={() => navigate("/vlogs")}
              size="lg"
              className="text-lg px-8"
            >
              Explore Vlogs
            </Button>
            <Button 
              onClick={() => navigate("/login")}
              size="lg"
              variant="outline"
              className="text-lg px-8"
            >
              Start Creating
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
            <Video className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-xl font-semibold mb-2">Create & Upload</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your vlogs with ease and share them with the world
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
            <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-2">Build Community</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with followers and fellow creators
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-pink-600" />
            <h3 className="text-xl font-semibold mb-2">Grow Your Audience</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your views, likes, and engagement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
