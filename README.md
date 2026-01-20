# SLIMS | ABU Zaria
### SIWES Logbook & Internship Management System

SLIMS is a specialized digital ecosystem built for the SIWES Unit at Ahmadu Bello University.
It replaces the traditional paper-based logbook with a streamlined, transparent, and
verifiable digital workflow.

## 🏛 Institutional Context
Designed specifically for the academic requirements of ABU Zaria, SLIMS ensures that
students across all faculties can maintain accurate records of their industrial
training while providing real-time oversight for both school and industry supervisors.

## 🚀 Key Features

### Student Portal
- **Secure Authentication**: Login with Matric Number and State of Origin
- **Profile Management**: Complete academic and personal information setup
- **Daily Logbook Entries**: Record activities from Monday to Saturday, Week 1-24
- **Weekly Summaries**: Submit comprehensive weekly reports
- **Sketch & Diagram Suite**: Upload technical drawings or create diagrams using integrated Draw.io
- **Progress Tracking**: View submission status and supervisor feedback
- **PDF Generation**: Download complete logbook in official ABU format

### Supervisor Workflow
- **Automated Notifications**: Weekly email alerts for pending reviews
- **Dual Supervision**: Support for both Industry and School supervisors
- **Review Interface**: Comment on daily entries and weekly summaries
- **Date-stamped Comments**: Automatic timestamping of all feedback
- **Student Progress View**: Comprehensive view of student activities

### Technical Specifications
- **Logbook Configuration**: Flexible week duration (default 24 weeks, admin-configurable)
- **Multi-state Support**: All 36 Nigerian states + FCT
- **File Upload**: Support for images, diagrams, and technical sketches
- **Real-time Updates**: Instant notification of supervisor assignments and comments

## 🛠 Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI Framework**: Shadcn UI, Tailwind CSS v4 (CSS-first configuration)
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (Beta)
- **Email Service**: Nodemailer
- **PDF Generation**: jsPDF with autoTable
- **Diagram Editor**: Draw.io embedded integration
- **Security**: CSRF Protection, Rate Limiting middlewares
- **Validation**: Zod schema validation with type-safe helpers

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14 or higher
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mvp-slims
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and update with your configuration:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/slims_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@abu.edu.ng"
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Database Schema

### Core Models

- **User**: Authentication and role management
- **Student**: Student profile and academic information
- **IndustrySupervisor**: Industry-based supervisors
- **SchoolSupervisor**: University lecturers/supervisors
- **Logbook**: Main training logbook container
- **LogbookEntry**: Daily activity entries (Mon-Sat)
- **WeeklyReport**: Week summaries and supervisor comments
- **Attachment**: File uploads (sketches, diagrams, documents)
- **SystemConfig**: Admin configuration settings

### User Roles

- `STUDENT`: Regular students
- `INDUSTRY_SUPERVISOR`: Company/organization supervisors
- `SCHOOL_SUPERVISOR`: ABU lecturers
- `ADMIN`: System administrators

## 🔐 Authentication Flow

### Students
1. Sign up with Matric Number, State, and Password
2. Complete profile with academic information
3. Create logbook with company details
4. Add industry supervisor information

### Supervisors
1. Auto-created when student adds them to logbook
2. Receive email with login credentials
3. Access review interface via email links

## 📧 Email Notifications

The system automatically sends emails for:
- Weekly report submissions (to both supervisors)
- Supervisor comment notifications (to students)
- New supervisor account creation

## 📄 PDF Logbook Generation

Students can download a complete PDF logbook including:
- Student information
- Company details
- All daily entries organized by week
- Weekly summaries
- Supervisor comments
- Official ABU formatting

## 🔧 Admin Features

Administrators can:
- Configure default training duration
- Assign school supervisors to students
- View system-wide statistics
- Manage user accounts

## 🛡 Security Features

### CSRF Protection
- Automatic token generation and validation
- SameSite cookie protection
- Configurable token expiry (15 minutes default)
- Exempt routes for webhooks and public APIs

### Rate Limiting
- Per-client request throttling (100 requests/minute default)
- Automatic cleanup of expired entries
- Rate limit headers in responses
- Configurable exemptions for health checks

### Request Validation
- Type-safe Zod schema validation
- Automatic error formatting
- Body and query parameter validation
- Safe parsing with detailed error messages

### Middleware Architecture
All middlewares are located in `src/middlewares/` and can be composed together:
- `csrfMiddleware` - CSRF token validation
- `rateLimitMiddleware` - Rate limiting
- Custom middlewares can be easily added

See `src/middlewares/README.md` for detailed documentation.

## 📱 Key User Journeys

### Student Journey
1. Register → Complete Profile
2. Create Logbook → Add Supervisor Details
3. Daily Entries (Mon-Sat) → Upload Sketches
4. Weekly Summary → Notify Supervisors
5. View Feedback → Download PDF

### Supervisor Journey
1. Receive Email Notification
2. Click Review Link
3. View Student Activities
4. Provide Comments
5. Submit Review

## 🏗 Project Structure

```
mvp-slims/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Student dashboard
│   │   ├── logbook/           # Logbook features
│   │   └── supervisor/        # Supervisor portal
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── dashboard/        # Dashboard components
│   │   └── supervisor/       # Supervisor components
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   ├── email.ts          # Email service
│   │   ├── pdf-generator.ts # PDF generation
│   │   └── utils.ts          # Validation & helpers
│   ├── middlewares/           # Custom middlewares
│   │   ├── csrf.ts           # CSRF protection
│   │   ├── rate-limit.ts     # Rate limiting
│   │   └── README.md         # Middleware docs
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
├── public/
│   └── uploads/              # User uploads
├── proxy.ts                   # Next.js 16 proxy file
└── package.json
```

### Key Architecture Changes (Next.js 16 & Tailwind v4)

**Next.js 16:**
- `middleware.ts` → `proxy.ts` (network boundary proxy)
- Function renamed from `middleware` to `proxy`
- Runs on Node.js runtime (not Edge)

**Tailwind CSS v4:**
- CSS-first configuration using `@theme` directive
- No more `tailwind.config.ts` file
- Theme defined directly in `globals.css`
- Plugins imported via `@plugin` directive

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## 🚢 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Ensure all production environment variables are set:
- Database connection string
- NextAuth secret (generate with `openssl rand -base64 32`)
- Email server credentials
- Production URL

## 📚 API Documentation

### Student Endpoints
- `POST /api/auth/register` - Student registration
- `GET /api/logbook/active` - Get active logbook
- `POST /api/logbook/entry` - Create daily entry
- `POST /api/logbook/reports` - Submit weekly summary
- `POST /api/logbook/notify` - Notify supervisors
- `GET /api/logbook/pdf` - Generate PDF logbook

### Supervisor Endpoints
- `POST /api/supervisor/review/[id]` - Submit review comment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Ahmadu Bello University, Zaria
- SIWES Unit, ABU
- All contributing developers and testers

## 📞 Support

For support and questions:
- Email: siwes@abu.edu.ng
- Website: https://abu.edu.ng

---

**Built with ❤️ for ABU Students**
