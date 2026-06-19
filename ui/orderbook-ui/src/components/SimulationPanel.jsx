import { useState } from "react";
import InfoTip from "./InfoTip";

const SimulationPanel = ({ onBurst, metrics, defaultConfig }) => {
  const [seed, setSeed] = useState(defaultConfig?.seed ?? 42);
  const [lambda, setLambda] = useState(defaultConfig?.lambda_per_sec ?? 1000);
  const [marketProb, setMarketProb] = useState(
    defaultConfig?.market_order_prob ?? 0.1,
  );

  const buildConfig = () => ({
    ...defaultConfig,
    seed: Number(seed),
    lambda_per_sec: Number(lambda),
    market_order_prob: Number(marketProb),
  });

  const fire = (n) => onBurst?.(n, buildConfig());

  const fmt = (v, digits = 0) =>
    v == null ? "—" : Number(v).toFixed(digits);

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Simulation</h2>
        <span>{metrics ? "ran" : "idle"}</span>
      </div>
      <div>
        <div className="control-row">
          <span className="control-label">Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            style={{ width: "6rem" }}
          />
          <button
            type="button"
            onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
          >
            🎲
          </button>
          <span className="control-label">
            λ /s
            <InfoTip>
              Lambda (λ) — average orders per second.
              <br />
              Controls how busy the simulated market is. λ=1000 means ~1000
              orders/sec on average, with realistic short/long gaps.
              <br />
              <br />
              Ignored in burst mode (fires as fast as possible) but recorded
              for replay.
            </InfoTip>
          </span>
          <input
            type="number"
            value={lambda}
            onChange={(e) => setLambda(e.target.value)}
            style={{ width: "6rem" }}
          />
          <span className="control-label">Market %</span>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={marketProb}
            onChange={(e) => setMarketProb(e.target.value)}
            style={{ width: "5rem" }}
          />
        </div>
        <div className="control-row">
          <button type="button" onClick={() => fire(100)}>
            Burst 100
          </button>
          <button type="button" onClick={() => fire(1000)}>
            Burst 1k
          </button>
          <button type="button" onClick={() => fire(10000)}>
            Burst 10k
          </button>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-label">
              Demo throughput
              <InfoTip>
                <strong>Not a benchmark — a live demo metric.</strong>
                <br />
                <br />
                Measures the round-trip:
                <br />
                browser → WASM call → Rust burst loop → WASM return → browser.
                <br />
                <br />
                Includes BigInt marshalling, serde serialization of metrics
                back to JS, and browser timer fuzzing (~100 µs precision for
                Spectre mitigation). All add overhead that isn't part of the
                engine itself.
                <br />
                <br />
                Useful as a regression canary while developing. <strong>Not
                citeable as engine performance.</strong>
                <br />
                <br />
                <strong>
                  → For real numbers (p50/p99/p99.9 from native Rust HDR
                  histograms), see the Metrics tab.
                </strong>
              </InfoTip>
            </div>
            <div className="stat-value">
              {metrics ? `${fmt(metrics.orders_per_sec, 0)} ord/s` : "—"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Orders sent</div>
            <div className="stat-value">{fmt(metrics?.orders_placed)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Trades</div>
            <div className="stat-value">{fmt(metrics?.trades_executed)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Elapsed (wall)</div>
            <div className="stat-value">
              {metrics ? `${fmt(metrics.wall_ms, 1)} ms` : "—"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimulationPanel;
