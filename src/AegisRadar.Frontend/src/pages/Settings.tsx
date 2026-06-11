import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, Palette } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { SettingsDto } from "@/types/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.settings.getSettings();
      setSettings(data);
    } catch (error) {
      toast.error("Failed to load settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await apiClient.settings.updateSettings({
        general: settings.general,
        security: settings.security,
        notifications: settings.notifications,
        api: settings.api,
        appearance: settings.appearance,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-slate-400">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your organization information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Organization Name
                  </label>
                  <Input
                    value={settings.general.organizationName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: {
                          ...settings.general,
                          organizationName: e.target.value,
                        },
                      })
                    }
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Email
                  </label>
                  <Input
                    value={settings.general.email}
                    disabled
                    className="bg-slate-900/50 border-slate-700 text-slate-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button variant="outline" className="border-slate-600">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Control how you receive alerts and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Fraud Alerts</p>
                    <p className="text-sm text-slate-400">
                      Receive notifications for suspicious transactions
                    </p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <div>
                    <p className="font-medium text-white">Daily Digest</p>
                    <p className="text-sm text-slate-400">
                      Send daily summary email
                    </p>
                  </div>
                  <Switch checked={settings.notifications.dailyDigest} />
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <div>
                    <p className="font-medium text-white">Email Notifications</p>
                    <p className="text-sm text-slate-400">
                      Send important updates via email
                    </p>
                  </div>
                  <Switch checked={settings.notifications.emailNotifications} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button variant="outline" className="border-slate-600">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize your interface preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Theme
                  </label>
                  <Select value={settings.appearance.theme}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="dark">Dark (Default)</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Language
                  </label>
                  <Select 
                    value={settings.appearance.language} 
                    onValueChange={(val) => {
                      setSettings({
                        ...settings,
                        appearance: {
                          ...settings.appearance,
                          language: val,
                        },
                      });
                    }}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button variant="outline" className="border-slate-600">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
