# Shift Auto Supply — Owner's Complete Guide
### Adding Images · Changing Partners · Deploying · Setting Up a Domain

---

## Part 1 — Adding Photos to the Hero Slides

The homepage has **4 interchanging slides** (the big banner at the top). Each one currently uses a dark blue gradient background. You can replace any slide's background with your own photo.

### How the slides work

Each slide has a class like `hero-slide-1`, `hero-slide-2`, `hero-slide-3`, `hero-slide-4`. The background of each slide is controlled in the file:

```
client/css/pages/home.css
```

### Step-by-step: Adding a photo to a slide

**Step 1 — Prepare your photo**
- Recommended size: **1920 × 900 pixels** (landscape/wide format)
- Format: JPG or WebP (WebP is smaller and faster)
- Keep file size under **400 KB** — compress at https://squoosh.app if needed
- Dark or moody photos work best because white text sits on top

**Step 2 — Add the photo to the project**

Put your photo inside:
```
client/assets/
```
Name it something clear, e.g.:
- `hero-slide-1.jpg`
- `hero-slide-2.jpg`

**Step 3 — Open `client/css/pages/home.css` in VS Code**

Find this block (for Slide 1):
```css
.hero-slide-1 {
  background: linear-gradient(135deg, #0A0F1E 0%, #0d1b3e 40%, #1a2a5e 100%);
}
```

Replace it with:
```css
.hero-slide-1 {
  background: url('/assets/hero-slide-1.jpg') center center / cover no-repeat;
}
```

**Step 4 — The dark overlay is already built in**

Each slide has an `overlay` div that puts a semi-transparent dark layer over your photo so the white text stays readable. You do not need to change this — it already exists.

If your photo is very bright and the text is hard to read, find `.hero-slide-overlay` in `home.css` and increase the opacity:
```css
.hero-slide-overlay {
  background: rgba(0, 0, 0, 0.55); /* increase this number, max 1 */
}
```

**Step 5 — Repeat for other slides**

Do the same for Slide 2, 3, and 4 by replacing `.hero-slide-2`, `.hero-slide-3`, `.hero-slide-4`.

> **Tip:** You don't have to add a photo to every slide. You can leave some as the dark gradient and only add a photo to the ones where you have a good image.

---

## Part 2 — Changing the "MechPro Logistics" Partner

The partners section on the homepage has three cards. "MechPro Logistics" is the second one. Here is how to change it to any company you like.

**Open:** `client/index.html`

Search for (use `Ctrl+F` in VS Code):
```
MechPro Logistics
```

You will find this block:
```html
<div class="partner-card" style="cursor:default;max-width:260px">
  <svg width="22" height="22" ...truck icon...></svg>
  <div>
    <div style="font-weight:700;font-size:14px;color:var(--text-primary)">MechPro Logistics</div>
    <div style="font-size:12px;color:var(--text-muted)">Specialized auto parts shipping</div>
  </div>
</div>
```

**Replace the two text lines** with your new company name and tagline:

```html
<div class="partner-card" style="cursor:default;max-width:260px">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
  <div>
    <div style="font-weight:700;font-size:14px;color:var(--text-primary)">YOUR COMPANY NAME</div>
    <div style="font-size:12px;color:var(--text-muted)">Your short tagline here</div>
  </div>
</div>
```

Just change the two lines in bold to whatever you want. The icon shown is a screen/monitor — if you want a different icon, visit https://lucide.dev, find an icon you like, copy its SVG code, and paste it in place of the `<svg>...</svg>` block.

---

## Part 3 — Deploying the Website (Step by Step)

> Your `.env` file is already set up. Start from Step 1.

---

### Step 1 — Create a GitHub repository

1. Go to **https://github.com** — sign in or create a free account
2. Click the **+** button (top right) → **New repository**
3. Name it: `shift-auto-supply`
4. Set it to **Private**
5. Do **NOT** tick "Add a README file"
6. Click **Create repository**
7. GitHub will show you a page with setup instructions — keep this tab open

---

### Step 2 — Push your code to GitHub

Open a terminal inside your `shift-auto-supply` folder (the root folder that contains both `server/` and `client/`).

