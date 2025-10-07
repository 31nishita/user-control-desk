import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Video } from "lucide-react";

interface Profile {
  name: string;
  email: string;
}

interface Vlog {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
}

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, totalViews: 0 });

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchVlogs();
      fetchStats();
    }
  }, [id]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  };

  const fetchVlogs = async () => {
    const { data, error } = await supabase
      .from("vlogs")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vlogs:", error);
      return;
    }

    setVlogs(data || []);
  };

  const fetchStats = async () => {
    const { count: followersCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", id);

    const { count: followingCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id);

    const { data: vlogData } = await supabase
      .from("vlogs")
      .select("views")
      .eq("user_id", id);

    const totalViews = vlogData?.reduce((sum, v) => sum + v.views, 0) || 0;

    setStats({
      followers: followersCount || 0,
      following: followingCount || 0,
      totalViews,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vlogs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{profile?.name}</h2>
                <p className="text-muted-foreground mb-4">{profile?.email}</p>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{vlogs.length}</div>
                    <div className="text-sm text-muted-foreground">Vlogs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.followers}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.following}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalViews}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vlogs Grid */}
        <Tabs defaultValue="vlogs">
          <TabsList>
            <TabsTrigger value="vlogs">
              <Video className="h-4 w-4 mr-2" />
              Vlogs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="vlogs" className="mt-6">
            {vlogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No vlogs yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vlogs.map((vlog) => (
                  <Card
                    key={vlog.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/vlog/${vlog.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-video bg-muted">
                        {vlog.thumbnail_url ? (
                          <img
                            src={vlog.thumbnail_url}
                            alt={vlog.title}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold line-clamp-1">{vlog.title}</h3>
                        <p className="text-sm text-muted-foreground">{vlog.views} views</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
