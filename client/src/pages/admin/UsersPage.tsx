import { Shell } from "@/components/layout/Shell";
import { useUsersList, useUpdateUserRole, useCreateInvitation } from "@/hooks/use-users-admin";
import { useQuery } from "@tanstack/react-query";
import { type Program } from "@shared/schema";
import { Loader2, UserPlus, Mail, Shield, Trash2, Key } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
  const { data: users, isLoading: isUsersLoading } = useUsersList();
  const { data: programs, isLoading: isProgramsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });
  const isLoading = isUsersLoading || isProgramsLoading;
  const updateRole = useUpdateUserRole();
  const inviteMutation = useCreateInvitation();
  const { toast } = useToast();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employer");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [passwordUserName, setPasswordUserName] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole }, {
      onSuccess: (data) => {
        const link = `${window.location.origin}/register?token=${data.token}`;
        setGeneratedLink(link);
        setInviteEmail("");
      }
    });
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      alert("Link copied to clipboard!");
    }
  };

  const handleRoleChange = (userId: string, username: string, newRole: string) => {
    const roleLabels: Record<string, string> = {
      student: "Student",
      graduate: "Graduate",
      employer: "Employer",
      program_head: "Program Head",
      admin: "Admin",
    };

    if (confirm(`Are you sure you want to change the role of "${username}" to ${roleLabels[newRole] || newRole}?`)) {
      updateRole.mutate({ id: userId, role: newRole });
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/users/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: `User ${username} has been removed.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const openPasswordDialog = (userId: string, userName: string) => {
    setPasswordUserId(userId);
    setPasswordUserName(userName);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUserId || newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiRequest("PATCH", `/api/users/${passwordUserId}/password`, { newPassword });
      toast({
        title: "Password updated",
        description: `Password for ${passwordUserName} has been changed.`,
      });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage user roles and invitations.</p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              <UserPlus className="w-4 h-4" />
              Invite User
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite External User</DialogTitle>
              <DialogDescription>Generate an invitation link for an Employer or Program Head.</DialogDescription>
            </DialogHeader>

            {generatedLink ? (
              <div className="space-y-4 mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Generated Invitation Link</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this link with the user. It will allow them to register with the assigned role.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGeneratedLink(null);
                    setIsInviteOpen(false);
                  }}
                  className="w-full py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="employer@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  >
                    <option value="employer">Employer</option>
                    <option value="program_head">Program Head</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="w-full py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors mt-4"
                >
                  {inviteMutation.isPending ? "Generating..." : "Generate Invite Link"}
                </button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Program</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-secondary-foreground">
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {(u.role === 'student' || u.role === 'graduate') ? 
                        (programs?.find(p => p.id === u.programId)?.code || 'No Program') : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          u.role === 'program_head' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'employer' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, u.username || u.email || "User", e.target.value)}
                          disabled={updateRole.isPending}
                          className="text-xs border rounded px-2 py-1 bg-background hover:bg-muted cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="graduate">Graduate</option>
                          <option value="employer">Employer</option>
                          <option value="program_head">Program Head</option>
                          <option value="admin">Admin</option>
                        </select>
                        {!u.googleId && (
                          <button
                            onClick={() => openPasswordDialog(u.id, u.username || u.email || 'User')}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Change Password"
                            data-testid={`button-change-password-${u.id}`}
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username || u.email || 'User')}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Delete User"
                          data-testid={`button-delete-user-${u.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordUserName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Enter new password (min 6 characters)"
                data-testid="input-new-password"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                data-testid="button-cancel-password"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword || newPassword.length < 6}
                data-testid="button-save-password"
              >
                {isChangingPassword ? "Saving..." : "Save Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
