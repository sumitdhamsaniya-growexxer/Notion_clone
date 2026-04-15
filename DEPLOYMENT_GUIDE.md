# 🚀 Notion Clone - Deployment & Fix Guide

## Issues Fixed ✅

### 1. **Missing Backend Dockerfile**
- Created `backend/Dockerfile` to containerize the Node.js backend
- Uses Alpine Linux for minimal image size

### 2. **CORS Origin Errors**
- Updated `backend/src/server.js` to automatically accept `.railway.app` domains
- No more 404s from CORS rejections

### 3. **Frontend API URL Not Configured**
- Created `.env.production` files for both frontend and backend
- Frontend now properly routes API calls to the backend

---

## 🔧 How to Deploy on Railway

### **Step 1: Set Environment Variables**

Go to your Railway project Dashboard and add these environment variables:

#### **Backend Service Environment Variables:**
```
NODE_ENV=production
PORT=8080
DB_HOST=localhost  // Railway will auto-inject DATABASE_* variables
DB_PORT=5432
DB_NAME=notion_clone
DB_USER=notion_user
DB_PASSWORD=<your-secure-password>
JWT_SECRET=<generate-with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<generate-same-way>
ALLOWED_ORIGINS=https://your-frontend-railway-url.up.railway.app
```

#### **Frontend Service Environment Variables:**
```
VITE_API_URL=https://your-backend-railway-url.up.railway.app/api
```

### **Step 2: Connect Services**

1. In Railway Dashboard → Project Settings → Services
2. Add the **Backend Service** with source: GitHub repository
3. Point to `backend/` directory OR use the `Procfile`
4. Add the **Frontend Service** separately
5. Set frontend build command: `npm run build`
6. Set frontend start command: `npm run preview`

### **Step 3: Update Frontend .env.production**

Replace the placeholder in `frontend/.env.production`:
```
VITE_API_URL=https://notion-clone-backend-prod-XXXX.up.railway.app/api
```
Get the actual URL from your Railway backend service domain.

### **Step 4: Deploy**

Push your changes to GitHub:
```bash
git add .
git commit -m "fix: add Docker and production configs for Railway"
git push origin main
```

Railway will auto-deploy when you push.

---

## 🧪 Testing Locally Before Deployment

### **Start Backend:**
```bash
cd backend
npm install
npm run dev
```

### **Start Frontend (in new terminal):**
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:5000/api npm run dev
```

Then visit `http://localhost:5173` and test login.

---

## ⚙️ Environment Variables Reference

### Backend (.env)
| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `8080` |
| `DB_HOST` | Database host | Set by Railway |
| `JWT_SECRET` | JWT signing key | 64-char hex string |
| `ALLOWED_ORIGINS` | CORS whitelist | `https://frontend.railway.app` |

### Frontend (.env.production)
| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API endpoint | `https://backend.railway.app/api` |

---

## 🐛 Troubleshooting

### **Still Getting 404 Errors?**

1. **Check Network Tab**: Open DevTools (F12) → Network tab → Click login request
   - Verify the URL it's actually calling
   - Should be your Railway backend URL

2. **Check Backend Logs**: In Railway Dashboard → View Logs
   - Look for connection errors or missing environment variables

3. **Verify CORS**: Check if request origin is being blocked
   - Backend logs will show CORS rejection

4. **Database Connection**: Make sure `DATABASE_URL` is properly set in Railway
   ```
   postgresql://user:password@host:5432/dbname
   ```

### **"Cannot find module" errors?**
- Run `npm ci` instead of `npm install` in production

### **Port conflicts?**
- Railway assigns a random port via `process.env.PORT`
- Backend code already handles this ✅

---

## 📝 Files Modified/Created

- ✅ `backend/Dockerfile` - Created
- ✅ `backend/.env.production` - Created  
- ✅ `frontend/.env.production` - Created
- ✅ `frontend/vite.config.js` - Updated
- ✅ `backend/src/server.js` - Updated (CORS config)
- ✅ `Procfile` - Created
- ✅ `railway.json` - Created

---

## 🎯 Next Steps

1. Update `frontend/.env.production` with your actual backend URL
2. Push to GitHub
3. Railway will auto-deploy
4. Test at your frontend Railway domain

Good luck! 🚀
