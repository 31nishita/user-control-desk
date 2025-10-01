import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Search, Mail, Phone, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  phone?: string;
  joinDate: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const notifyUserStats = (usersList: User[]) => {
    try {
      const total = usersList.length;
      const active = usersList.filter((u) => u.status === "active").length;
      window.dispatchEvent(
        new CustomEvent("users:changed", { detail: { total, active } })
      );
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        // Demo mode - use mock data
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'manager',
            status: 'active',
            phone: '+1-555-0123',
            joinDate: '2024-01-15'
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'user',
            status: 'active',
            phone: '+1-555-0124',
            joinDate: '2024-02-20'
          },
          {
            id: '3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            role: 'admin',
            status: 'inactive',
            phone: '+1-555-0125',
            joinDate: '2024-03-10'
          }
        ];
        setUsers(mockUsers);
        notifyUserStats(mockUsers);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name,
        email: row.email,
        role: row.role || "user",
        status: row.status || "active",
        phone: row.phone || undefined,
        joinDate: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      }));
      setUsers(formattedUsers);
      notifyUserStats(formattedUsers);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (userId: string) => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        // Demo mode - just remove from local state
        const updated = users.filter((user) => user.id !== userId);
        setUsers(updated);
        notifyUserStats(updated);
        toast({
          title: "User Deleted",
          description: "User has been successfully removed from the system.",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      const updated = users.filter((user) => user.id !== userId);
      setUsers(updated);
      notifyUserStats(updated);
      toast({
        title: "User Deleted",
        description: "User has been successfully removed from the system.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (!editingUser) return;

    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        // Demo mode - just update local state
        const updated = users.map((user) =>
          user.id === editingUser.id ? { ...user, ...userData } : user
        );
        setUsers(updated);
        notifyUserStats(updated);
        toast({
          title: "User Updated",
          description: "User information has been successfully updated.",
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      const updated = users.map((user) =>
        user.id === editingUser.id ? { ...user, ...userData } : user
      );
      setUsers(updated);
      notifyUserStats(updated);
      toast({
        title: "User Updated",
        description: "User information has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async (userData: Omit<User, "id">) => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        // Demo mode - just add to local state
        const newUser: User = {
          id: String(Date.now()), // Generate a simple ID
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          phone: userData.phone,
          joinDate: new Date().toISOString().split("T")[0],
        };
        const updated = [newUser, ...users];
        setUsers(updated);
        notifyUserStats(updated);
        toast({
          title: "User Added",
          description: "New user has been successfully added.",
        });
        setIsAddDialogOpen(false);
        return;
      }

      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: Math.random().toString(36).slice(-8) + "A1!", // Generate temp password
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: userData.name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Then create/update the profile
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          user_id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          phone: userData.phone,
        })
        .select()
        .single();

      if (error) throw error;

      const newUser: User = {
        id: String(data.id),
        name: data.name,
        email: data.email,
        role: data.role || "user",
        status: data.status || "active",
        phone: data.phone || undefined,
        joinDate: data.created_at ? new Date(data.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      };
      const updated = [newUser, ...users];
      setUsers(updated);
      notifyUserStats(updated);
      toast({
        title: "User Added",
        description: "New user has been successfully added. A temporary password has been generated.",
      });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-glow transition-spring">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <UserDialog
                title="Add New User"
                description="Create a new user account with role and permissions"
                onSave={handleAddUser}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-smooth focus:ring-primary/20 focus:shadow-glow"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-gradient-card border-border/50 shadow-card hover:shadow-elegant transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="w-fit">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="transition-smooth hover:shadow-glow"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-smooth"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {editingUser && (
          <UserDialog
            title="Edit User"
            description="Update user information and permissions"
            user={editingUser}
            onSave={handleSaveUser}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
};

interface UserDialogProps {
  title: string;
  description: string;
  user?: User;
  onSave: (userData: any) => void;
  onCancel: () => void;
}

const UserDialog = ({ title, description, user, onSave, onCancel }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "Employee",
    status: user?.status || "active",
    joinDate: user?.joinDate || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="bg-gradient-card border-border/50 shadow-elegant">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="transition-smooth focus:ring-primary/20"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="transition-smooth focus:ring-primary/20"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="transition-smooth focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="joinDate">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              className="transition-smooth focus:ring-primary/20"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className="transition-smooth focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="transition-smooth focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-4">
          <Button
            type="submit"
            className="bg-gradient-primary hover:shadow-glow transition-spring flex-1"
          >
            {user ? "Update User" : "Add User"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="transition-smooth"
          >
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default UserManagement;