import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            SLIMS
          </h1>
          <p className="text-xl text-gray-600">
            SIWES Logbook & Internship Management System
          </p>
          <p className="text-lg text-gray-500">
            Ahmadu Bello University, Zaria
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome to Your Digital SIWES Logbook
          </h2>
          <p className="text-gray-600">
            A streamlined platform for managing your industrial training experience,
            daily entries, sketches, and supervisor interactions.
          </p>

          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <Link href="/auth/signin">
              <Button className="w-full" size="lg">
                Student Login
              </Button>
            </Link>
            <Link href="/supervisor/signin">
              <Button className="w-full" size="lg" variant="outline">
                Supervisor Login
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Daily Entries</h3>
            <p className="text-gray-600 text-sm">
              Log your activities from Monday to Saturday, Week 1-24
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Sketch & Diagram</h3>
            <p className="text-gray-600 text-sm">
              Upload technical drawings or create diagrams with integrated tools
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Auto Notifications</h3>
            <p className="text-gray-600 text-sm">
              Supervisors get weekly updates for reviews and comments
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
