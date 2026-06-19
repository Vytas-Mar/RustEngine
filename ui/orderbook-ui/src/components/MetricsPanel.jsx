import { useEffect, useState } from "react";

const fmt = (ns) => {
  if (ns == null) return "—";
  if (ns < 1000) return `${ns} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(2)} µs`;
  return `${(ns / 1_000_000).toFixed(2)} ms`;
};

const formatRelative = (unixSecs) => {
  if (!unixSecs) return "unknown";
  const diff = Math.floor(Date.now() / 1000) - unixSecs;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const BarVis = ({ p50, p99, p999 }) => {
  const max = p999 || 1;
  const pct = (v) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="bar-vis">
      <div className="bar-row">
        <span className="bar-label">p50</span>
        <div className="bar-track">
          <div className="bar-fill bid-bg" style={{ width: pct(p50) }} />
        </div>
        <span className="bar-value">{fmt(p50)}</span>
      </div>
      <div className="bar-row">
        <span className="bar-label">p99</span>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: pct(p99) }} />
        </div>
        <span className="bar-value">{fmt(p99)}</span>
      </div>
      <div className="bar-row">
        <span className="bar-label">p99.9</span>
        <div className="bar-track">
          <div className="bar-fill ask-bg" style={{ width: pct(p999) }} />
        </div>
        <span className="bar-value">{fmt(p999)}</span>
      </div>
    </div>
  );
};

const MetricsPanel = () => {
  const [suite, setSuite] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/bench-results.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setSuite)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Metrics</h2>
        <span>
          {suite
            ? `commit ${suite.commit} · ${formatRelative(suite.generated_at_unix_secs)}`
            : err
              ? "no data"
              : "loading…"}
        </span>
      </div>

      {err && (
        <div className="metrics-empty">
          Couldn't load <code>bench-results.json</code>. Run{" "}
          <code>cargo run --release --bin bench_export</code> from the workspace
          root to generate it.
        </div>
      )}

      {suite && (
        <div className="metrics-body">
          <div className="metrics-note">
            Native Rust, single-threaded, Apple Silicon CPU. Per-event timing
            via <code>Instant::now()</code> + HDR Histogram. Run via{" "}
            <code>cargo run --release --bin bench_export</code>.
          </div>

          <div className="metrics-table-wrap">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Workload</th>
                  <th>Samples</th>
                  <th>Mean</th>
                  <th>p50</th>
                  <th>p99</th>
                  <th>p99.9</th>
                  <th>p99.99</th>
                  <th>Max</th>
                </tr>
              </thead>
              <tbody>
                {suite.benches.map((b) => (
                  <tr key={b.name}>
                    <td className="bench-name">{b.name}</td>
                    <td>{b.samples.toLocaleString()}</td>
                    <td>{fmt(b.mean_ns)}</td>
                    <td>{fmt(b.p50_ns)}</td>
                    <td>{fmt(b.p99_ns)}</td>
                    <td>{fmt(b.p999_ns)}</td>
                    <td>{fmt(b.p9999_ns)}</td>
                    <td>{fmt(b.max_ns)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="bar-vis-title">Distribution (p50 / p99 / p99.9)</h3>
          {suite.benches.map((b) => (
            <div key={b.name} className="bar-vis-block">
              <div className="bar-vis-bench-name">{b.name}</div>
              <BarVis p50={b.p50_ns} p99={b.p99_ns} p999={b.p999_ns} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MetricsPanel;
