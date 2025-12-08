# Hướng dẫn Deploy lên Railway

## Bước 1: Đăng ký Railway
1. Vào https://railway.app
2. Click "Login" → chọn "GitHub"
3. Authorize Railway truy cập GitHub của bạn
4. Claim GitHub Education Credits tại https://railway.app/account/billing

## Bước 2: Tạo Project mới
1. Click "New Project"
2. Chọn "Deploy from GitHub repo"
3. Chọn repository: `lethanhkha/money-tracker`
4. Railway sẽ hỏi bạn muốn deploy service nào

## Bước 3: Setup PostgreSQL Database
1. Trong project, click "+ New"
2. Chọn "Database" → "Add PostgreSQL"
3. Railway sẽ tự động tạo PostgreSQL database
4. Click vào PostgreSQL service → tab "Variables"
5. Copy `DATABASE_URL` (sẽ dùng cho backend)

## Bước 4: Setup Backend Service
1. Click "+ New" → "GitHub Repo" → chọn `money-tracker`
2. Railway detect Node.js tự động
3. Vào Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. Vào tab "Variables" và thêm:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=nv1feHW5MiVKIJFYdqmL6PotuaEwXB8hsQcGDlT4zZUpAbOxk73gjR20y9NrSC
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://money-tracker-flame-nine.vercel.app
   ```
   
   Lưu ý: `${{Postgres.DATABASE_URL}}` sẽ tự động lấy DATABASE_URL từ PostgreSQL service

5. Click "Deploy" để Railway bắt đầu deploy

## Bước 5: Run Migrations
1. Sau khi deploy xong, vào backend service
2. Click vào tab "Settings" → scroll xuống "Custom Start Command"
3. Tạm thời đổi Start Command thành: `npx prisma migrate deploy && npm start`
4. Redeploy
5. Sau khi migration xong, đổi lại Start Command: `npm start`

## Bước 6: Get Backend URL
1. Vào backend service → tab "Settings"
2. Scroll xuống "Networking" → click "Generate Domain"
3. Railway sẽ tạo domain: `your-app.up.railway.app`
4. Copy URL này

## Bước 7: Update Frontend
1. Vào Vercel dashboard → chọn project `money-tracker-flame-nine`
2. Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` = `https://your-app.up.railway.app/api`
4. Redeploy frontend

## Bước 8: Sync Data từ Supabase sang Railway
1. Chạy local script để sync:
   ```bash
   # Update .env với Railway DATABASE_URL
   # Chạy script sync-database.ts
   npx tsx sync-database.ts
   ```

## Lợi ích Railway
- ✅ Không có cold start
- ✅ PostgreSQL ổn định, không timeout
- ✅ $5 credits/tháng với GitHub Education
- ✅ Deploy tự động từ GitHub
- ✅ Logs realtime tốt hơn Render
- ✅ 500MB RAM, 1GB disk (free tier)

## So sánh
| Feature | Render Free | Railway ($5/tháng) |
|---------|-------------|-------------------|
| Cold Start | Có (15 phút) | Không |
| Database | Supabase riêng | PostgreSQL built-in |
| RAM | 512MB | 512MB |
| Deploy | Chậm | Nhanh |
| Stability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
