-- SQL script to insert default categories for a user
-- Replace 'YOUR_USER_ID' with your actual user ID from the users table

-- You can find your user ID by running:
-- SELECT id, email FROM users;

-- Income Categories (Tiền tips + Lương)
INSERT INTO categories (id, "userId", name, type, icon, color, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'YOUR_USER_ID', 'Tiền tips', 'income', '💸', '#10b981', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Lương', 'income', '💰', '#22c55e', NOW(), NOW());

-- Expense Categories  
INSERT INTO categories (id, "userId", name, type, icon, color, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'YOUR_USER_ID', 'Ăn uống', 'expense', '🍜', '#ef4444', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Mua sắm', 'expense', '🛍️', '#ec4899', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Di chuyển', 'expense', '🚗', '#f97316', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Nhà ở', 'expense', '🏠', '#6366f1', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Giải trí', 'expense', '🎮', '#8b5cf6', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Y tế', 'expense', '💊', '#06b6d4', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Giáo dục', 'expense', '📚', '#3b82f6', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID', 'Khác', 'expense', '💸', '#64748b', NOW(), NOW());

-- Verify the inserted categories
-- SELECT id, name, type, icon, color FROM categories WHERE "userId" = 'YOUR_USER_ID';
