A full‑stack web app that lets users practice interview questions, track progress, and generate PDF reports.

Table of Contents
About the Project
Tech Stack
Prerequisites
Getting Started
Backend (Spring Boot)
Frontend (Next.js)
Docker Compose (optional)
API Reference
Environment Variables
Project Structure
Running Tests
Contributing


License
About the Project
The Interview‑Prep Platform provides:

User registration / login (JWT‑based)
CRUD operations for questions, answers, and categories
PDF generation of interview summaries (using Apache PDFBox)
A modern, responsive UI built with Next.js 16 and Tailwind CSS
Tech Stack
Layer	Technology
Backend	Spring Boot 4.0.6, Spring Data JPA, H2 (in‑memory) & PostgreSQL, JWT, Maven
Frontend	Next.js 16, React 19, TailwindCSS, Recharts
DevOps	Docker, Docker‑Compose, Maven Wrapper
Language	Java 21, JavaScript/TypeScript
Prerequisites
Java 21 (or use the provided ./mvnw wrapper)
Node ≥ 20 (npm comes with it)
Docker (optional, for the all‑in‑one compose setup)
Git (to clone the repo)
Getting Started
Tip: The backend now listens on port 8081 (changed from 8080). All frontend API calls point to this port.

Backend (Spring Boot)
bash
# From the project root
cd backend
# Start the app (Maven wrapper)
./mvnw spring-boot:run
The API will be reachable at: http://localhost:8081/api/**.
You can verify it’s running with:

bash
curl http://localhost:8081/actuator/health
Frontend (Next.js)
bash
# From the project root
cd frontend
npm install          # install deps (only needed once)
npm run dev          # starts dev server on http://localhost:3000
The UI automatically talks to the backend on http://localhost:8081.

Docker Compose (optional)
If you prefer an isolated environment:

bash
docker compose up --build
Backend: http://localhost:8081
Frontend: http://localhost:3000
The docker-compose.yml already maps the correct ports.

API Reference
Endpoint	Method	Description
/api/auth/login	POST	Authenticate user – returns JWT
/api/auth/register	POST	Create a new user
/api/questions	GET/POST/PUT/DELETE	CRUD for interview questions
/api/categories	GET/POST/PUT/DELETE	Manage question categories
/api/reports/pdf	GET	Download PDF summary (protected)
Note: All endpoints are protected with a Bearer token except /login and /register.

Environment Variables
Variable	Location	Default	Description
SPRING_DATASOURCE_URL	backend/src/main/resources/application.yml	jdbc:h2:mem:interviewdb	DB connection string
SPRING_DATASOURCE_USERNAME	same	sa	DB user
SPRING_DATASOURCE_PASSWORD	same	(empty)	DB password
JWT_SECRET	backend/src/main/resources/application.yml	mySecretKey	Used to sign JWTs
NEXT_PUBLIC_API_URL	frontend/.env.local (create)	http://localhost:8081/api	Base URL for the frontend fetch calls
Create a .env.local in frontend/ if you need to override the API URL.

Project Structure
/backend
   └─ src/main/java/com/interviewprep/platform   # Java source
   └─ pom.xml                                   # Maven build
/frontend
   └─ src/
       └─ app/                                 # Next.js pages
       └─ context/AuthContext.js               # Auth logic (updated to port 8081)
   └─ next.config.mjs
   └─ package.json
docker-compose.yml
README.md
LICENSE
Running Tests
Backend
bash
cd backend
./mvnw test
Frontend
bash
cd frontend
npm run test   # uses Jest (if configured)
Contributing
Fork the repo
Create a feature branch (git checkout -b feature/awesome-feature)
Commit your changes with clear messages
Open a Pull Request
Please keep the code style consistent (use Lombok in Java, Prettier in JS) and run the test suite before submitting.

License
Distributed under the MIT License. See LICENSE for details.

Quick Checklist (for new developers)
 Ensure Java 21 (or use Maven wrapper) is installed.
 Ensure Node 20+ is installed.
 Run backend (./mvnw spring-boot:run).
 Run frontend (npm run dev).
 Verify API calls succeed (no more ERR_CONNECTION_REFUSED).
Happy coding!


