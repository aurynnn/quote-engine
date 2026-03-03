# PROJECT_MANIFESTO.md - AI Quote Engine

## 🎯 Vision

Build an AI-powered Quote/Estimate Platform that automates pricing calculations using a constraint engine and LLM. Parse Excel files, apply business rules, and generate professional quotes.

---

## 1. 🏗️ ARCHITECTURE

### 1.1 Tech Stack
- **Backend**: Node.js (Express/Astro SSR)
- **Frontend**: Svelte + Astro
- **Database**: MongoDB
- **LLM**: MiniMax for quote generation
- **File Processing**: xlsx, pdf-parse

### 1.2 Project Structure
```
quote-engine/
├── src/
│   ├── components/          # Svelte UI components
│   ├── lib/                 # Shared utilities
│   │   ├── mongodb.ts       # MongoDB connection
│   │   ├── minimax.ts       # LLM client
│   │   └── excel-parser.ts   # Excel processing
│   ├── pages/               # Astro pages
│   │   ├── api/             # API routes
│   │   ├── dashboard/       # Dashboard pages
│   │   └── index.astro      # Landing page
│   └── styles/              # CSS/Tailwind
├── data/                   # Static data files
├── scripts/                 # Utility scripts
└── tests/                  # Test files
```

---

## 2. 📊 DATA INGESTION

### 2.1 Excel Parser
- **Input**: .xlsx files with pricing data
- **Process**:
  1. Read file via `xlsx` library
  2. Parse rows into structured objects
  3. Validate data structure
  4. Store in MongoDB
- **Output**: Structured JSON in MongoDB

### 2.2 Data Models (MongoDB)

```typescript
// User - Authentication
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  name: string,
  company: string,
  plan: "free" | "starter" | "pro" | "enterprise",
  createdAt: Date,
  updatedAt: Date
}

// PriceItem - Individual pricing elements
{
  _id: ObjectId,
  category: string,           // e.g., "Labor", "Materials", "Services"
  name: string,               // e.g., "Web Development", "Design"
  unit: string,               // e.g., "hour", "page", "item"
  basePrice: number,         // Base price per unit
  minPrice: number,          // Minimum price
  multiplier: number,        // Price multiplier factors
  createdAt: Date,
  updatedAt: Date
}

// PricingRule - Business constraints
{
  _id: ObjectId,
  name: string,               // e.g., "Minimum Order"
  type: string,               // "minimum", "buffer", "discount", "tax"
  value: number,              // e.g., 150 (for minimum), 0.15 (for 15%)
  conditions: {               // When this rule applies
    category?: string,
    totalAbove?: number
  },
  active: boolean
}

// Quote - Generated quotes
{
  _id: ObjectId,
  quoteNumber: string,
  clientName: string,
  clientEmail: string,
  items: [{
    name: string,
    quantity: number,
    unitPrice: number,
    total: number
  }],
  subtotal: number,
  buffer: number,
  tax: number,
  total: number,
  status: "draft" | "sent" | "accepted" | "rejected",
  rawPrompt: string,
  generatedAt: Date,
  expiresAt: Date
}

// KnowledgeBase - Parsed Excel data
{
  _id: ObjectId,
  sourceFile: string,
  data: Object,              // Parsed JSON from Excel
  rowCount: number,
  uploadedAt: Date
}
```

---

## 3. ⚙️ CONSTRAINT ENGINE

### 3.1 Built-in Rules

| Rule | Description | Default Value |
|------|-------------|---------------|
| **Minimum** | Minimum quote total | $150 |
| **Buffer** | % add for vague descriptions | 15% |
| **Tax** | Tax rate | 0% (configurable) |
| **Discount** | Volume discount threshold | 10% |

### 3.2 Rule Application Flow
```
User Input → Validate → Apply Rules → Calculate → Generate Quote
```

### 3.3 Rule Priority
1. Minimum price check
2. Category-specific rules
3. Buffer for vague items
4. Volume discounts
5. Tax calculation

