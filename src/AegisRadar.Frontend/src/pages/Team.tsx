import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Shield, Eye, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { TeamMemberDto } from "@/types/api";
import { toast } from "sonner";

type Role = "Admin" | "Analyst" | "Viewer";

export default function Team() {
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("Analyst");

  // Form states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Analyst");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.team.getMembers();
      setMembers(data);
    } catch (error) {
      toast.error("Failed to load team members");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteCompany) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.team.inviteMember({
        email: inviteEmail,
        companyName: inviteCompany,
        role: inviteRole,
      });
      toast.success("Team member invited successfully! (Email service requires configuration)");
      setInviteEmail("");
      setInviteCompany("");
      setInviteRole("Analyst");
      setIsInviteOpen(false);
      await loadMembers();
    } catch (error: any) {
      toast.error(error.message || "Failed to invite team member. Please try again.");
      console.error("Invite error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string) => {
    if (!editRole) {
      toast.error("Please select a role");
      return;
    }
    try {
      await apiClient.team.updateMemberRole(memberId, { role: editRole });
      toast.success("Role updated successfully");
      setIsEditing(null);
      await loadMembers();
    } catch (error) {
      toast.error("Failed to update role. Please check the console for details.");
      console.error("Role update error:", error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Shield className="w-4 h-4" />;
      case "Analyst":
        return <Users className="w-4 h-4" />;
      case "Viewer":
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Analyst":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "pending_invite") {
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
    return "bg-green-500/20 text-green-400 border-green-500/30";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Team Management</h1>
            <p className="text-slate-400">Manage team members and permissions</p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>Add a new member to your team. (Email notifications require SMTP configuration)</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-slate-900/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Company Name
                  </label>
                  <Input
                    value={inviteCompany}
                    onChange={(e) => setInviteCompany(e.target.value)}
                    placeholder="Company Name"
                    className="bg-slate-900/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Role
                  </label>
                  <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as Role)}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Analyst">Analyst</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Members Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({members.length})
            </CardTitle>
            <CardDescription>All users in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Name / Email</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{member.email}</span>
                          <span className="text-xs text-slate-500">{member.id.substring(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{member.companyName}</td>
                      <td className="px-4 py-3">
                        {isEditing === member.id ? (
                          <Select value={editRole} onValueChange={(val) => setEditRole(val as Role)}>
                            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Analyst">Analyst</SelectItem>
                              <SelectItem value="Viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1">{member.role}</span>
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadge(member.status)}>
                          {member.status === "pending_invite" ? "Pending" : "Active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isEditing === member.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateRole(member.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsEditing(null)}
                                className="border-slate-600"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsEditing(member.id);
                                  setEditRole(member.role as Role);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Info */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-white">Admin</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✓ Full access</li>
                  <li>✓ Manage team</li>
                  <li>✓ Configure settings</li>
                  <li>✓ API keys</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-white">Analyst</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✓ View analytics</li>
                  <li>✓ Review transactions</li>
                  <li>✓ Export reports</li>
                  <li>✗ Manage team</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-white">Viewer</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✓ View dashboard</li>
                  <li>✓ View reports</li>
                  <li>✗ Make changes</li>
                  <li>✗ Manage team</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
