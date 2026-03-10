import { LoginForm } from '@/components/admin/LoginForm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Login — Profile Picture Generator',
};

export default async function LoginPage() {
  const isAdmin = await getAdminSession();
  if (isAdmin) redirect('/admin');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <LoginForm />
    </div>
  );
}
