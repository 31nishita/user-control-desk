import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VlogCard } from "@/components/VlogCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Video, Search, LogOut, User, Upload } from "lucide-react";

interface Vlog {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  user_id: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const Index = () => {
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchVlogs();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("vlog_categories").select("*");
    if (data) setCategories(data);
  };

  const fetchVlogs = async () => {
    setLoading(true);
    let query = supabase
      .from("vlogs")
      .select("*, vlog_categories(name)")
      .order("created_at", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    if (data) setVlogs(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              VlogHub
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Vlog
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Button>
                <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-primary"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Search and Filter Section */}
      <div className="bg-card/30 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vlogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Vlogs Grid */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading vlogs...</p>
          </div>
        ) : vlogs.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No vlogs found</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your story!
            </p>
            {user && (
              <Button onClick={() => navigate("/dashboard")} className="bg-gradient-primary">
                Upload Your First Vlog
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vlogs.map((vlog) => (
              <VlogCard
                key={vlog.id}
                id={vlog.id}
                title={vlog.title}
                description={vlog.description || ""}
                thumbnail_url={vlog.thumbnail_url || ""}
                views={vlog.views}
                created_at={vlog.created_at}
                user_id={vlog.user_id}
                category={(vlog as any).vlog_categories?.name}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
