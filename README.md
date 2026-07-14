# Shift Auto Supply — Production Ecommerce Platform

> Premium automotive parts ecommerce platform. Built for scale, trust, and conversion.

---

## Architecture Overview

```
Architecture Brief
- App type:           REST API + Multi-page Vanilla JS Frontend
- Auth strategy:      JWT (Access + Refresh tokens via httpOnly cookies)
- Database:           MongoDB + Mongoose (flexible schema, JSON-native, scales well for catalog)
- Key entities:       User, Product, Order, Payment, Review, PaymentMethod
- API style:          RESTful v1
- Deployment:         Render (backend) + Vercel (frontend) + MongoDB Atlas
- Notable decisions:  Vanilla JS frontend per spec; modular feature-based backend; 
                      manual payment verification workflow with premium UX
```

---

## Project Structure

```
shift-auto-supply/
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # MongoDB connection
│   │   │   ├── env.js              # Validated environment variables
│   │   │   ├── cloudinary.js       # Cloudinary config
│   │   │   └── logger.js           # Winston logger
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT verify + role guard
│   │   │   ├── error.middleware.js # Global error handler
│   │   │   ├── rateLimiter.js      # Rate limiting
│   │   │   ├── upload.middleware.js # Multer + Cloudinary
│   │   │   └── validate.middleware.js
│   │   ├── modules/
│   │   │   ├── auth/               # Login, register, refresh
│   │   │   ├── users/              # User CRUD + profile
│   │   │   ├── products/           # Product catalog + search
│   │   │   ├── orders/             # Order management
│   │   │   ├── payments/           # Payment methods + proof upload
│   │   │   ├── reviews/            # Product reviews
│   │   │   └── admin/              # Admin analytics + management
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   └── tokens.js
│   │   └── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── client/                          # Vanilla JS + HTML5 frontend
│   ├── index.html                   # Homepage
│   ├── css/
│   │   ├── design-system.css        # CSS variables, tokens, reset
│   │   ├── components.css           # Reusable UI components
│   │   ├── layout.css               # Header, footer, grid
│   │   └── pages/                   # Page-specific styles
│   ├── js/
│   │   ├── core/
│   │   │   ├── api.js               # Fetch wrapper + auth interceptor
│   │   │   ├── auth.js              # Auth state management
│   │   │   ├── cart.js              # Cart state + persistence
│   │   │   └── ui.js                # Shared UI utilities
│   │   ├── components/
│   │   │   ├── header.js            # Dynamic header
│   │   │   ├── productCard.js       # Product card component
│   │   │   └── toast.js             # Toast notifications
│   │   └── pages/                   # Page-specific JS
│   ├── pages/
│   │   ├── shop.html
│   │   ├── product.html
│   │   ├── cart.html
│   │   ├── checkout.html
│   │   ├── payment-upload.html
│   │   ├── order-tracking.html
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── about.html
│   │   ├── contact.html
│   │   ├── faq.html
│   │   ├── shipping-policy.html
│   │   ├── return-policy.html
│   │   ├── privacy-policy.html
│   │   └── admin/
│   │       ├── index.html           # Admin dashboard
│   │       ├── products.html        # Product management
│   │       ├── orders.html          # Order management
│   │       ├── payments.html        # Payment method manager
│   │       └── users.html           # User management
│   └── sitemap.xml
│
├── vercel.json
└── README.md
```

---

## Database Schema

### User
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password": "string (hashed, select: false)",
  "role": "customer | admin",
  "phone": "string",
  "addresses": [{ "label", "street", "city", "state", "country", "zip", "isDefault" }],
  "refreshToken": "string (select: false)",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Product
```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string (unique, SEO-friendly)",
  "sku": "string (unique)",
  "brand": "string",
  "compatibleBrands": ["string"],
  "vehicleModels": [{ "brand", "model", "yearFrom", "yearTo", "engine" }],
  "vinCompatibility": ["string"],
  "category": "string",
  "subcategory": "string",
  "condition": "new | used | refurbished",
  "price": "number",
  "salePrice": "number | null",
  "stock": "number",
  "images": [{ "url", "publicId" }],
  "description": "string",
  "specifications": [{ "key", "value" }],
  "tags": ["string"],
  "isFeatured": "boolean",
  "viewCount": "number",
  "seo": { "title", "description", "keywords" },
  "isActive": "boolean",
  "createdAt": "Date"
}
```

