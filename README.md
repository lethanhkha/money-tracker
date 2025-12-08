# Hệ thống Quản lý Chi tiêu

Website quản lý chi tiêu đa người dùng với giao diện hiện đại, hỗ trợ đầy đủ các thiết bị (PC, Laptop, Mobile, Tablet).

## 🚀 Tech Stack

### Frontend

- **Next.js 15** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling hiện đại
- **Zustand** - State management
- **TanStack Query** - Data fetching & caching
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **date-fns** - Date utilities

### Backend

- **Node.js** với **Express** - REST API server
- **TypeScript** - Type safety
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Validation

## 📋 Tính năng chính

### ✅ Đã hoàn thành (Phase 1)

- [x] Setup dự án Next.js + Node.js + PostgreSQL
- [x] Database schema với Prisma ORM
- [x] Authentication system (JWT)
- [x] API endpoints: Register, Login, Get User

### 🚧 Đang phát triển

- [ ] Module quản lý giao dịch (thu/chi)
- [ ] Module quản lý ví tiền
- [ ] Module phân loại giao dịch
- [ ] Module quản lý nợ
- [ ] Module mục tiêu tiết kiệm
- [ ] Dashboard & thống kê
- [ ] Frontend UI/UX

## 📦 Cấu trúc dự án

```
QuanLyChiTieu/
├── frontend/                # Next.js application
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/               # Utilities & helpers
│   ├── public/            # Static assets
│   └── .env.local         # Frontend environment variables
│
├── backend/                # Express API server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── lib/          # Utilities (Prisma, JWT)
│   │   ├── types/        # TypeScript types
│   │   └── server.ts     # Main server file
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── .env              # Backend environment variables
│   └── package.json
│
└── README.md
```

## 🛠️ Setup & Installation

### Yêu cầu hệ thống

- Node.js 18+
- PostgreSQL 14+
- npm hoặc yarn

### 1. Cài đặt PostgreSQL

**Windows:**

- Download từ: https://www.postgresql.org/download/windows/
- Cài đặt và nhớ password của user `postgres`
- Tạo database mới tên `quanlychitieu`:

```sql
CREATE DATABASE quanlychitieu;
```

### 2. Setup Backend

```powershell
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies (đã cài rồi)
# npm install

# Cấu hình database trong file .env
# Sửa DATABASE_URL với thông tin PostgreSQL của bạn:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/quanlychitieu?schema=public"

# Generate Prisma Client
npm run prisma:generate

# Chạy database migration
npm run prisma:migrate

# Khởi động server development
npm run dev
```

Server sẽ chạy tại: **http://localhost:5000**

### 3. Setup Frontend

```powershell
# Mở terminal mới, di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies (đã cài rồi)
# npm install

# Kiểm tra file .env.local có đúng API URL chưa
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Khởi động development server
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

## 🔑 API Endpoints

### Authentication

#### POST `/api/auth/register`

Đăng ký tài khoản mới

```json
{
  "email": "user@example.com",
  "name": "Nguyễn Văn A",
  "password": "password123"
}
```

#### POST `/api/auth/login`

Đăng nhập

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`

Lấy thông tin user hiện tại (cần token)

```
Headers: Authorization: Bearer <token>
```

### Các API khác (đang phát triển)

- `/api/wallets` - Quản lý ví tiền
- `/api/transactions` - Quản lý giao dịch
- `/api/categories` - Quản lý phân loại
- `/api/debts` - Quản lý nợ
- `/api/goals` - Quản lý mục tiêu
- `/api/dashboard` - Thống kê & báo cáo

## 📊 Database Schema

### Users

- id, email, name, password, timestamps

### Wallets (Ví tiền)

- id, userId, name, balance, currency, icon, color, timestamps
- Mặc định: "Tiền mặt" được tạo tự động khi đăng ký

### Categories (Phân loại)

- id, userId, name, type (income/expense), icon, color, timestamps

### Transactions (Giao dịch)

- id, userId, walletId, categoryId, type, amount, description, date, attachments, timestamps

### Debts (Công nợ)

- id, userId, type (lend/borrow), personName, amount, remainingAmount, dueDate, status, timestamps

### Goals (Mục tiêu)

- id, userId, name, targetAmount, currentAmount, deadline, status, timestamps

## 🎯 Roadmap phát triển

### Phase 2 - Core Features

1. **Wallet Management** - CRUD ví tiền, chuyển tiền giữa các ví
2. **Category Management** - Tạo/sửa phân loại thu chi
3. **Transaction Management** - Ghi nhận giao dịch, upload hóa đơn
4. **Debt Management** - Quản lý khoản nợ, lịch sử thanh toán
5. **Goal Management** - Thiết lập mục tiêu, tracking progress

### Phase 3 - Analytics & Dashboard

1. **Dashboard Overview** - Tổng quan tài chính
2. **Charts & Reports** - Biểu đồ thu/chi, phân tích chi tiêu
3. **Budget Forecasting** - Dự báo ngân sách
4. **Export Reports** - Xuất báo cáo PDF/Excel

### Phase 4 - Advanced Features

1. **Recurring Transactions** - Giao dịch định kỳ tự động
2. **Notifications** - Nhắc nhở đến hạn nợ, mục tiêu
3. **Multi-currency** - Hỗ trợ nhiều loại tiền tệ
4. **AI Category Prediction** - Tự động gán phân loại

### Phase 5 - UI/UX Enhancement

1. **Responsive Design** - Tối ưu mobile/tablet
2. **Dark Mode** - Chế độ tối
3. **PWA** - Progressive Web App
4. **Accessibility** - Hỗ trợ người khuyết tật

## 🧪 Testing

```powershell
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/quanlychitieu?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

Dự án đang trong quá trình phát triển. Mọi đóng góp đều được hoan nghênh!

## 📄 License

MIT License

---

**Developed with ❤️ for personal expense management**
