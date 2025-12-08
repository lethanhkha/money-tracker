"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LogIn, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { login } = useAuth();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

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
      await login({ email, password });
      // Login successful - will redirect to dashboard
    } catch (err: any) {
      // Handle network errors
      if (!err.response) {
        setError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet."
        );
        return;
      }

      // Handle HTTP status codes
      const status = err.response?.status;
      const backendError = err.response?.data?.error;

      if (status === 401) {
        setError("Đăng nhập thất bại. Email hoặc mật khẩu không chính xác.");
      } else if (status === 404) {
        setError("Tài khoản không tồn tại. Vui lòng kiểm tra lại email.");
      } else if (status === 429) {
        setError("Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.");
      } else if (status === 500) {
        setError("Lỗi máy chủ. Vui lòng thử lại sau ít phút.");
      } else if (status === 503) {
        setError("Hệ thống đang bảo trì. Vui lòng thử lại sau.");
      } else if (backendError) {
        // Handle backend validation errors
        if (typeof backendError === "string") {
          // Display backend error directly if it's already in Vietnamese
          const errorMap: { [key: string]: string } = {
            "Invalid credentials": "Email hoặc mật khẩu không chính xác",
            "User not found": "Tài khoản không tồn tại",
            "Email not found": "Email chưa được đăng ký",
            "Incorrect password": "Mật khẩu không chính xác",
            "Invalid or expired token": "Phiên đăng nhập đã hết hạn",
            "No token provided": "Phiên đăng nhập không hợp lệ",
          };
          setError(errorMap[backendError] || backendError);
        } else if (Array.isArray(backendError)) {
          // Zod validation errors
          const errorMessages = backendError
            .map((e: any) => e.message)
            .join(", ");
          setError(errorMessages);
        } else {
          setError("Đăng nhập thất bại. Vui lòng thử lại.");
        }
      } else {
        setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
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
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-gray-600 mt-2">Chào mừng trở lại!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
