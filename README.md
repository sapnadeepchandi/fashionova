# Fashionova — Luxury Footwear Store + CMS

A complete e-commerce website for a women's footwear boutique, with a secure admin dashboard (CMS) that lets the owner run the whole site without a developer.

- **Storefront**: homepage, collections with filters, search, product pages, bag, wishlist, checkout, order tracking, customer accounts, information pages.
- **Admin** (`/admin`): dashboard, products, categories, inventory, orders, customers, homepage editor, pages & FAQs, promotions, messages, settings, team access.
- Everything is stored in **PostgreSQL**. Changes made in the admin appear on the live site straight away.
- Prices are in **Sri Lankan Rupees (LKR)** and display as `Rs. 18,900`. The symbol can be changed in *Store settings* (for example to `LKR`).

---

## 1. Technology

| Part | Choice | Why |
|---|---|---|
| Website + admin | **Next.js 15** (App Router, React 19, TypeScript) | One app, server-rendered, fast, easy to host |
| Database | **PostgreSQL** — Supabase recommended (any Postgres works) | Reliable, free tier available, daily backups on paid plans |
| Images | Stored in the database (`images` table), resized to WebP on upload, served with long-term caching | No extra storage service to configure |
| Admin login | Own authentication: bcrypt-hashed passwords, signed HTTP-only session cookie, role checks on every page and action | No third-party auth setup needed |
| Validation | `zod` on the server for every form and action | |

This is the simplest reliable setup for a small business: **one database + one hosting service**. Supabase is used only as the Postgres database. Its separate Auth and Storage products aren't needed. If the catalogue grows past a few thousand photos, images can be moved to Supabase Storage later.

---

## 2. Run it on your computer

Requirements: **Node.js 20+** and a PostgreSQL database (local, or a free Supabase project).

```bash
npm install
cp .env.example .env          # then edit the values (see below)
npm run db:setup              # creates tables + loads the sample shop
npm run dev                   # http://localhost:3000
```

Admin: **http://localhost:3000/admin/login** using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
(default `owner@fashionova.com` / `ChangeMe!2026`). Change the password under *My password* after signing in.

