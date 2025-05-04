# 🎓 ERP LMS Backend (NestJS + Prisma)

This is the backend service of the **ERP + LMS system** for educational centers. Built using **NestJS** and **Prisma ORM**, it offers a clean, modular API for managing students, teachers, courses, payments, and user authentication with role-based access.

> 🔗 **Live Frontend Demo:** [erp.web-code.uz/courses](https://erp.web-code.uz/courses)

## 🔐 Test Login

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | Admin01  | Admin01!A  |

---

## 🚀 Features

- 👨‍🎓 **Students** – Full CRUD, group assignment, payment history
- 👩‍🏫 **Teachers** – Profiles, salary tracking, group assignments
- 📚 **Courses & Groups** – Management and filtering
- 💳 **Payments** – Student payments and teacher salaries
- 🔐 **Authentication** – Login with JWT + OTP (optional)
- 🧑‍💼 **Admin Panel** – Dashboard stats and management

---

## 🛠️ Technologies Used

- **NestJS** – Scalable server-side Node.js framework
- **Prisma** – Next-gen ORM for PostgreSQL
- **PostgreSQL** – Relational database
- **JWT** – Secure token-based authentication
- **Class-validator** – Input validation
- **Dotenv** – Environment variable management
- **Docker (optional)** – Deployment support

---

## 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/SSR707/erp-backend.git

# 2. Navigate into the project
cd erp-backend

# 3. Install dependencies
npm install

# 4. Configure your environment
cp .env.example .env
# Fill in your DB credentials and secrets

# 5. Generate Prisma client and apply schema
npx prisma generate
npx prisma migrate dev --name init

# 6. Start the development server
npm run start:dev
```

## 🧩 Prisma Setup
Database models are located in prisma/schema.prisma

Use npx prisma studio to browse your DB

To update schema:

```bash
npx prisma migrate dev --name your_migration_name
```
## 🔗 API Routes (prefix: /api/v1/)
auth – Register, login, OTP verification, and role-based access

admin – Admin profile and system-level access

students – Manage student profiles, group assignments, and payments

student-payment – Student payment tracking and history

teachers – Teacher profile management and salaries

teacher-payment – Teacher salary payments and tracking

groups – Group creation, editing, and member assignment

group-member – Assigning students/teachers to groups

courses – Full CRUD for courses and linking to groups

dashboard – Overall statistics and financial summaries

## 📈 Roadmap
✅ Role-based admin system

✅ Payment & salary logic

✅ Full group and course management

⏳ SMS/Email notifications

⏳ Role login for students and teachers

⏳ Reporting & export system


## 🧑‍💻 Author
Developed & maintained by SSR707
📧 Email: samandarshavkatov07@gmail.com
