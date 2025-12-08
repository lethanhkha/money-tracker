import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { generateToken } from "../lib/jwt";
import { authenticate } from "../middleware/auth";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatar: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, name, password } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được sử dụng!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Create default wallet (Tiền mặt)
    await prisma.wallet.create({
      data: {
        userId: user.id,
        name: "Tiền mặt",
        balance: 0,
        currency: "VND",
        icon: "💵",
        color: "#22c55e",
      },
    });

    // Create default categories
    const defaultCategories = [
      // Chi tiêu
      {
        name: "Ăn uống",
        type: "expense" as const,
        icon: "🍔",
        color: "#ef4444",
      },
      {
        name: "Mua sắm",
        type: "expense" as const,
        icon: "🛒",
        color: "#f59e0b",
      },
      {
        name: "Di chuyển",
        type: "expense" as const,
        icon: "🚗",
        color: "#3b82f6",
      },
      { name: "Nhà ở", type: "expense" as const, icon: "🏠", color: "#8b5cf6" },
      {
        name: "Giải trí",
        type: "expense" as const,
        icon: "🎮",
        color: "#ec4899",
      },
      { name: "Y tế", type: "expense" as const, icon: "⚕️", color: "#10b981" },
      {
        name: "Giáo dục",
        type: "expense" as const,
        icon: "📚",
        color: "#6366f1",
      },
      { name: "Khác", type: "expense" as const, icon: "📦", color: "#6b7280" },
      // Thu nhập
      { name: "Lương", type: "income" as const, icon: "💰", color: "#22c55e" },
      { name: "Khác", type: "income" as const, icon: "💵", color: "#10b981" },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId: user.id,
      })),
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile
router.put("/profile", authenticate, async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const userId = req.user!.userId;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email đã được sử dụng!" });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    // Handle password change
    if (data.newPassword) {
      if (!data.currentPassword) {
        return res
          .status(400)
          .json({ error: "Vui lòng nhập mật khẩu hiện tại" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        data.currentPassword,
        currentUser.password
      );
      if (!isValidPassword) {
        return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
      }

      // Hash new password
      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({
      message: "Cập nhật thông tin thành công!",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return res.status(400).json({ error: errorMessage });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
