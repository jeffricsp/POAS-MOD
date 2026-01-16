import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Send, Check, Clock } from "lucide-react";
import type { Notification, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "announcement" as "survey_reminder" | "announcement" | "grade_posted",
    title: "",
    message: "",
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: notifications = [], isLoading, isError } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/notifications/bulk", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setIsCreateOpen(false);
      setFormData({ type: "announcement", title: "", message: "" });
      setSelectedUsers([]);
      toast({ title: "Notifications sent successfully" });
    },
    onError: () => toast({ title: "Failed to send notifications", variant: "destructive" }),
  });

  const handleSend = () => {
    if (!formData.title || !formData.message || selectedUsers.length === 0) {
      toast({ title: "Please fill in all fields and select recipients", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      userIds: selectedUsers,
      type: formData.type,
      title: formData.title,
      message: formData.message,
    });
  };

  const selectAllByRole = (role: string) => {
    const roleUsers = users.filter((u) => (u as any).role === role).map((u) => u.id);
    setSelectedUsers(Array.from(new Set([...selectedUsers, ...roleUsers])));
  };

  const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "program_head";

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Failed to load notifications. Please try again.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Notifications</h1>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-send-notification">
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="select-notification-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="survey_reminder">Survey Reminder</SelectItem>
                      <SelectItem value="grade_posted">Grade Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notification title"
                    data-testid="input-notification-title"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter your message..."
                    data-testid="input-notification-message"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Recipients</Label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Button type="button" size="sm" variant="outline" onClick={() => selectAllByRole("student")}>
                      All Students
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => selectAllByRole("graduate")}>
                      All Graduates
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => selectAllByRole("employer")}>
                      All Employers
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`user-${u.id}`}
                          checked={selectedUsers.includes(u.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, u.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== u.id));
                            }
                          }}
                          data-testid={`checkbox-user-${u.id}`}
                        />
                        <Label htmlFor={`user-${u.id}`} className="text-sm">
                          {u.email || u.firstName || u.id} ({u.role})
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedUsers.length} recipient(s) selected
                  </p>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={createMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-send"
                >
                  {createMutation.isPending ? "Sending..." : "Send Notification"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.isRead ? "opacity-60" : ""}
              data-testid={`card-notification-${notification.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {notification.isRead ? (
                      <Check className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Bell className="w-4 h-4 text-primary" />
                    )}
                    {notification.title}
                  </CardTitle>
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markReadMutation.mutate(notification.id)}
                      data-testid={`button-mark-read-${notification.id}`}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{notification.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {notification.createdAt &&
                    formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Shell>
  );
}
