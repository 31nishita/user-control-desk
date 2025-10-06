import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VlogCard } from "@/components/VlogCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, UserMinus, Video, Users } from "lucide-react";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [vlogs, setVlogs] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchVlogs();
      fetchFollowStats();
    }
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data);

      // Check if current user is following this profile
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from("user_follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .single();

        setIsFollowing(!!followData);
      }
    }

    setLoading(false);
  };

  const fetchVlogs = async () => {
    const { data } = await supabase
      .from("vlogs")
      .select("*, vlog_categories(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setVlogs(data);
  };

  const fetchFollowStats = async () => {
    const { count: followers } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: following } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const handleFollow = async () => {
    if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      return;
    }

    if (isFollowing) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      setIsFollowing(false);
      setFollowersCount((prev) => prev - 1);
      toast({ title: "Unfollowed" });
    } else {
      await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: userId });

      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
      toast({ title: "Following!" });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Profile not found</div>;
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-3xl">
                  {profile.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{profile.name || "Unknown User"}</h1>
                {profile.email && (
                  <p className="text-muted-foreground mb-4">{profile.email}</p>
                )}

                <div className="flex items-center gap-6 justify-center md:justify-start mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{vlogs.length}</p>
                    <p className="text-sm text-muted-foreground">Vlogs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{followersCount}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{followingCount}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                </div>

                {!isOwnProfile && user && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
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

                {isOwnProfile && (
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-gradient-primary"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="vlogs" className="w-full">
          <TabsList className="grid w-full grid-cols-1 max-w-md">
            <TabsTrigger value="vlogs">
              <Video className="w-4 h-4 mr-2" />
              Vlogs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vlogs" className="mt-6">
            {vlogs.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No vlogs yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "Upload your first vlog!" : "No vlogs from this creator yet."}
                </p>
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
                    category={vlog.vlog_categories?.name}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
