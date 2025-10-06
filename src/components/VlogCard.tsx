import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Eye, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface VlogCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  user_id: string;
  category?: string;
}

export const VlogCard = ({
  id,
  title,
  description,
  thumbnail_url,
  views,
  created_at,
  user_id,
  category,
}: VlogCardProps) => {
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [creatorName, setCreatorName] = useState("Unknown");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchCreatorName();
  }, [id, user_id]);

  const fetchStats = async () => {
    const { data: likes } = await supabase
      .from("vlog_likes")
      .select("*", { count: "exact" })
      .eq("vlog_id", id);

    const { data: comments } = await supabase
      .from("vlog_comments")
      .select("*", { count: "exact" })
      .eq("vlog_id", id);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userLike } = await supabase
        .from("vlog_likes")
        .select("*")
        .eq("vlog_id", id)
        .eq("user_id", user.id)
        .single();
      
      setIsLiked(!!userLike);
    }

    setLikesCount(likes?.length || 0);
    setCommentsCount(comments?.length || 0);
  };

  const fetchCreatorName = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user_id)
      .single();
    
    if (data?.name) {
      setCreatorName(data.name);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to like vlogs",
        variant: "destructive",
      });
      return;
    }

    if (isLiked) {
      await supabase
        .from("vlog_likes")
        .delete()
        .eq("vlog_id", id)
        .eq("user_id", user.id);
      
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      await supabase
        .from("vlog_likes")
        .insert({ vlog_id: id, user_id: user.id });
      
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-smooth hover:shadow-elegant hover:-translate-y-1"
      onClick={() => navigate(`/vlog/${id}`)}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={thumbnail_url || "/placeholder.svg"}
          alt={title}
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
        {category && (
          <Badge className="absolute top-2 right-2 bg-gradient-primary">
            {category}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{creatorName}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 hover-scale"
            onClick={handleLike}
          >
            <Heart
              className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
            />
            <span className="text-xs">{likesCount}</span>
          </Button>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">{commentsCount}</span>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span className="text-xs">{views}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
