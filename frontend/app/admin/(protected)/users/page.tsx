import type { Metadata } from 'next';
import { UsersList } from '@/components/admin/users/UsersList';

export const metadata: Metadata = { title: 'Kullanıcılar' };

export default function AdminUsersPage() {
  return <UsersList />;
}