Run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit — Shift Auto Supply"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/shift-auto-supply.git
git push -u origin main
```

> Replace `YOURUSERNAME` with your actual GitHub username.

When it asks for a password, use a **Personal Access Token** (not your GitHub password). To create one: GitHub → Settings → Developer settings → Personal access tokens → Generate new token → tick "repo" → Generate → copy it.

After the push, refresh your GitHub page. You should see all your files there.

---

### Step 3 — Deploy the backend to Render

**Render** hosts the server (the part that handles orders, payments, and products).

1. Go to **https://render.com** — sign in with your GitHub account
2. Click **New +** → **Web Service**
3. Click **Connect** next to your `shift-auto-supply` repository
4. Fill in the settings:

   | Setting | Value |
   |---|---|
   | **Name** | `shift-auto-api` |
   | **Region** | Choose the one closest to your customers |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Instance Type** | Free |

5. Scroll down to **Environment Variables**. Click **Add Environment Variable** for each line below:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGO_URI` | *(copy from your .env file)* |
   | `JWT_SECRET` | *(copy from your .env file)* |
   | `JWT_REFRESH_SECRET` | *(copy from your .env file)* |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | *(leave blank for now — you'll fill this after Step 4)* |
   | `CLOUDINARY_CLOUD_NAME` | *(copy from your .env file)* |
   | `CLOUDINARY_API_KEY` | *(copy from your .env file)* |
   | `CLOUDINARY_API_SECRET` | *(copy from your .env file)* |
   | `ADMIN_EMAIL` | *(copy from your .env file)* |
   | `ADMIN_PASSWORD` | *(copy from your .env file)* |

6. Click **Create Web Service**
7. Render will build and deploy — this takes **3–5 minutes**
8. When done, you'll see a green **Live** badge and a URL like:
   ```
   https://shift-auto-api.onrender.com
   ```
9. **Test it** — open that URL + `/api/v1/health` in your browser:
   ```
   https://shift-auto-api.onrender.com/api/v1/health
   ```
   You should see: `{ "success": true, "status": "healthy" }`

> Copy your Render URL — you need it in the next step.

---

### Step 4 — Update the API URL in the frontend

Every HTML file in `client/` has this line near the top:
```js
window.ENV = { API_URL: 'http://localhost:5000/api/v1' };
```

You need to change `http://localhost:5000/api/v1` to your live Render URL.

**In VS Code:**
1. Press `Ctrl + Shift + H` (Windows) or `Cmd + Shift + H` (Mac) — this opens Find & Replace
2. **Find:** `http://localhost:5000/api/v1`
3. **Replace:** `https://shift-auto-api.onrender.com/api/v1`
4. Click **Replace All**
5. Save all files

Then push the change to GitHub:
```bash
git add .
git commit -m "Set production API URL"
git push
```

---

### Step 5 — Deploy the frontend to Vercel

**Vercel** hosts the website (the HTML/CSS/JS that customers see).

1. Go to **https://vercel.com** — sign in with your GitHub account
2. Click **Add New** → **Project**
3. Find your `shift-auto-supply` repository and click **Import**
4. Fill in the settings:

   | Setting | Value |
   |---|---|
   | **Framework Preset** | Other |
   | **Root Directory** | `client` |
   | **Build Command** | *(leave completely blank)* |
   | **Output Directory** | `.` *(a single dot)* |
   | **Install Command** | *(leave completely blank)* |

5. Click **Deploy**
6. Wait about **1–2 minutes**
7. Vercel will give you a URL like:
   ```
   https://shift-auto-supply.vercel.app
   ```
8. Click **Visit** to see your live website

---

### Step 6 — Connect frontend and backend (fix CORS)

The backend needs to know where the frontend is hosted so it allows requests from it.

1. Go to **https://render.com** → your `shift-auto-api` service
2. Click **Environment** tab
3. Find `CLIENT_URL` and click the edit pencil
4. Set the value to your Vercel URL:
   ```
   https://shift-auto-supply.vercel.app
   ```
5. Click **Save Changes**
6. Render automatically redeploys — wait about 2 minutes

**Test the full flow:**
- Open your Vercel URL
- Add a product to cart (make sure you added products via the admin panel first)
- Go to checkout
- Complete a test order

If checkout works end-to-end, the site is live and ready to show the customer. ✓

---

### Step 7 — Log in to the admin panel

Visit:
```
https://shift-auto-supply.vercel.app/pages/admin/index.html
```

Use the email and password from your `.env` file (`ADMIN_EMAIL` and `ADMIN_PASSWORD`).

From there you can:
- Add products
- Set up payment methods (Zelle, PayPal, Cash App, Apple Pay)
- Manage orders and update their status

---

## Part 4 — Setting Up a Custom Domain

> Only do this if the customer is happy with the site and wants to go fully live with their own domain name.

---

### Step 1 — Buy a domain name

Go to any domain registrar and buy the domain. Good options:
- **Namecheap** — https://namecheap.com (usually cheapest)
- **Porkbun** — https://porkbun.com (very affordable, clean interface)
- **Google Domains** — https://domains.google (simple, reliable)
- **GoDaddy** — https://godaddy.com (popular, slightly pricier)

Search for the domain you want, e.g. `shiftautosupply.com`. Buy it and log in to your registrar's dashboard — you'll need to go back here to update DNS records in Step 3.

---

### Step 2 — Connect your domain to Vercel (the frontend)

1. Go to **https://vercel.com** → your project → **Settings** → **Domains**
2. Type your domain name (e.g. `shiftautosupply.com`) and click **Add**
3. Vercel will show you DNS records to add. You'll see something like:

   | Type | Name | Value |
   |---|---|---|
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

4. Go to your domain registrar dashboard → DNS settings
5. Delete any existing `A` records for `@`
6. Add the records Vercel gave you exactly as shown
7. Click **Save**

DNS changes take **anywhere from 5 minutes to 48 hours** to fully spread worldwide. Vercel will show a green checkmark when it's verified.

Vercel also automatically sets up an **SSL certificate** (the padlock / HTTPS) — you don't need to do anything for that.

---

### Step 3 — Update the API with the new domain

Once your domain is working, update:

**In `client/` HTML files (Find & Replace in VS Code):**
- Find: `https://shift-auto-supply.vercel.app`
- Replace: `https://shiftautosupply.com` *(your actual domain)*

Then push:
```bash
git add .
git commit -m "Update domain to production URL"
git push
```

**In Render environment variables:**
- Go to `shift-auto-api` → Environment → `CLIENT_URL`
- Change from `https://shift-auto-supply.vercel.app`
- To `https://shiftautosupply.com`
- Save

---

### Step 4 — (Optional) Connect a subdomain for the API

Right now the API runs on `shift-auto-api.onrender.com`. If you want it on a cleaner URL like `api.shiftautosupply.com`:

1. Go to Render → your service → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Type: `api.shiftautosupply.com`
4. Render will show you a CNAME record to add:

   | Type | Name | Value |
   |---|---|---|
   | `CNAME` | `api` | `shift-auto-api.onrender.com` |

5. Add this record in your registrar DNS settings → Save
6. Wait for Render to verify it (5–30 minutes)

Then update the API URL in all your HTML files one more time:
- Find: `https://shift-auto-api.onrender.com/api/v1`
- Replace: `https://api.shiftautosupply.com/api/v1`

Push and you're done.

---

### Step 5 — Final go-live checklist

Run through this before calling the site fully live:

- [ ] Homepage loads at your custom domain
- [ ] Dark/light mode toggle works
- [ ] At least 3–5 products are added via admin
- [ ] Products appear on the shop page
- [ ] BMW Finder returns results
- [ ] Cart adds items and the count shows in header
- [ ] Guest checkout completes (test with a fake email)
- [ ] At least one payment method is set to Active with account details filled in
- [ ] Payment upload page shows the account number/phone number clearly
- [ ] "I Have Made Payment" button works
- [ ] Admin can see the order and update its status
- [ ] Contact page works
- [ ] Site looks correct on a phone screen
- [ ] Browser tab shows the correct logo and page title
- [ ] HTTPS padlock is showing (green lock in browser)

---

## Quick Reference — Key URLs After Deployment

| What | URL |
|---|---|
| Live website | `https://shiftautosupply.com` |
| Admin login | `https://shiftautosupply.com/pages/admin/index.html` |
| API health check | `https://api.shiftautosupply.com/api/v1/health` |
| Vercel dashboard | `https://vercel.com/dashboard` |
| Render dashboard | `https://dashboard.render.com` |
| MongoDB Atlas | `https://cloud.mongodb.com` |
| Cloudinary media | `https://console.cloudinary.com` |

---

## Troubleshooting Quick Reference

**Site loads but products/checkout don't work**
→ The API URL in the HTML files still says `localhost`. Do the Find & Replace in Step 4 again and push.

**Checkout gives "Validation failed" error**
→ Make sure all required fields (Name, Street, City, Country, ZIP) are filled in. State/Province can be left blank.

**Admin login says "Invalid credentials"**
→ Use the exact email and password from your `.env` file. If you changed them after the first deploy, contact us.

**Render shows the site but it's slow the first time**
→ Normal on the free plan. The server "sleeps" after 15 minutes of inactivity. First visit after sleeping takes 30–60 seconds. To fix this permanently, upgrade Render to the Starter plan ($7/month).

**Payment proof upload not working**
→ Check that `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are correctly set in Render's Environment tab.

**Domain not working after 48 hours**
→ Double-check the DNS records match exactly what Vercel/Render showed you. Use https://dnschecker.org to see if the records have spread.