### Order
```json
{
  "_id": "ObjectId",
  "orderNumber": "string (auto-generated)",
  "user": "ObjectId | null (guest)",
  "guestEmail": "string | null",
  "items": [{ "product", "name", "sku", "price", "quantity", "image" }],
  "shipping": { "name", "email", "phone", "address", "city", "state", "country", "zip" },
  "subtotal": "number",
  "shippingCost": "number",
  "total": "number",
  "paymentMethod": "string",
  "paymentStatus": "pending | under_review | confirmed | failed",
  "paymentProof": { "url", "publicId", "uploadedAt", "note" },
  "orderStatus": "pending | processing | shipped | delivered | cancelled",
  "tracking": { "number", "provider", "url", "shippedAt" },
  "adminNotes": "string",
  "createdAt": "Date"
}
```

### PaymentMethod
```json
{
  "_id": "ObjectId",
  "name": "zelle | paypal | cashapp | applepay | creditcard",
  "displayName": "string",
  "icon": "string",
  "isActive": "boolean",
  "isMaintenanceMode": "boolean",
  "maintenanceMessage": "string",
  "accountDetails": { "label", "value" },
  "instructions": "string",
  "sortOrder": "number"
}
```

### Review
```json
{
  "_id": "ObjectId",
  "product": "ObjectId",
  "user": "ObjectId | null",
  "guestName": "string | null",
  "rating": "number (1-5)",
  "title": "string",
  "body": "string",
  "isApproved": "boolean",
  "isVerifiedPurchase": "boolean",
  "createdAt": "Date"
}
```

---

## API Endpoints

```
Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

Products
GET    /api/v1/products                    ?page&limit&brand&model&year&category&condition&minPrice&maxPrice&q
POST   /api/v1/products                    [admin]
GET    /api/v1/products/:slug
PATCH  /api/v1/products/:id               [admin]
DELETE /api/v1/products/:id               [admin]
POST   /api/v1/products/:id/images        [admin]
GET    /api/v1/products/search/vin/:vin

Orders
POST   /api/v1/orders
GET    /api/v1/orders/my                  [auth]
GET    /api/v1/orders/:id
GET    /api/v1/orders/track/:orderNumber
PATCH  /api/v1/orders/:id/proof           upload payment proof
GET    /api/v1/orders                     [admin]
PATCH  /api/v1/orders/:id/status          [admin]
PATCH  /api/v1/orders/:id/tracking        [admin]

Payments
GET    /api/v1/payments/methods
GET    /api/v1/payments/methods/:id       [admin]
PATCH  /api/v1/payments/methods/:id       [admin]

Reviews
GET    /api/v1/reviews?product=
POST   /api/v1/reviews
PATCH  /api/v1/reviews/:id/approve        [admin]
DELETE /api/v1/reviews/:id                [admin]

Admin
GET    /api/v1/admin/analytics
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id
```

---

## Environment Variables

### Server (.env)
```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/shift-auto
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://your-domain.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_EMAIL=admin@shiftautosupply.com
ADMIN_PASSWORD=your-strong-admin-password
```

### Client (.env)
```bash
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

---

## Deployment

### Backend → Render
1. Push `server/` to GitHub repo
2. Create new Web Service on render.com
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add all environment variables from `.env.example`
6. Set Health Check Path: `/api/v1/health`

### Frontend → Vercel
1. Push `client/` to GitHub repo
2. Import project on vercel.com
3. Framework Preset: Other
4. Output Directory: `.` (root)
5. No build command needed (static HTML)

### Database → MongoDB Atlas
1. Create free M0 cluster
2. Create database user
3. Whitelist IP `0.0.0.0/0` for Render
4. Copy connection string to `MONGO_URI`

---

## Seed Admin Account

After deploying, POST to `/api/v1/auth/seed-admin` (only works once, in production creates the admin user).

Or set `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars — server auto-creates admin on first boot.

---

## Key Features

- **Manual Payment Verification** — Premium UX wrapper around Zelle/PayPal/Cash App with proof upload
- **BMW Quick Finder** — Filter parts by model/year/engine
- **Multi-brand Architecture** — BMW primary, scales to Toyota/Ford/Honda etc.
- **Guest Checkout** — No account required to purchase
- **Order Timeline** — Beautiful visual status tracker for customers
- **Admin Payment Manager** — Toggle methods active/maintenance, update account details
- **Dark Mode** — Full dark/light mode with CSS variables
- **Mobile-First** — Sticky cart, bottom actions, slide-over drawers
- **SEO-Optimized** — Structured data, semantic HTML, sitemap, dynamic meta tags
