import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Play, Eye, ThumbsUp, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vlog {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
  };
  vlog_likes: { id: string }[];
}

interface Category {
  id: string;
  name: string;
}

const Vlogs = () => {
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVlogs();
    fetchCategories();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("vlog_categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const fetchVlogs = async () => {
    setLoading(true);
    let query = supabase
      .from("vlogs")
      .select(`
        *,
        profiles!vlogs_user_id_fkey(name),
        vlog_likes(id)
      `)
      .order("created_at", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching vlogs:", error);
      toast({
        title: "Error",
        description: "Failed to load vlogs",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setVlogs(data || []);
    setLoading(false);
  };

  const filteredVlogs = vlogs.filter((vlog) =>
    vlog.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">VlogHub</h1>
            <div className="flex gap-2">
              {user ? (
                <>
                  <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
                  <Button variant="outline" onClick={() => navigate("/profile/" + user.id)}>
                    Profile
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate("/login")}>Login</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vlogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
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

        {/* Vlogs Grid */}
        {loading ? (
          <div className="text-center py-12">Loading vlogs...</div>
        ) : filteredVlogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No vlogs found. Be the first to create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVlogs.map((vlog) => (
              <Card
                key={vlog.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/vlog/${vlog.id}`)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-muted">
                    {vlog.thumbnail_url ? (
                      <img
                        src={vlog.thumbnail_url}
                        alt={vlog.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{vlog.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {vlog.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{vlog.profiles?.name || "Unknown"}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {vlog.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {vlog.vlog_likes?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Vlogs;
