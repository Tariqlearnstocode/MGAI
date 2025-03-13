import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = async () => {
    setIsUploading(true);
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsUploading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Profile</h1>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Cover Photo */}
            <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600" />

            {/* Profile Section */}
            <div className="px-6 py-6">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:flex sm:space-x-5">
                  <div className="relative flex-shrink-0">
                    <div className="relative">
                      <img
                        className="h-24 w-24 rounded-full border-4 border-white -mt-12 object-cover"
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                        alt=""
                      />
                      <button
                        onClick={handleAvatarUpload}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:pt-1">
                    <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                      {user?.user_metadata?.full_name || 'Your Name'}
                    </p>
                    <p className="text-sm font-medium text-gray-600">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="border-t border-gray-200 px-6 py-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Personal Information
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your personal information and how others see you on the platform.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <div className="mt-1">
                      <textarea
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Write a few sentences about yourself..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Where do you work?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <input
                      type="url"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}