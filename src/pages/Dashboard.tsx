import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Video,
  Upload,
  Heart,
  MessageCircle,
  Eye,
  Trash2,
  Edit,
  BarChart3,
  Home,
  LogOut,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Vlog {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  category_id: string | null;
}

interface VlogStats {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vlogStats, setVlogStats] = useState<VlogStats[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);

  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Edit state
  const [editingVlog, setEditingVlog] = useState<Vlog | null>(null);

  useEffect(() => {
    if (user) {
      fetchVlogs();
      fetchCategories();
      fetchAnalytics();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("vlog_categories").select("*");
    if (data) setCategories(data);
  };

  const fetchVlogs = async () => {
    const { data } = await supabase
      .from("vlogs")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) setVlogs(data);
  };

  const fetchAnalytics = async () => {
    const { data: vlogs } = await supabase
      .from("vlogs")
      .select("id, title, views")
      .eq("user_id", user?.id);

    if (!vlogs) return;

    const stats = await Promise.all(
      vlogs.map(async (vlog) => {
        const { count: likesCount } = await supabase
          .from("vlog_likes")
          .select("*", { count: "exact", head: true })
          .eq("vlog_id", vlog.id);

        const { count: commentsCount } = await supabase
          .from("vlog_comments")
          .select("*", { count: "exact", head: true })
          .eq("vlog_id", vlog.id);

        return {
          id: vlog.id,
          title: vlog.title,
          views: vlog.views,
          likes: likesCount || 0,
          comments: commentsCount || 0,
        };
      })
    );

    setVlogStats(stats);
    setTotalViews(stats.reduce((sum, s) => sum + s.views, 0));
    setTotalLikes(stats.reduce((sum, s) => sum + s.likes, 0));
    setTotalComments(stats.reduce((sum, s) => sum + s.comments, 0));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const vlogData = {
        user_id: user?.id,
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        category_id: selectedCategory || null,
      };

      if (editingVlog) {
        await supabase.from("vlogs").update(vlogData).eq("id", editingVlog.id);
        toast({ title: "Vlog updated successfully!" });
        setEditingVlog(null);
      } else {
        await supabase.from("vlogs").insert(vlogData);
        toast({ title: "Vlog uploaded successfully!" });
      }

      // Reset form
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setThumbnailUrl("");
      setSelectedCategory("");

      fetchVlogs();
      fetchAnalytics();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (vlog: Vlog) => {
    setEditingVlog(vlog);
    setTitle(vlog.title);
    setDescription(vlog.description || "");
    setVideoUrl(vlog.video_url);
    setThumbnailUrl(vlog.thumbnail_url || "");
    setSelectedCategory(vlog.category_id || "");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vlogs").delete().eq("id", id);
    toast({ title: "Vlog deleted successfully!" });
    fetchVlogs();
    fetchAnalytics();
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
              Creator Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload Vlog
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Video className="w-4 h-4 mr-2" />
              My Vlogs
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingVlog ? "Edit Vlog" : "Upload New Vlog"}
                </CardTitle>
                <CardDescription>
                  {editingVlog
                    ? "Update your vlog details"
                    : "Share your story with the world"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter vlog title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell viewers about your vlog"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video">Video URL *</Label>
                    <Input
                      id="video"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a direct link to your video file
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail URL</Label>
                    <Input
                      id="thumbnail"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isUploading}
                      className="bg-gradient-primary"
                    >
                      {isUploading
                        ? "Uploading..."
                        : editingVlog
                        ? "Update Vlog"
                        : "Upload Vlog"}
                    </Button>
                    {editingVlog && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingVlog(null);
                          setTitle("");
                          setDescription("");
                          setVideoUrl("");
                          setThumbnailUrl("");
                          setSelectedCategory("");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Vlogs Tab */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>My Vlogs ({vlogs.length})</CardTitle>
                <CardDescription>Manage your uploaded content</CardDescription>
              </CardHeader>
              <CardContent>
                {vlogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No vlogs yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start sharing your stories by uploading your first vlog!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vlogs.map((vlog) => (
                      <div
                        key={vlog.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition"
                      >
                        <img
                          src={vlog.thumbnail_url || "/placeholder.svg"}
                          alt={vlog.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{vlog.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {vlog.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {vlog.views}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(vlog.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vlog)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Vlog</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{vlog.title}"? This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(vlog.id)}
                                  className="bg-destructive"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                        <p className="text-3xl font-bold">{totalViews}</p>
                      </div>
                      <Eye className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Likes</p>
                        <p className="text-3xl font-bold">{totalLikes}</p>
                      </div>
                      <Heart className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Comments</p>
                        <p className="text-3xl font-bold">{totalComments}</p>
                      </div>
                      <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Vlog Performance</CardTitle>
                  <CardDescription>
                    Detailed analytics for each of your vlogs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vlogStats.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Upload vlogs to see analytics
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">Likes</TableHead>
                          <TableHead className="text-right">Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vlogStats.map((stat) => (
                          <TableRow key={stat.id}>
                            <TableCell className="font-medium">{stat.title}</TableCell>
                            <TableCell className="text-right">{stat.views}</TableCell>
                            <TableCell className="text-right">{stat.likes}</TableCell>
                            <TableCell className="text-right">{stat.comments}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
