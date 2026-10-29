# 👑 KhataKing (नेपालको किराना खाता)

> **Ultra-Simple Kirana Shop Management App for Nepal**  
> *बिक्री • उधारो • हिसाब • स्टक • कागज स्क्यान • थप*

![KhataKing Icon](assets/icon-192.png)

---

## 📌 Project Overview

**KhataKing** is a production-ready, mobile-first MERN stack application built specifically for Nepali kirana shops, small retailers, and traditional family businesses.

**Primary Principle: Simplicity over complexity.**

The application is purposefully designed so that even an elderly shopkeeper aged 60–70 who has never operated accounting software can manage their daily shop with complete ease and zero confusion.

---

## 🌟 Key Features

### 1. 🛒 बिक्री (Sales)
- **Large Touch Actions**: Clearly separated **नयाँ बिक्री (नगद)** and **उधारो बिक्री (उधारो)**.
- **Quick Numeric Sales (छिटो बिक्री)**: Allows a shopkeeper to type an amount (e.g., रु. 150) directly and complete a sale without creating an inventory product first.
- **Searchable Frequent Kirana Items**: Instant search with large `+` / `-` stepper buttons (min 48×48 px touch targets).
- **Cart & Bill Summary**: Line items, quantity, unit price, and grand total.
- **Cash Reconciliation**: Shows received amount and automatically calculates change to return.
- **Instant Printable & Shareable Receipt**: Includes KhataKing royal emblem, shop name, PAN, items, and date.
- **Duplicate Prevention**: Powered by idempotency keys to prevent accidental double submissions.

### 2. 📖 उधारो (Udharo — Receivables & Payables)
Supports both directions of outstanding money without confusing financial jargon:
- **हामीले उठाउनुपर्ने (Customers owe us)**: Tracks customer credit sales, repayments, phone numbers, and balances.
- **हामीले तिर्नुपर्ने (We owe others)**: Tracks supplier inventory purchases on credit and payments made.
- **Immutable Financial Ledger**: Balances are calculated dynamically from verified transaction entries rather than manual overwrites.
- **Zero Double-Counting**: Repayments of old debt never inflate sales revenue.

### 3. 📊 हिसाब (Sales Totals & Cash Reconciliation)
- **Period Filter**: **आज (Today)**, **यो हप्ता (This Week)**, **यो महिना (This Month)**, **यो वर्ष (This Year)**.
- **Clean Financial Separation**:
  - Total sales revenue
  - Cash sales vs. Credit sales
  - Old debt collected (tracked distinctly so credit sales are not double-counted)
  - Actual cash in drawer (`नगद गल्ला हिसाब`)
- **Nepali Timezone**: Formatted in `Asia/Kathmandu` timezone.
- **Drill-down**: Tap any total to review the full list of underlying sales receipts.

### 4. 📦 स्टक (Inventory Management)
- **Product Images with White Background**: Option to capture or upload product images directly from camera/gallery. Automatically rendered on catalog cards and sales lists.
- **Kirana-Friendly Units**: Supports common Nepali units: `थान`, `पोका`, `के.जी.`, `ग्राम`, `लिटर`, `बोतल`, `दर्जन`, and `क्रेट`.
- **Low Stock Alerts**: Visual warning badges when stock drops below threshold.
- **Audit History**: Every sale, manual addition, and manual reduction creates an immutable stock movement record.

### 5. 📄 कागज तथा सामान स्क्यान (Paper, Product & Rack OCR)
- **Automatic Background Removal**: When taking photos of products to list in inventory, the background is automatically isolated and placed on a clean pure `#FFFFFF` white studio canvas.
- **Compact Segmented Modes**:
  1. **कागज / बिल (Paper Ledger Scan)**: Capture handwritten customer registers or printed supplier bills. Normalizes Devanagari numerals (`०१२३४५६७८९`), shows an editable compact verification table, and imports safely upon approval.
  2. **सामानको फोटो (Single Product Photo)**: Take a photo of a single product/packaging or bottle. Automatically recognizes the product name, unit, and suggested price, converts the photo to a clean white background, lets the user adjust quantity, and adds it directly to inventory.
  3. **र्याक / शेल्फ (Rack / Multi-Product Shelf Scan)**: Take a photo of an entire shelf or rack of products. Detects all products visible on the shelf, lists them with counts and prices for review, and batch registers them into inventory with one tap.

### 6. 🗣️ थप & साहूजी मद्दत (Voice Narration, Settings & More)
- **Text Size & Layout Density Settings**:
  - **Text Size**: `सानो (Compact)`, `मध्यम (Normal)`, `ठूलो (Large)` to customize font scaling for any eyesight preference.
  - **Layout Padding**: `कम्प्याक्ट (Compact)`, `मध्यम (Comfortable)`, `फराकिलो (Spacious)`.
- **Spoken Audio Tutorials**: Integrated Web SpeechSynthesis narrates instructions in clear, slow Nepali for senior shopkeepers.
- **Bilingual Support (नेपाली / English)**: Instant one-tap persistent toggle.
- **Shop Profile**: Shop name, owner name, phone number, location, and PAN.

---

## 🎨 UI/UX Design System for Senior Users

