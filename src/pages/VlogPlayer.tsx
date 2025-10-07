import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, UserPlus, Send, ArrowLeft, Eye } from "lucide-react";

interface Vlog {
  id: string;
  title: string;
  description: string;
  video_url: string;
  views: number;
  user_id: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

const VlogPlayer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vlog, setVlog] = useState<Vlog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVlog();
      fetchComments();
      checkLikeStatus();
      checkFollowStatus();
      incrementViews();
    }
  }, [id, user]);

  const incrementViews = async () => {
    if (!id) return;
    await supabase.rpc("increment_vlog_views", { vlog_id: id });
  };

  const fetchVlog = async () => {
    const { data, error } = await supabase
      .from("vlogs")
      .select(`*, profiles!vlogs_user_id_fkey(name)`)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching vlog:", error);
      toast({
        title: "Error",
        description: "Failed to load vlog",
        variant: "destructive",
      });
      return;
    }

    setVlog(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("vlog_comments")
      .select(`*, profiles!vlog_comments_user_id_fkey(name)`)
      .eq("vlog_id", id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    setComments(data || []);
  };

  const checkLikeStatus = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from("vlog_likes")
      .select("id")
      .eq("vlog_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setIsLiked(!!data);

    const { count } = await supabase
      .from("vlog_likes")
      .select("*", { count: "exact", head: true })
      .eq("vlog_id", id);

    setLikeCount(count || 0);
  };

  const checkFollowStatus = async () => {
    if (!user || !vlog) return;

    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", vlog.user_id)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const toggleLike = async () => {
    if (!user) {
      toast({ title: "Please login to like vlogs" });
      return;
    }

    if (isLiked) {
      await supabase
        .from("vlog_likes")
        .delete()
        .eq("vlog_id", id)
        .eq("user_id", user.id);
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      await supabase
        .from("vlog_likes")
        .insert({ vlog_id: id, user_id: user.id });
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const toggleFollow = async () => {
    if (!user || !vlog) {
      toast({ title: "Please login to follow creators" });
      return;
    }

    if (isFollowing) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", vlog.user_id);
      setIsFollowing(false);
      toast({ title: "Unfollowed" });
    } else {
      await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: vlog.user_id });
      setIsFollowing(true);
      toast({ title: "Following!" });
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast({ title: "Please login to comment" });
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase
      .from("vlog_comments")
      .insert({
        vlog_id: id,
        user_id: user.id,
        content: newComment,
      });

    if (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
      return;
    }

    setNewComment("");
    fetchComments();
    toast({ title: "Comment posted!" });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!vlog) {
    return <div className="flex items-center justify-center min-h-screen">Vlog not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vlogs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">VlogHub</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Video Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
          <video src={vlog.video_url} controls className="w-full h-full" />
        </div>

        {/* Vlog Info */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">{vlog.title}</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{vlog.profiles?.name}</span>
              {user && vlog.user_id !== user.id && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={toggleFollow}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                {vlog.views} views
              </span>
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={toggleLike}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {likeCount}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">{vlog.description}</p>
        </div>

        {/* Comments Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Comments ({comments.length})</h3>

            {/* Add Comment */}
            {user && (
              <div className="flex gap-2 mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleComment} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{comment.profiles?.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VlogPlayer;
