import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, User, Bell, Shield, Palette, CreditCard } from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    id: 'account',
    name: 'Account',
    icon: User,
    description: 'Manage your account settings and preferences'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    description: 'Configure how you want to receive notifications'
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    description: 'Update your security preferences and password'
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel of your workspace'
  },
  {
    id: 'billing',
    name: 'Billing',
    icon: CreditCard,
    description: 'Manage your subscription and billing information'
  }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('account');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center">
          <Settings className="h-8 w-8 text-gray-900 mr-3" />
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <nav className="col-span-12 lg:col-span-3">
            <div className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      activeSection === section.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    {section.name}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9">
            <div className="bg-white shadow-sm rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.name}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.description}
                </p>

                {activeSection === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Acme Inc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                      <div className="mt-4 space-y-4">
                        {['Marketing tips', 'Product updates', 'Newsletter', 'Security alerts'].map((item) => (
                          <div key={item} className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id={item}
                                name={item}
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor={item} className="font-medium text-gray-700">
                                {item}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Theme
                      </label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option>Light</option>
                        <option>Dark</option>
                        <option>System</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeSection === 'billing' && (
                  <div className="space-y-6">
                    <div className="rounded-lg bg-gray-50 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Free Plan</p>
                          <p className="text-sm text-gray-500">Basic features for getting started</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}