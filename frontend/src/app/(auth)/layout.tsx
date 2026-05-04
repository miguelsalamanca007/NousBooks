import GoogleAuthProvider from "@/components/GoogleAuthProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleAuthProvider>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </GoogleAuthProvider>
  );
}
