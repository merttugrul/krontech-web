import type { Metadata } from 'next';
import { UserForm } from '@/components/admin/users/UserForm';

export const metadata: Metadata = { title: 'Yeni Kullanıcı' };

export default function AdminUserNewPage() {
  return <UserForm mode="create" />;
}
