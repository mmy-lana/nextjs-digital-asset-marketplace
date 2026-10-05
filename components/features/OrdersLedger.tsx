'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Clock, RotateCcw } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassTabs } from '@/components/ui/GlassTabs';
import { useWallet } from '@/context/WalletContext';
import { getChainDescriptor } from '@/lib/constants';
import { cn, formatAddress, formatCryptoNumber, formatDateTime, formatFiat, formatRelativeTime } from '@/lib/utils';
import type { TransactionRecord } from '@/types/marketplace';

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'failed' | 'cancelled';

const STATUS_META: Record<
  TransactionRecord['status'],
  { label: string; tone: string }
> = {
  confirmed: { label: 'Confirmed', tone: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  pending: { label: 'Pending', tone: 'border-sky-400/30 bg-sky-500/10 text-sky-300' },
  failed: { label: 'Failed', tone: 'border-red-400/30 bg-red-500/10 text-red-300' },
  cancelled: { label: 'Cancelled', tone: 'border-white/15 bg-white/5 text-slate-400' },
};

/**
 * Order ledger and transaction history. Reads the persisted `TransactionRecord`
 * history from `WalletContext`, merging the seeded catalogue records with any
 * purchases settled in the current session.
 */
export function OrdersLedger() {
  const { transactions, wallet, resetHistory } = useWallet();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visible = useMemo(
    () =>
      statusFilter === 'all'
        ? transactions
        : transactions.filter((record) => record.status === statusFilter),
    [transactions, statusFilter]
  );

  const stats = useMemo(() => {
    const settled = transactions.filter((record) => record.status === 'confirmed');
    return {
      count: transactions.length,
      volumeEth: settled.reduce((total, record) => total + record.amountCrypto, 0),
      volumeUsd: settled.reduce((total, record) => total + record.amountFiatUsd, 0),
    };
  }, [transactions]);

  const tabs: { value: StatusFilter; label: string; badge?: number }[] = [
    { value: 'all', label: 'All orders', badge: transactions.length },
    {
      value: 'confirmed',
      label: 'Confirmed',
      badge: transactions.filter((r) => r.status === 'confirmed').length,
    },
    {
      value: 'pending',
      label: 'Pending',
      badge: transactions.filter((r) => r.status === 'pending').length,
    },
    {
      value: 'failed',
      label: 'Failed',
      badge: transactions.filter((r) => r.status === 'failed').length,
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      badge: transactions.filter((r) => r.status === 'cancelled').length,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">Order history</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {wallet.isConnected ? (
              <>
                Connected as{' '}
                <span className="font-mono text-cyan-300">{formatAddress(wallet.address)}</span>
              </>
            ) : (
              'Connect a wallet to settle new orders. Seeded history is shown below.'
            )}
          </p>
        </div>
        <GlassButton
          variant="ghost"
          onClick={resetHistory}
          iconLeft={<RotateCcw aria-hidden="true" className="size-4" />}
          data-testid="reset-history"
        >
          Reset history
        </GlassButton>
      </header>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Orders</dt>
          <dd className="mt-1 font-mono text-xl font-semibold text-slate-100">{stats.count}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Settled volume</dt>
          <dd className="mt-1 font-mono text-xl font-semibold text-cyan-300">
            {formatCryptoNumber(stats.volumeEth)} ETH
          </dd>
        </div>
        <div className="col-span-2 rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:col-span-1">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Settled (USD est.)</dt>
          <dd className="mt-1 font-mono text-xl font-semibold text-slate-100">
            {formatFiat(stats.volumeUsd)}
          </dd>
        </div>
      </dl>

      <GlassPanel padding="sm">
        <GlassTabs
          items={tabs}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as StatusFilter)}
          label="Filter orders by status"
          className="border-0 bg-transparent p-0"
        />
      </GlassPanel>

      {visible.length === 0 ? (
        <GlassPanel
          padding="lg"
          className="flex flex-col items-center justify-center gap-3 text-center"
          data-testid="orders-empty"
        >
          <Clock aria-hidden="true" className="size-10 text-slate-700" />
          <div>
            <p className="text-base font-semibold text-slate-200">
              No {statusFilter === 'all' ? '' : statusFilter} orders
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {statusFilter === 'all'
                ? 'Settle a purchase from the explore grid and it will appear here immediately.'
                : 'Try a different status filter to see the rest of your history.'}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/60 px-5 text-sm text-slate-100 transition-colors hover:border-cyan-400/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            Browse assets
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </GlassPanel>
      ) : (
        <GlassPanel padding="none" className="overflow-hidden">
          {/* Desktop table — wrapper scrolls horizontally if it ever exceeds the panel */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm" data-testid="orders-table">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3 font-medium">Asset</th>
                <th scope="col" className="px-4 py-3 font-medium">Chain</th>
                <th scope="col" className="px-4 py-3 font-medium">Counterparties</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => {
                const meta = STATUS_META[record.status];
                return (
                  <tr key={record.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <Image
                          src={record.assetThumbnail}
                          alt=""
                          aria-hidden="true"
                          width={36}
                          height={36}
                          className="size-9 shrink-0 rounded-lg border border-white/10 object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-100">{record.assetTitle}</span>
                          <span className="block truncate font-mono text-[10px] text-slate-600">{record.txHash}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{getChainDescriptor(record.chain).label}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {formatAddress(record.buyerAddress)} → {formatAddress(record.sellerAddress)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="block font-mono text-slate-200">
                        {formatCryptoNumber(record.amountCrypto)} {record.currency}
                      </span>
                      <span className="block text-[11px] text-slate-500">{formatFiat(record.amountFiatUsd)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium', meta.tone)}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500" title={formatDateTime(record.timestamp)}>
                      {formatRelativeTime(record.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col divide-y divide-white/5 md:hidden" data-testid="orders-cards">
            {visible.map((record) => {
              const meta = STATUS_META[record.status];
              return (
                <li key={record.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Image
                      src={record.assetThumbnail}
                      alt=""
                      aria-hidden="true"
                      width={44}
                      height={44}
                      className="size-11 shrink-0 rounded-lg border border-white/10 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-100">{record.assetTitle}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {getChainDescriptor(record.chain).label} · {record.currency}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', meta.tone)}>
                      {meta.label}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <dt className="text-slate-500">Amount</dt>
                      <dd className="font-mono text-slate-200">
                        {formatCryptoNumber(record.amountCrypto)} {record.currency}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Date</dt>
                      <dd className="text-slate-300" title={formatDateTime(record.timestamp)}>
                        {formatRelativeTime(record.timestamp)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Counterparties</dt>
                      <dd className="truncate font-mono text-slate-400">
                        {formatAddress(record.buyerAddress)} → {formatAddress(record.sellerAddress)}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}