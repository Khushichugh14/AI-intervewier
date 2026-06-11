import { Navbar } from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "AI Interviewer | Premium AI-Powered Interview Preparation",
  description: "Upload your resume, generate custom AI questions, answer verbally using speech recognition, and get deep feedback with scores from a simulated senior interviewer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
