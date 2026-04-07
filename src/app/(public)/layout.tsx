import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getContent } from "@/lib/content";
import { getPresignedUrl } from "@/lib/r2";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, logoKey] = await Promise.all([
    auth(),
    getContent("site_logo"),
  ]);
  const logoUrl = logoKey ? await getPresignedUrl(logoKey, 3600) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        logoUrl={logoUrl}
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                role: session.user.role,
              }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