- **Touch Targets**: Minimum 56 × 56 CSS pixels for primary interactive buttons.
- **Typography**: Minimum 18px body font on primary screens; high-contrast numerals for totals.
- **Fixed Bottom Navigation**: 6 visible destinations (`बिक्री`, `उधारो`, `हिसाब`, `स्टक`, `कागज स्क्यान`, `थप`) that adapt to a responsive top bar on desktop.
- **Brand Icon Everywhere**:
  - Web Favicon (`favicon-32.png`, `favicon-16.png`)
  - Android & Mobile PWA Manifest (`icon-192.png`, `icon-512.png`)
  - Apple Touch Icon (`apple-touch-icon.png`)
  - App Header, Navigation, Receipt printouts, and Modals (`khataking-icon.svg`)

---

## 🏗️ Technical Architecture

```
KhataKing/
├── assets/                  # Brand icons (SVG, 512px, 192px, 32px, 16px)
├── client/                  # React + Vite + Tailwind CSS frontend
│   ├── public/              # PWA manifest, favicons, app icons
│   ├── src/
│   │   ├── components/      # Navbar, BottomNav, KhataKingLogo, ReceiptModal
│   │   ├── context/         # LanguageContext (नेपाली / English)
│   │   ├── views/           # SalesView, UdharoView, TotalsView, StockView, ScanView, MoreView
│   │   ├── App.jsx          # Main App shell
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                  # Node.js + Express backend
│   ├── config/              # MongoDB connection with persistent fallback store
│   ├── data/                # Kirana Store engine & ledger calculations
│   ├── models/              # Mongoose schemas (Shop, Product, Sale, Customer, etc.)
│   ├── routes/              # Express API routes (/api/*)
│   ├── services/            # OCR service & Devanagari numeral parsing
│   ├── test/                # Automated acceptance test suite
│   ├── server.js            # Express server entrypoint
│   └── package.json
└── package.json             # Root workspace scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher (Node v20+ recommended)
- **npm**: v9.x or higher
- **MongoDB** *(Optional)*: If MongoDB is running locally or via `MONGODB_URI`, it connects automatically. If MongoDB is offline, KhataKing automatically switches to its built-in persistent store so you can develop immediately with zero setup.

### 1. Installation

From the project root directory:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 2. Environment Variables

The server includes a pre-configured `.env` file at `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/khataking
JWT_SECRET=khataking_nepal_kirana_super_secret_key_2026
TIMEZONE=Asia/Kathmandu
DEFAULT_LANGUAGE=ne
```

### 3. Running the Application

You can run both backend and frontend from the root:

```bash
# Build the client for production
npm run build

# Start the full production server (Serves API + Frontend at http://localhost:5000)
npm start
```

Or for development:
```bash
# Run server in dev mode
npm run server:dev

# Run frontend with Vite dev server (in another terminal)
npm run client
```

Open your browser at **`http://localhost:5173`** (Vite Dev) or **`http://localhost:5000`** (Express).

---

## 🧪 Acceptance Tests

KhataKing includes an automated acceptance test suite verifying all 16 core accounting and user scenarios:

```bash
npm test
```

### Test Scenarios Covered:
1. ✅ **Product Creation & Cash Sale**: Product created, sale recorded, stock deducted atomically.
2. ✅ **Quick Numeric Sale**: Recorded without requiring pre-existing inventory products.
3. ✅ **Customer Credit Sale**: Outstanding debt increases and inventory deducts exactly once.
4. ✅ **Partial Customer Payment**: Debt reduced without generating false sales revenue.
5. ✅ **Supplier Credit Purchase**: Increases payable and stock correctly.
6. ✅ **Supplier Payment**: Decreases supplier payable balance.
7. ✅ **Totals & Period Calculations**: Today, Week, Month, and Year period filters.
8. ✅ **No Double-Counting**: Revenue is strictly separated from collections of old credit.
9. ✅ **Devanagari Numeral Normalization**: Accurately parses `०१२३४५६७८९` into Arabic floats.
10. ✅ **OCR Scan & Uncertainty Flagging**: Flags uncertain rows before manual approval.
11. ✅ **Duplicate Prevention**: Idempotency key protection prevents double-tap submissions.

---

## 📱 Android Deployment Options

KhataKing is fully prepared for Android deployment through two proven methods:

---

### Option A: Native Android APK & Google Play Build (Capacitor)

The complete native Android Studio project is already generated and pre-configured in [`client/android/`](file:///c:/Users/LEVEL51PC/Desktop/mern%20projects/KhataKing/client/android):
- **App ID**: `com.khataking.app`
- **Official Icons**: Pre-configured in all Android mipmap densities (`mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) with the royal crown & rupee emblem.
- **Permissions**: Pre-configured in `AndroidManifest.xml` for `CAMERA`, `INTERNET`, and `STORAGE`.

#### How to build the APK:
1. **Sync latest web build to Android project**:
   ```bash
   npm run android:sync
   ```
2. **Open in Android Studio**:
   ```bash
   npm run android:open
   ```
   *(Or open the `client/android` folder directly in Android Studio)*.
3. **Build APK in Android Studio**:
   - Go to menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - Or connect your Android phone via USB and click the green **Run (▶)** button.
   - Output APK will be located at `client/android/app/build/outputs/apk/debug/app-debug.apk`.

---

### Option B: Instant 1-Tap Installation (PWA — No Build Required)

For shopkeepers on their phones, they can install KhataKing instantly without needing an APK file:
1. Open KhataKing in **Google Chrome** on any Android device.
2. Tap the Chrome menu (⋮ 3 dots at top-right).
3. Tap **"Install app"** (or **"Add to Home Screen"**).
4. KhataKing will install with the official icon on the home screen, opening in standalone full-screen mode like a native app without browser bars!

---

## 📄 License

MIT License. Designed with ❤️ for Nepal's Kirana community.

