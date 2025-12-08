"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Lock,
  Camera,
  Loader2,
  Upload,
  Trash2,
} from "lucide-react";

// DiceBear avatar styles
const AVATAR_STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "avataaars-neutral",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "bottts-neutral",
  "croodles",
  "croodles-neutral",
  "fun-emoji",
  "icons",
  "identicon",
  "initials",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "notionists",
  "notionists-neutral",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
  "shapes",
  "thumbs",
];

const generateAvatarUrl = (style: string, seed: string) => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
    seed
  )}`;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState("avataaars");
  const [uploadingImage, setUploadingImage] = useState(false);

  const updateMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      // Redirect to dashboard
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Không thể cập nhật thông tin"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password if changing
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        toast.error("Vui lòng nhập mật khẩu hiện tại");
        return;
      }
      if (!formData.newPassword) {
        toast.error("Vui lòng nhập mật khẩu mới");
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }
    }

    // Only send changed fields
    const updateData: any = {};

    if (formData.name && formData.name !== user?.name) {
      updateData.name = formData.name;
    }

    if (formData.email && formData.email !== user?.email) {
      updateData.email = formData.email;
    }

    if (formData.avatar !== user?.avatar) {
      updateData.avatar = formData.avatar || null;
    }

    if (showPasswordFields && formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 0) {
      toast.error("Không có thay đổi nào để lưu");
      return;
    }

    updateMutation.mutate(updateData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 2MB");
      return;
    }

    setUploadingImage(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData({ ...formData, avatar: base64 });
      setUploadingImage(false);
      setShowAvatarPicker(false);
      toast.success("Đã tải ảnh lên");
    };
    reader.onerror = () => {
      setUploadingImage(false);
      toast.error("Không thể tải ảnh lên");
    };
    reader.readAsDataURL(file);
  };

  const getAvatarDisplay = () => {
    if (formData.avatar) {
      // Check if it's a base64 image
      if (formData.avatar.startsWith("data:image")) {
        return (
          <img
            src={formData.avatar}
            alt="Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        );
      }
      // Check if it's a DiceBear URL
      if (formData.avatar.startsWith("https://api.dicebear.com")) {
        return (
          <img
            src={formData.avatar}
            alt="Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        );
      }
    }
    // Fallback to first letter
    return (
      <span className="text-4xl font-semibold text-white">
        {user?.name.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page header */}
          <div className="animate-slideUp">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Thông tin cá nhân
            </h1>
            <p className="mt-2 text-gray-600">
              Cập nhật thông tin tài khoản của bạn
            </p>
          </div>

          {/* Profile Form */}
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideUp"
            style={{ animationDelay: "0.1s" }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-200 animate-fadeIn">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden transition-transform duration-300 hover:scale-110">
                    {getAvatarDisplay()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-gray-200 hover:border-indigo-500 transition-all duration-200 hover:scale-110"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {showAvatarPicker && (
                  <div className="w-full max-w-2xl animate-slideUp">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      {/* Header with actions */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                          Chọn avatar
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center disabled:opacity-50"
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Đang tải...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3 mr-1" />
                                Tải ảnh lên
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, avatar: "" });
                            }}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Xóa
                          </button>
                        </div>
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {/* Avatar style selector */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-2 block">
                          Chọn kiểu avatar
                        </label>
                        <select
                          value={selectedAvatarStyle}
                          onChange={(e) =>
                            setSelectedAvatarStyle(e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        >
                          {AVATAR_STYLES.map((style) => (
                            <option key={style} value={style}>
                              {style
                                .split("-")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Avatar previews */}
                      <div className="grid grid-cols-9 gap-2 max-h-64 overflow-y-auto p-2">
                        {Array.from({ length: 18 }, (_, i) => {
                          const seed = `${user?.email}-${selectedAvatarStyle}-${i}`;
                          const avatarUrl = generateAvatarUrl(
                            selectedAvatarStyle,
                            seed
                          );
                          return (
                            <button
                              key={seed}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, avatar: avatarUrl });
                                setShowAvatarPicker(false);
                              }}
                              className={`aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all duration-200 hover:scale-110 animate-fadeIn ${
                                formData.avatar === avatarUrl
                                  ? "ring-2 ring-indigo-500"
                                  : "ring-1 ring-gray-200"
                              }`}
                              style={{ animationDelay: `${i * 0.03}s` }}
                            >
                              <img
                                src={avatarUrl}
                                alt={`Avatar ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Name Field */}
              <div
                className="animate-fadeIn"
                style={{ animationDelay: "0.1s" }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-all duration-200"
                  placeholder="Nhập họ tên"
                />
              </div>

              {/* Email Field */}
              <div
                className="animate-fadeIn"
                style={{ animationDelay: "0.2s" }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-all duration-200"
                  placeholder="email@example.com"
                />
              </div>

              {/* Password Section */}
              <div
                className="pt-6 border-t border-gray-200 animate-fadeIn"
                style={{ animationDelay: "0.3s" }}
              >
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-all duration-200 hover:scale-105"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {showPasswordFields ? "Ẩn" : "Đổi mật khẩu"}
                </button>

                {showPasswordFields && (
                  <div className="mt-4 space-y-4 animate-slideUp">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div
                className="flex justify-end space-x-3 pt-6 border-t border-gray-200 animate-fadeIn"
                style={{ animationDelay: "0.4s" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      name: user?.name || "",
                      email: user?.email || "",
                      avatar: user?.avatar || "",
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setShowPasswordFields(false);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center hover:scale-105"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
