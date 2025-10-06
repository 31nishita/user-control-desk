import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Eye,
  Share2,
  ArrowLeft,
  Send,
  UserPlus,
  UserMinus,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { name: string } | null;
}

const VlogPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [vlog, setVlog] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVlog();
      fetchComments();
      incrementViews();
    }
  }, [id]);

  const fetchVlog = async () => {
    const { data: vlogData } = await supabase
      .from("vlogs")
      .select("*, vlog_categories(name)")
      .eq("id", id)
      .single();

    if (vlogData) {
      setVlog(vlogData);
      
      // Fetch creator profile
      const { data: creatorData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", vlogData.user_id)
        .single();
      
      setCreator(creatorData);

      // Check if user liked this vlog
      if (user) {
        const { data: likeData } = await supabase
          .from("vlog_likes")
          .select("*")
          .eq("vlog_id", id)
          .eq("user_id", user.id)
          .single();
        
        setIsLiked(!!likeData);

        // Check if following creator
        const { data: followData } = await supabase
          .from("user_follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", vlogData.user_id)
          .single();
        
        setIsFollowing(!!followData);
      }

      // Get likes count
      const { count } = await supabase
        .from("vlog_likes")
        .select("*", { count: "exact", head: true })
        .eq("vlog_id", id);
      
      setLikesCount(count || 0);
    }

    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("vlog_comments")
      .select("*, profiles(name)")
      .eq("vlog_id", id)
      .order("created_at", { ascending: false });

    if (data) setComments(data);
  };

  const incrementViews = async () => {
    await supabase.rpc("increment_vlog_views", { vlog_id: id });
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      return;
    }

    if (isLiked) {
      await supabase
        .from("vlog_likes")
        .delete()
        .eq("vlog_id", id)
        .eq("user_id", user.id);
      
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from("vlog_likes").insert({ vlog_id: id, user_id: user.id });
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleFollow = async () => {
    if (!user || !vlog) return;

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

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    await supabase.from("vlog_comments").insert({
      vlog_id: id,
      user_id: user.id,
      content: newComment,
    });

    setNewComment("");
    fetchComments();
    toast({ title: "Comment added!" });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied to clipboard!" });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!vlog) {
    return <div className="min-h-screen flex items-center justify-center">Vlog not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={vlog.video_url}
                controls
                className="w-full h-full"
                poster={vlog.thumbnail_url}
              />
            </div>

            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{vlog.title}</h1>
                  {vlog.vlog_categories && (
                    <Badge className="bg-gradient-primary mb-2">
                      {vlog.vlog_categories.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  className="gap-2"
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {likesCount}
                </Button>

                <Button variant="outline" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {comments.length}
                </Button>

                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  {vlog.views}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              <Separator />

              {/* Creator Info */}
              <div className="flex items-center justify-between py-4">
                <Link
                  to={`/profile/${vlog.user_id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition"
                >
                  <Avatar>
                    <AvatarFallback>
                      {creator?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{creator?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(vlog.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </Link>

                {user && user.id !== vlog.user_id && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className={!isFollowing ? "bg-gradient-primary" : ""}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>

              <Separator />

              <div className="py-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{vlog.description}</p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">
                  Comments ({comments.length})
                </h3>

                {user && (
                  <form onSubmit={handleComment} className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button type="submit" size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {comment.profiles?.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {comment.profiles?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VlogPlayer;