---

## 4. 🤖 QUOTE GENERATION

### 4.1 LLM Integration (MiniMax)
- **Model**: MiniMax-M2.5
- **Input**: User prompt + MongoDB data
- **Output**: Structured JSON quote

### 4.2 Prompt Template
```
You are a pricing expert. Based on the following knowledge base and user requirements, generate a detailed quote.

KNOWLEDGE BASE:
{parsed_pricing_data}

USER REQUIREMENTS:
{user_prompt}

CONSTRAINTS:
- Minimum quote: $150
- Buffer for vague items: 15%
- Output ONLY valid JSON

Generate a quote with:
- Line items with quantities and prices
- Subtotal
- Buffer (if applicable)
- Tax (if applicable)
- Total
```

### 4.3 API Endpoint
```
POST /api/quote
{
  "clientName": "string",
  "clientEmail": "string", 
  "prompt": "string"
}

Response:
{
  "quote": {
    "items": [...],
    "subtotal": number,
    "buffer": number,
    "tax": number,
    "total": number
  }
}
```

---

## 5. 🎨 UI/UX

### 5.1 Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Marketing page |
| **Dashboard** | `/dashboard` | Main dashboard |
| **Upload** | `/dashboard/upload` | Excel file upload |
| **Quotes** | `/dashboard/quotes` | Quote list |
| **Quote Detail** | `/dashboard/quote/[id]` | View/edit quote |
| **Settings** | `/dashboard/settings` | Pricing rules config |

### 5.2 Dashboard Components
- **FileUploader**: Drag & drop Excel upload
- **QuoteCard**: Quote summary card
- **QuoteEditor**: Edit line items
- **PricingTable**: View/edit prices
- **RuleBuilder**: Create pricing rules

### 5.3 UI Features
- Dark/Light theme
- Glassmorphism design
- Responsive layout
- Real-time quote preview

---

## 6. 📦 DEPENDENCIES

### Core
- `astro` - Framework
- `@astrojs/svelte` - UI components
- `mongodb` - Database
- `xlsx` - Excel parsing
- `minimax` - LLM client

### Utilities
- `zod` - Validation
- `nodemailer` - Email notifications
- `pdfkit` - PDF generation

### Authentication
- `lucia` - Auth framework (or simple JWT)

---

## 7. 🚀 PHASED ROADMAP

### Phase 1: Foundation (Week 1)
- [x] Set up Astro + Svelte project
- [x] Configure MongoDB connection
- [x] Create data models
- [x] Build folder structure

### Phase 1.5: Authentication (Week 1-2)
- [ ] User registration/login
- [ ] JWT session management
- [ ] Protected dashboard routes

### Phase 2: Data Ingestion (Week 2)
- [ ] Excel parser implementation
- [ ] Upload API endpoint
- [ ] Knowledge Base CRUD
- [ ] Price management UI

### Phase 3: Constraint Engine (Week 3)
- [ ] Rule engine implementation
- [ ] Rule management API
- [ ] Rule configuration UI
- [ ] Testing & validation

### Phase 4: Quote Generation (Week 4)
- [ ] MiniMax integration
- [ ] Quote generation API
- [ ] Response parsing
- [ ] Error handling

### Phase 5: Dashboard UI (Week 5)
- [ ] Dashboard layout
- [ ] Quote list view
- [ ] Quote detail/edit
- [ ] Settings page

### Phase 6: Polish (Week 6)
- [ ] PDF export
- [ ] Email notifications
- [ ] Theme system
- [ ] Performance optimization

---

## 8. ✅ SUCCESS CRITERIA

| Metric | Target |
|--------|--------|
| Excel upload success rate | >95% |
| Quote generation time | <5s |
| Quote accuracy | >90% |
| UI response time | <200ms |
| Test coverage | >80% |

---

*Last Updated: 2026-03-03*
*Version: 1.0.0*
