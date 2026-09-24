# L'Union Pizza — Make Your Own (MYO) Reservation & Back Office System

An artisanal Neapolitan pizzeria web platform featuring an interactive **Make Your Own (MYO)** reservation engine and a comprehensive **Admin Back Office** management portal.

---

## 🍕 Features

### Customer Experience
* **Artisanal Pizza Repertoire**: Explore wood-fired authentic Neapolitan pizza creations with detailed topping notes and price tags.
* **Special Kreasi (Mix 2 Flavours)**: Innovative interactive mixer allowing guests to pair two distinct flavours in a single pizza with transparent pricing formula: `(Price 1 + Price 2) ÷ 2`.
* **Real-Time Booking Board**: Live 15-minute slot grid for artisan dining tables (*Napoli* and *Romana*) with instant availability status.
* **Privacy-First Reservation Matrix**: `PENDING` bookings lock the table while keeping customer identity confidential; `CONFIRMED` bookings showcase guest names and menu selections.
* **SeaBank Booking Fee & Upload**: Seamless Rp10.000 reservation fee verification with direct receipt upload.
* **Self-Service Tracker**: Real-time status lookup using unique booking reference codes (`MYO-XXXXX`).

### Admin Back Office
* **Secure Authentication**: Protected portal powered by **Better Auth** with role-based session management (`ADMIN`).
* **Interactive Dashboard**: Real-time KPI metrics (Total Bookings, Pending, Confirmed, Total Pax) and today's hearthside schedule.
* **Reservation Moderation**: Review SeaBank payment receipts, confirm table bookings, or reject with audit trail logging.
* **Menu Management**: Full CRUD on pizza items, descriptions, pricing, and active display toggles.
* **Table Management**: Table capacities, descriptions, imagery, and availability status.
* **Schedule & Date Overrides**: Weekly operational hours configuration and special holiday/event date overrides.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
* **Language**: TypeScript
* **Styling**: Tailwind CSS, Lucide Icons, Radix UI primitives
* **Database & ORM**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
  * *Dual-Mode Database Engine*: Connect to external PostgreSQL (Supabase, Neon, Railway) or run zero-config locally via embedded [PGlite](https://pglite.dev/).
* **Authentication**: [Better Auth](https://better-auth.com/) (Email & Password credentials with scrypt hashing)
* **Animation & Polish**: Canvas Confetti, micro-interactions

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js 18.17+ or 20+
* npm, yarn, or pnpm

### 2. Installation
```bash
git clone <repository-url>
cd lunion-pizza
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment settings:
```env
# Optional: Set your PostgreSQL connection string (Supabase, Neon, Railway, Docker, etc.)
# If left empty, the app automatically runs on the embedded PGlite PostgreSQL engine!
DATABASE_URL=

# Better Auth Secret (Generate any random 32+ character string in production)
BETTER_AUTH_SECRET=lunion-pizza-secure-session-secret-key-32-chars-long
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Default Admin Credentials
* **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
* **Email**: `admin@lunionpizza.com`
* **Password**: `admin123`
*(A quick "Fill Demo Credentials" button is available on the login page)*

---

## 📦 Production Build & Deployment

### Build Locally
```bash
npm run build
npm run start
```

### Deploy to Vercel
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set up a PostgreSQL database (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), or Vercel Postgres) and add `DATABASE_URL` to Vercel Environment Variables.
4. Set `BETTER_AUTH_SECRET` (generate a secure 32-character string) and set `BETTER_AUTH_URL` to your production domain (e.g. `https://your-domain.vercel.app`).
5. Deploy! The database will auto-seed initial menu items, tables, schedules, and default admin credentials on first startup.

---

## 📄 License
MIT License. Crafted for **L'Union Pizza**.