Sample customer accounts (for testing the shopper's account page): `amelia.hart@example.com`, `sofia.b@example.com`, `isabelle.clarke@example.com`. Password for all three: `Customer!2026`.

### Environment variables

| Name | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string. On Supabase: *Project Settings → Database → Connection string → Transaction pooler* (port 6543). |
| `SESSION_SECRET` | Long random string (32+ characters) used to sign logins. Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The first owner account created by `npm run db:seed`. |
| `NEXT_PUBLIC_SITE_URL` | The public address of the site. |

### Useful commands

| Command | Does |
|---|---|
| `npm run db:migrate` | Creates or updates the tables (safe to run again) |
| `npm run db:seed` | Loads sample products, orders, customers and content (skipped if products exist) |
| `node scripts/seed.mjs --force` | **Wipes** catalogue, orders and content and reloads the sample data |
| `npm run admin:create -- email "Name" 'Password123!' owner` | Creates or resets an admin account from the command line (lost-password recovery) |

---

## 3. Put it online (Supabase + Vercel)

1. **Database:** create a project at supabase.com. Copy the *Transaction pooler* connection string.
2. **Tables + sample data:** on your computer, put that string in `.env` as `DATABASE_URL` and run `npm run db:setup`.
   (To start with an empty shop instead, run only `npm run db:migrate`, then `npm run admin:create -- …`.)
3. **Code:** push this folder to a private GitHub repository.
4. **Hosting:** at vercel.com → *Add New Project* → import the repository. Add the environment variables `DATABASE_URL`, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL`, then *Deploy*. Choose the Vercel region closest to your Supabase region.
5. **Domain:** in Vercel → *Settings → Domains*, add the shop's domain and follow the DNS instructions. HTTPS is automatic.

Any Node.js host (Railway, Render, a VPS with `npm run build && npm start`) works the same way.

---

## 4. What the owner can do in the admin

| Area | Features |
|---|---|
| **Dashboard** | Total products, orders, customers and revenue · monthly sales chart (12 months) · recent orders · low-stock and out-of-stock alerts · best sellers |
| **Products** | Add, edit, duplicate, delete · multiple images (upload, reorder, remove) · name, description, details · regular + sale price · several categories · colours (name + swatch) · EU sizes 35–42 · stock for every colour × size · New / Bestseller / Featured labels · active/hidden · search & filter (category, status, label, stock) |
| **Categories** | Create, edit, delete · description and image · show in menu / on homepage · choose which products belong |
| **Inventory** | Stock grid for every product, colour and size · low-stock and sold-out filters · bulk save · alert badge in the menu |
| **Orders** | List with search (number, name, email, phone, postcode) and filters (status, payment, date range) · full order view with items, customer, address, totals and payment · status: Pending → Confirmed → Processing → Shipped → Delivered / Cancelled · payment: unpaid / paid / refunded · internal notes · full history |
| **Customers** | Registered and guest customers · contact details and addresses · order history and total spend · search |
| **Homepage** | Announcement bar · hero image, headings, buttons and links · section titles · which products appear in New Arrivals, Best Sellers and Featured · editorial feature · brand story (text, images, highlights) · promotional banner (on/off) · trust strip · "Why shop with us" · Instagram gallery · newsletter block |
| **Pages & Info** | About, Contact, Shipping, Returns, Privacy, Terms (simple formatting: blank line = paragraph, `##` heading, `-` bullet) · FAQs · store name, email, phone, address, hours · Instagram, Facebook, TikTok links |
| **Promotions** | Discount codes (percentage or fixed, minimum order, start/expiry dates, usage limit, pause) · timed campaigns (e.g. 10% off a category, with automatic announcement-bar message) · sale prices per product |
| **Messages** | Contact-form messages (mark handled) · newsletter subscribers (copy list) |
| **Store settings** (owner) | Currency symbol (default `Rs.`), delivery prices in LKR and free-delivery threshold · low-stock level · **when stock is reduced** (order placed / confirmed / paid) · payment methods offered · bank transfer instructions |
| **Team & access** (owner) | Add staff, change roles, reset passwords, deactivate accounts |

### Roles

| Role | Can use |
|---|---|
| **Owner** | Everything, including settings and team |
| **Manager** | Products, categories, inventory, orders, customers, homepage, pages, promotions, messages |
| **Staff** | Dashboard, orders, customers, inventory, messages |

### How stock works

- Stock is held per colour and size. Shoppers can't add or order more than is available; the bag and checkout re-check live stock and prices.
- Stock is reduced **automatically** at the point chosen in *Store settings*. The default is when you confirm an order. The reduction happens inside a database transaction, so two shoppers can't buy the last pair.
- **Cancelling** an order returns its stock. Every stock movement is logged in the order history.

---

## 5. Security

- Passwords hashed with bcrypt (cost 12). Admin passwords need at least 10 characters.
- Sessions are signed (HS256), **HTTP-only, Secure, SameSite=Lax** cookies that expire after 8 hours (admin) or 30 days (customers).
- Changing a password, role or active status signs that user out everywhere.
- **Three layers of protection on admin routes:**
  - Middleware blocks `/admin` and `/api/admin` without a valid session.
  - Every admin page re-checks the user and their role against the database.
  - Every server action and API route checks permissions again before changing anything.
- Login throttling: 5 failed attempts per email (20 per IP) locks sign-in for 15 minutes.
- All input is validated on the server, and all database queries are parameterised (no SQL injection).
- Uploads must be JPG/PNG/WebP/AVIF images under 4 MB. They are re-encoded on the server, so files can't carry scripts.
- Order pages for customers use an unguessable 128-bit link.
- Admin pages are `noindex` and never cached. Security headers are set on every page.
- On Supabase, row-level security is switched on for all tables, so the public Supabase API can't read shop data. The app connects to the database directly from the server.

---

## 6. Features that need outside services (not included)

| Feature | Status | What's needed |
|---|---|---|
| **Card payments** (Visa/Mastercard/Apple Pay) | Not connected. Checkout offers **cash on delivery** and **bank transfer**, which work fully. | A payment provider account such as **Stripe** (or PayHere / PayPal), plus a developer to add Stripe Checkout and a webhook that marks orders as paid. The database already supports `payment_method = 'card'`. |
| **Emails** (order confirmation, shipping updates, new-order alerts to the owner, low-stock emails) | Not sent. Alerts appear inside the admin; customers see order progress on their order link. | An email service such as **Resend** or **Postmark**, plus a verified sending domain. |
| **Customer "forgot password"** | Not available (needs email). | Same email service. Admins can reset staff passwords; `npm run admin:create` resets the owner. |
| **Hosting, domain, SSL** | — | Vercel (or similar) + a domain name. SSL is automatic. |
| **Backups** | — | Supabase Pro includes daily backups, or schedule `pg_dump`. |
| **Spam protection on forms** | Server validation only | Add a CAPTCHA (e.g. Cloudflare Turnstile) if spam appears. |

---

## 7. Project structure

```
app/
  (store)/            customer website: home, collections, products, checkout, order, account, pages…
  admin/              CMS: login + (panel)/ dashboard, products, categories, inventory, orders, …
  admin/actions.ts    all admin server actions (permission-checked + validated)
  (store)/actions.ts  checkout, contact, newsletter, customer accounts
  api/                images, live bag pricing, search, admin image upload
components/store/     storefront UI (header, bag, product card, filters, checkout…)
components/admin/     CMS UI (forms, image uploader, product editor…)
lib/                  db, auth, catalogue & pricing, orders & stock, site content defaults
db/schema.sql         database schema
scripts/              migrate, seed (sample data), create-admin
```

The sample product photos are cropped from the design reference. Replace them with the brand's own photography in *Products* and *Homepage*.
