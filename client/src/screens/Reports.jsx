import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/currency';
import IconTile from '../components/IconTile';
import { IconChevronLeft, IconFileSpreadsheet, IconFilePdf, IconChevronRight } from '../components/icons';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildWeeklyLabels(bucketCount) {
  const labels = [];
  const now = new Date();
  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const startMonth = MONTH_SHORT[start.getMonth()];
    const endMonth = MONTH_SHORT[end.getMonth()];

    labels.push(
      startMonth === endMonth
        ? `${startMonth} ${start.getDate()}–${end.getDate()}`
        : `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}`
    );
  }
  return labels;
}

export default function Reports() {
  const { activeSpaceId } = useSpace();
  const { user } = useAuth();
  const currency = user?.currencyPreference || 'PKR';
  const navigate = useNavigate();

  const [period, setPeriod] = useState('weekly');
  const [trend, setTrend] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [mom, setMom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBucketIndex, setSelectedBucketIndex] = useState(null);

  const load = useCallback(async () => {
    if (!activeSpaceId) return;
    setLoading(true);
    setError('');
    try {
      const [trendRes, breakdownRes, momRes] = await Promise.all([
        api.get(ENDPOINTS.reports.trend(activeSpaceId), { params: { period } }),
        api.get(ENDPOINTS.reports.categoryBreakdown(activeSpaceId)),
        api.get(ENDPOINTS.reports.momComparison(activeSpaceId)),
      ]);

      let buckets = trendRes.data.buckets;
      if (period === 'weekly') {
        const niceLabels = buildWeeklyLabels(buckets.length);
        buckets = buckets.map((b, i) => ({ ...b, label: niceLabels[i] }));
      }

      setTrend({ ...trendRes.data, buckets });
      setBreakdown(breakdownRes.data);
      setMom(momRes.data);
      setSelectedBucketIndex(buckets.length - 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [activeSpaceId, period]);

  useEffect(() => {
    load();
  }, [load]);

  function exportFile(type) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const path = type === 'csv' ? ENDPOINTS.reports.exportCsv(activeSpaceId) : ENDPOINTS.reports.exportPdf(activeSpaceId);
    window.open(`${base}${path}`, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-danger)]">
        {error}
      </div>
    );
  }

  const trendMax = trend && trend.buckets.length > 0 ? Math.max(...trend.buckets.map((b) => b.total), 1) : 1;
  const breakdownMax = breakdown.length > 0 ? Math.max(...breakdown.map((b) => b.total)) : 1;
  const breakdownTotal = breakdown.reduce((sum, b) => sum + b.total, 0);
  const selectedBucket = trend && selectedBucketIndex !== null ? trend.buckets[selectedBucketIndex] : null;

  let momCaption = null;
  let momCaptionColor = 'var(--text-muted)';
  if (mom) {
    if (mom.lastMonth === 0 && mom.thisMonth === 0) {
      momCaption = 'No spending recorded yet.';
    } else if (mom.lastMonth === 0) {
      momCaption = 'No spending last month to compare against.';
    } else {
      const arrow = mom.diff > 0 ? '↑' : mom.diff < 0 ? '↓' : '–';
      const pct = Math.abs(mom.pctChange);
      momCaption = `${arrow} ${formatMoney(Math.abs(mom.diff), currency)} (${pct}%) vs ${formatMoney(mom.lastMonth, currency)} last month`;
      // Was hardcoded #D8453A / #0C7C59 — swapped to CSS vars so this
      // respects dark mode's brighter danger/accent tones instead of
      // rendering the flat light-mode hex on a dark background.
      momCaptionColor = mom.diff > 0 ? 'var(--text-danger)' : mom.diff < 0 ? 'var(--text-accent)' : 'var(--text-muted)';
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 18px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Back">
          <IconChevronLeft size={18} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Reports</p>
      </div>

      {mom && (
        <div style={{ background: 'var(--surface-1)', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 4px' }}>This month vs last month</p>
          <p className="tabular-nums" style={{ fontSize: 26, fontWeight: 500, margin: '0 0 8px' }}>
            {formatMoney(mom.thisMonth, currency)}
          </p>
          <p style={{ fontSize: 12, margin: 0, color: momCaptionColor, lineHeight: 1.4 }}>
            {momCaption}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Trend</p>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--surface-1)',
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          <button
            onClick={() => setPeriod('weekly')}
            style={{
              border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', background: period === 'weekly' ? 'var(--surface-2)' : 'transparent',
              color: period === 'weekly' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            style={{
              border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', background: period === 'monthly' ? 'var(--surface-2)' : 'transparent',
              color: period === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Monthly
          </button>
        </div>
      </div>

      {selectedBucket && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 2px' }}>{selectedBucket.label}</p>
          <p className="tabular-nums" style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
            {formatMoney(selectedBucket.total, currency)}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {trend && trend.buckets.length > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, marginBottom: 8 }}>
                {trend.buckets.map((b, i) => {
                  const hasData = b.total > 0;
                  const heightPx = hasData ? Math.max((b.total / trendMax) * 120, 4) : 3;
                  const isSelected = i === selectedBucketIndex;
                  return (
                    <div
                      key={b.label}
                      onClick={() => setSelectedBucketIndex(i)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        height: 140,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: 9,
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: isSelected ? 600 : 400,
                          marginBottom: 3,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {hasData ? Math.round(b.total / 1000) + 'k' : ''}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: heightPx }}
                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          width: '100%',
                          // Was hardcoded '#0B6E4F' — now uses the live
                          // --text-accent variable, which correctly
                          // switches to the brighter dark-mode emerald
                          // (#2FD48F) for contrast on dark backgrounds.
                          backgroundColor: hasData
                            ? isSelected
                              ? 'var(--text-accent)'
                              : 'color-mix(in srgb, var(--text-accent) 55%, var(--border))'
                            : 'var(--border)',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
                {trend.buckets.map((b, i) => (
                  <div key={b.label} style={{ flex: 1, textAlign: 'center' }}>
                    <p
                      style={{
                        fontSize: 9.5,
                        color: i === selectedBucketIndex ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: i === selectedBucketIndex ? 500 : 400,
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {b.label}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>No trend data available.</p>
          )}
        </motion.div>
      </AnimatePresence>

      <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px' }}>Category breakdown (this month)</p>

      {breakdown.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>No expenses logged this month yet.</p>
      )}

      {breakdown.map((c) => {
        const pct = breakdownTotal > 0 ? ((c.total / breakdownTotal) * 100).toFixed(0) : 0;
        return (
          <div className="cat-row" key={c.categoryId}>
            <IconTile label={c.name} />
            <div className="cat-body">
              <div className="cat-top">
                <span>
                  {c.name} <span style={{ color: 'var(--text-muted)' }}>· {pct}%</span>
                </span>
                <span className="tabular-nums" style={{ fontWeight: 500 }}>
                  {formatMoney(c.total, currency)}
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(c.total / breakdownMax) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      <p className="settings-group-label" style={{ marginTop: 28 }}>Export</p>
      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => exportFile('csv')}>
        <IconFileSpreadsheet size={17} />
        <span className="settings-row-label">Export as CSV</span>
        <IconChevronRight size={15} color="var(--text-muted)" />
      </div>
      <div className="settings-row" style={{ borderBottom: 'none', cursor: 'pointer' }} onClick={() => exportFile('pdf')}>
        <IconFilePdf size={17} />
        <span className="settings-row-label">Export as PDF</span>
        <IconChevronRight size={15} color="var(--text-muted)" />
      </div>
    </div>
  );
}