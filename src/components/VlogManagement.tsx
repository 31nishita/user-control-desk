import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Video, Upload, Trash2, Edit, Eye } from "lucide-react";

interface Vlog {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

const VlogManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingVlog, setEditingVlog] = useState<Vlog | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    video_file: null as File | null,
    thumbnail_file: null as File | null,
  });

  useEffect(() => {
    fetchVlogs();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("vlog_categories")
      .select("*")
      .order("name");

    if (!error) {
      setCategories(data || []);
    }
  };

  const fetchVlogs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("vlogs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vlogs:", error);
      return;
    }

    setVlogs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);

    try {
      let video_url = editingVlog?.video_url || "";
      let thumbnail_url = editingVlog?.thumbnail_url || "";

      // Upload video if provided
      if (formData.video_file) {
        const videoPath = `${user.id}/${Date.now()}_${formData.video_file.name}`;
        const { error: videoError } = await supabase.storage
          .from("vlogs")
          .upload(videoPath, formData.video_file);

        if (videoError) throw videoError;

        const { data: videoData } = supabase.storage
          .from("vlogs")
          .getPublicUrl(videoPath);
        video_url = videoData.publicUrl;
      }

      // Upload thumbnail if provided
      if (formData.thumbnail_file) {
        const thumbPath = `${user.id}/thumb_${Date.now()}_${formData.thumbnail_file.name}`;
        const { error: thumbError } = await supabase.storage
          .from("vlogs")
          .upload(thumbPath, formData.thumbnail_file);

        if (thumbError) throw thumbError;

        const { data: thumbData } = supabase.storage
          .from("vlogs")
          .getPublicUrl(thumbPath);
        thumbnail_url = thumbData.publicUrl;
      }

      if (editingVlog) {
        // Update existing vlog
        const { error } = await supabase
          .from("vlogs")
          .update({
            title: formData.title,
            description: formData.description,
            category_id: formData.category_id || null,
            video_url,
            thumbnail_url,
          })
          .eq("id", editingVlog.id);

        if (error) throw error;

        toast({ title: "Vlog updated successfully!" });
      } else {
        // Create new vlog
        const { error } = await supabase.from("vlogs").insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id || null,
          video_url,
          thumbnail_url,
        });

        if (error) throw error;

        toast({ title: "Vlog uploaded successfully!" });
      }

      resetForm();
      fetchVlogs();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error uploading vlog:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload vlog",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vlog?")) return;

    const { error } = await supabase.from("vlogs").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete vlog",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Vlog deleted successfully" });
    fetchVlogs();
  };

  const handleEdit = (vlog: Vlog) => {
    setEditingVlog(vlog);
    setFormData({
      title: vlog.title,
      description: vlog.description,
      category_id: vlog.category_id || "",
      video_file: null,
      thumbnail_file: null,
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingVlog(null);
    setFormData({
      title: "",
      description: "",
      category_id: "",
      video_file: null,
      thumbnail_file: null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Vlogs
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Vlog
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVlog ? "Edit Vlog" : "Upload New Vlog"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter vlog title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your vlog"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                <div>
                  <Label>Video File {!editingVlog && <span className="text-destructive">*</span>}</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    required={!editingVlog}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        video_file: e.target.files?.[0] || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Thumbnail (optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thumbnail_file: e.target.files?.[0] || null,
                      })
                    }
                  />
                </div>
                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? "Uploading..." : editingVlog ? "Update Vlog" : "Upload Vlog"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {vlogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vlogs yet. Upload your first vlog!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vlogs.map((vlog) => (
              <div
                key={vlog.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                  {vlog.thumbnail_url ? (
                    <img
                      src={vlog.thumbnail_url}
                      alt={vlog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{vlog.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {vlog.description}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {vlog.views} views
                    </span>
                    <span>{new Date(vlog.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(vlog)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(vlog.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VlogManagement;
