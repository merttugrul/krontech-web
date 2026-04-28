'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  listFormSubmissions,
  listAllFormSubmissions,
  type ListFormSubmissionsParams,
} from '@/lib/admin/api-forms';
import {
  getDataString,
  getMessageColumnText,
  formSubmissionsToCsvString,
} from '@/lib/admin/form-submission-utils';
import type { AdminFormSubmission, FormType } from '@/lib/admin/types';
import { DataTable, AdminPagination, type ColumnDef } from '@/components/admin/DataTable';
import { getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 30;

export function FormsList() {
  const [page, setPage] = useState(1);
  const [formType, setFormType] = useState<FormType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const listFilters = useMemo(
    () => ({
      ...(formType !== 'all' ? { formType } : {}),
      ...(search ? { search } : {}),
      ...(fromDate ? { fromDate: `${fromDate}T00:00:00.000Z` } : {}),
      ...(toDate ? { toDate: `${toDate}T23:59:59.999Z` } : {}),
    }),
    [formType, search, fromDate, toDate],
  );

  const params: ListFormSubmissionsParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      ...listFilters,
    }),
    [page, listFilters],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'forms', params],
    queryFn: () => listFormSubmissions(params),
  });

  const downloadCsv = async () => {
    if (!data?.total) return;
    setExporting(true);
    try {
      const rows = await listAllFormSubmissions(listFilters);
      const csv = formSubmissionsToCsvString(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `form-submissions-${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnDef<AdminFormSubmission>[] = [
    {
      key: 'formType',
      header: 'Form',
      width: '88px',
      render: (row) => (
        <span
          className={
            row.formType === 'demo'
              ? 'rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800'
              : 'rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800'
          }
        >
          {row.formType}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tarih',
      width: '150px',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-kron-navy/90">
          {formatDate(row.createdAt, 'tr', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Ad soyad',
      width: '140px',
      render: (row) => (
        <div className="min-w-0 max-w-[160px]">
          <p className="truncate font-medium text-kron-navy" title={getDataString(row.data, 'name')}>
            {getDataString(row.data, 'name') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      width: '200px',
      render: (row) => {
        const e = getDataString(row.data, 'email');
        return e ? (
          <a
            href={`mailto:${e}`}
            className="block max-w-[200px] truncate text-kron-blue hover:underline"
            title={e}
          >
            {e}
          </a>
        ) : (
          '—'
        );
      },
    },
    {
      key: 'company',
      header: 'Şirket',
      width: '140px',
      render: (row) => (
        <span className="block max-w-[160px] truncate" title={getDataString(row.data, 'company')}>
          {getDataString(row.data, 'company') || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      width: '120px',
      render: (row) => (
        <span className="whitespace-nowrap text-xs">{getDataString(row.data, 'phone') || '—'}</span>
      ),
    },
    {
      key: 'message',
      header: 'Mesaj',
      render: (row) => {
        const text = getMessageColumnText(row);
        return (
          <p
            className="line-clamp-2 max-w-[min(100vw,320px)] text-xs leading-snug text-kron-navy/90"
            title={text}
          >
            {text}
          </p>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '72px',
      align: 'right',
      render: (row) => (
        <Link href={`/admin/forms/${row.id}` as never} className="btn-ghost text-xs">
          Detay
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">Form gönderileri</h1>
          <p className="mt-1 text-sm text-kron-gray">İletişim ve demo talepleri.</p>
        </div>
        <button
          type="button"
          onClick={() => void downloadCsv()}
          disabled={!data?.total || exporting}
          className="rounded-md border border-kron-light bg-kron-navy px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-kron-navy/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {exporting ? 'Hazırlanıyor…' : 'CSV İndir'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-kron-light bg-white p-3 shadow-sm">
        <input
          type="search"
          placeholder="E-posta, isim, şirket ara"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1 rounded-md border border-kron-light bg-white px-3 py-1.5 text-sm outline-none focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20"
        />
        <select
          value={formType}
          onChange={(e) => {
            setFormType(e.target.value as FormType | 'all');
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2.5 py-1.5 text-sm outline-none focus:border-kron-blue"
        >
          <option value="all">Tüm formlar</option>
          <option value="contact">Contact</option>
          <option value="demo">Demo</option>
        </select>
        <input
          type="date"
          aria-label="Başlangıç tarihi"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2 py-1.5 text-sm"
        />
        <input
          type="date"
          aria-label="Bitiş tarihi"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-kron-light bg-white px-2 py-1.5 text-sm"
        />
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, 'Liste yüklenemedi.')}
        </div>
      )}

      <DataTable<AdminFormSubmission>
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Henüz gönderi yok."
      />

      {data && (
        <AdminPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
