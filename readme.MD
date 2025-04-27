# Employee Intelligence

Employee Intelligence is a real-time employee monitoring and productivity analytics platform. It provides hosts (managers) with live insights into employee activity, behavior logs, and periodic screenshots, while respecting privacy and focusing on actionable data.

---

## Features

- **Employee Registration:** Employees can join sessions and identify themselves.
- **Behavior Monitoring:** Automatic detection and logging of employee status (working, idle, inactive, etc.).
- **Random Screenshot Capture:** Screenshots are captured at random intervals during a session and securely uploaded to the backend.
- **Work Submission:** Employees can submit files and work descriptions.
- **Host Dashboard:** Hosts can view all employees, their latest statuses, activity logs, and screenshots in real time.
- **WebSocket Support:** For real-time updates between employees and hosts.
- **PostgreSQL Database:** All data is securely stored and relationally organized.

---

## Tech Stack

- **Frontend:** React (TypeScript), Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (Supabase-compatible)
- **ORM:** Drizzle ORM
- **WebSocket:** `ws` package for real-time updates

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm
- PostgreSQL database (Supabase or self-hosted)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd EmployeeIntelligence
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Create a `.env` file in the root:
     ```
     DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
     ```
   - Replace with your actual database credentials.
4. **Run database migrations (if applicable):**
   - If using Drizzle ORM migrations, follow your migration setup (not included here).
5. **Start the development server:**
   ```bash
   npm run dev
   ```
   - The backend will start on `127.0.0.1:5000` by default.

---

## Usage

- **Employee:** Join as an employee, and your activity will be automatically monitored. Screenshots are captured at random intervals and sent to the server.
- **Host:** Join as a host to view all employees, their statuses, activity logs, and screenshots.

---

## Project Structure

```
/client              # Frontend React app
/server              # Express backend
/shared              # Shared TypeScript types and database schema
.env                 # Environment variables
package.json         # Project scripts and dependencies
```

---

## Security & Privacy

- Screenshots are only taken with user permission and are stored as base64-encoded images in the database.
- No continuous screen recording; only periodic screenshots.
- All data is transmitted securely between client and server.

---

## Troubleshooting

- **PayloadTooLargeError:** If you see this error, increase the body size limit in `server/index.ts`:
  ```typescript
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));
  ```
- **Database connection issues:** Ensure your `DATABASE_URL` is correct and the database is accessible.

---

## License

MIT License

---

## Credits

- Built with ❤️ using React, Express, and Drizzle ORM.