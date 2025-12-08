"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { register } = useAuth();

  const validateForm = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Validate name
    if (!name) {
      errors.name = "Vui lòng nhập họ tên";
    } else if (name.length < 2) {
      errors.name = "Họ tên phải có ít nhất 2 ký tự";
    }

    // Validate email
    if (!email) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ";
    }

    // Validate password
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    // Validate confirm password
    if (!confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu không khớp";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password });
    } catch (err: any) {
      // Handle network errors (no response from server)
      if (!err.response) {
        setError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet."
        );
        setLoading(false);
        return;
      }

      // Handle HTTP status codes
      const status = err.response?.status;
      const backendError = err.response?.data?.error;

      if (status === 400) {
        // Check if backend error message is about email
        if (backendError && typeof backendError === "string") {
          if (
            backendError.includes("email") ||
            backendError.includes("Email") ||
            backendError.includes("đã được sử dụng")
          ) {
            setError("Email đã được sử dụng. Vui lòng sử dụng email khác.");
          } else {
            // Display the backend error message directly if it's in Vietnamese
            setError(backendError);
          }
        } else {
          setError("Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại.");
        }
      } else if (status === 409) {
        setError("Email đã được sử dụng. Vui lòng sử dụng email khác.");
      } else if (status === 429) {
        setError("Bạn đã thử đăng ký quá nhiều lần. Vui lòng thử lại sau.");
      } else if (status === 500) {
        setError("Lỗi máy chủ. Vui lòng thử lại sau ít phút.");
      } else if (status === 503) {
        setError("Hệ thống đang bảo trì. Vui lòng thử lại sau.");
      } else if (backendError) {
        // Handle backend validation errors
        if (typeof backendError === "string") {
          // Display backend error directly if it's already in Vietnamese
          setError(backendError);
        } else if (Array.isArray(backendError)) {
          // Zod validation errors - translate them
          const translatedErrors = backendError.map((e: any) => {
            const msg = e.message || "";
            if (msg.includes("email")) return "Email không hợp lệ";
            if (msg.includes("password")) return "Mật khẩu không hợp lệ";
            if (msg.includes("name")) return "Họ tên không hợp lệ";
            return msg;
          });
          setError(translatedErrors.join(", "));
        } else {
          setError("Đăng ký thất bại. Vui lòng thử lại.");
        }
      } else {
        setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-scaleIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Đăng ký</h1>
          <p className="text-gray-600 mt-2">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors({ ...fieldErrors, name: undefined });
                }
              }}
              className={`w-full px-4 py-3 border ${
                fieldErrors.name ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500`}
              placeholder="Nguyễn Văn A"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-shake">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: undefined });
                }
              }}
              className={`w-full px-4 py-3 border ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500`}
              placeholder="email@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-shake">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: undefined });
                }
              }}
              className={`w-full px-4 py-3 border ${
                fieldErrors.password ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-shake">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors({
                    ...fieldErrors,
                    confirmPassword: undefined,
                  });
                }
              }}
              className={`w-full px-4 py-3 border ${
                fieldErrors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500`}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-shake">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
