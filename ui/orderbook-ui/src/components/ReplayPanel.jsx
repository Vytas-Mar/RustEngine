import { useCallback, useEffect, useRef, useState } from "react";
import { WasmEngine, WasmReplayer } from "engine_wasm";
import DepthPanel from "./DepthPanel";
import TradesPanel from "./TradesPanel";

const PRICE_SCALE = Number(WasmEngine.price_scale());
const MAX_TRADES_DISPLAYED = 1000;
const SPEED_OPTIONS = [
  { value: 0.01, label: "0.01x" },
  { value: 0.1, label: "0.1x" },
  { value: 1, label: "1x" },
  { value: 10, label: "10x" },
  { value: 100, label: "100x" },
];

const buildConfig = (config) => ({
  seed: BigInt(config.seed),
  mid_price: BigInt(config.mid_price),
  price_spread: BigInt(config.price_spread),
  min_qty: BigInt(config.min_qty),
  max_qty: BigInt(config.max_qty),
  market_order_prob: config.market_order_prob,
  lambda_per_sec: config.lambda_per_sec,
});

const buildDepthSide = (rows) => {
  let cum = 0;
  return rows.map(({ price, total_qty }) => {
    const size = Number(total_qty);
    cum += size;
    return { price: Number(price) / PRICE_SCALE, size, total: cum };
  });
};

const formatTrades = (rawTrades) =>
  rawTrades
    .map((t) => ({
      time: new Date(Number(t.timestamp / 1_000_000n)).toLocaleTimeString(),
      side: String(t.taker_side).toUpperCase(),
      price: (Number(t.price) / PRICE_SCALE).toFixed(2),
      qty: Number(t.qty).toFixed(2),
    }))
    .reverse();

const formatAge = (createdAt) => {
  const seconds = Math.floor((Date.now() - createdAt) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const ReplayPanel = ({ recordings = [], setRecordings }) => {
  const replayerRef = useRef(null);
  const accumulatedNsRef = useRef(0);
  const lastFrameMsRef = useRef(0);

  const [selectedId, setSelectedId] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [depth, setDepth] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);
  const [totalTrades, setTotalTrades] = useState(0);

  const selectedRecording = recordings.find((r) => r.id === selectedId);

  const refreshReplay = useCallback(() => {
    const r = replayerRef.current;
    if (!r) return;
    const snap = r.orderbook_depth_state();
    const newTrades = r.drain_trades();
    setDepth({
      bids: buildDepthSide(snap.bids),
      asks: buildDepthSide(snap.asks),
    });
    if (newTrades.length > 0) {
      const formatted = formatTrades(newTrades);
      setTrades((prev) =>
        [...formatted, ...prev].slice(0, MAX_TRADES_DISPLAYED),
      );
      setTotalTrades((prev) => prev + newTrades.length);
    }
    setCursor(Number(r.cursor()));
  }, []);

  const tearDownReplayer = useCallback(() => {
    if (replayerRef.current) {
      replayerRef.current.free?.();
      replayerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!selectedRecording) {
      tearDownReplayer();
      return;
    }
    tearDownReplayer();
    try {
      replayerRef.current = new WasmReplayer(buildConfig(selectedRecording.config));
      setCursor(0);
      setDepth({ bids: [], asks: [] });
      setTrades([]);
      setTotalTrades(0);
      setPlaying(false);
      accumulatedNsRef.current = 0;
    } catch (err) {
      console.error("Failed to instantiate WasmReplayer:", err);
    }
    return tearDownReplayer;
  }, [selectedRecording, tearDownReplayer]);

  useEffect(() => {
    if (!playing || !replayerRef.current || !selectedRecording) return;
    let rafId;
    lastFrameMsRef.current = performance.now();
    accumulatedNsRef.current = 0;

    const tick = (now) => {
      const r = replayerRef.current;
      if (!r) return;
      const dtMs = now - lastFrameMsRef.current;
      lastFrameMsRef.current = now;
      accumulatedNsRef.current += dtMs * 1e6 * speed;

      let applied = 0;
      while (
        Number(r.cursor()) < selectedRecording.totalEvents &&
        applied < 5000 &&
        accumulatedNsRef.current > 0
      ) {
        const evDt = Number(r.step());
        accumulatedNsRef.current -= evDt;
        applied++;
      }

      if (applied > 0) refreshReplay();

      if (Number(r.cursor()) >= selectedRecording.totalEvents) {
        setPlaying(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, selectedRecording, speed, refreshReplay]);

  const select = (id) => setSelectedId(id);

  const remove = (id) => {
    if (id === selectedId) setSelectedId(null);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleStep = () => {
    if (!replayerRef.current || !selectedRecording) return;
    if (Number(replayerRef.current.cursor()) >= selectedRecording.totalEvents)
      return;
    replayerRef.current.step();
    refreshReplay();
  };

  const handleStepBack = () => {
    if (!replayerRef.current) return;
    const c = Number(replayerRef.current.cursor());
    if (c === 0) return;
    setTrades([]);
    setTotalTrades(0);
    replayerRef.current.seek(BigInt(c - 1));
    accumulatedNsRef.current = 0;
    refreshReplay();
  };

  const handleReset = () => {
    if (!replayerRef.current) return;
    replayerRef.current.reset();
    setTrades([]);
    setTotalTrades(0);
    setPlaying(false);
    accumulatedNsRef.current = 0;
    refreshReplay();
  };

  const handleScrub = (e) => {
    if (!replayerRef.current) return;
    const target = Number(e.target.value);
    const currentCursor = Number(replayerRef.current.cursor());
    if (target < currentCursor) {
      setTrades([]);
      setTotalTrades(0);
    }
    replayerRef.current.seek(BigInt(target));
    accumulatedNsRef.current = 0;
    refreshReplay();
  };

  const handlePlayPause = () => {
    if (!selectedRecording) return;
    if (
      replayerRef.current &&
      Number(replayerRef.current.cursor()) >= selectedRecording.totalEvents
    ) {
      handleReset();
    }
    setPlaying((p) => !p);
  };

  return (
    <section className="panel replay-panel">
      <div className="panel-heading">
        <h2>
          Replay <span className="replay-badge">REPLAY MODE</span>
        </h2>
        <span>
          {recordings.length}{" "}
          {recordings.length === 1 ? "recording" : "recordings"}
        </span>
      </div>

      <div className="replay-body">
        <div className="recordings-list">
          {recordings.length === 0 && (
            <div className="recordings-empty">
              No recordings yet. Run a Burst in the Simulation tab to create
              one.
            </div>
          )}
          {recordings.map((r) => {
            const isSelected = r.id === selectedId;
            return (
              <div
                key={r.id}
                className={`recording-row ${isSelected ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="recording-info"
                  onClick={() => select(r.id)}
                >
                  <span className="recording-title">
                    Burst {r.totalEvents.toLocaleString()}
                  </span>
                  <span className="recording-meta">
                    seed {r.config.seed} · λ {r.config.lambda_per_sec} ·{" "}
                    {formatAge(r.createdAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="recording-delete"
                  onClick={() => remove(r.id)}
                  title="Delete recording"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {selectedRecording && (
          <>
            <div className="replay-controls">
              <div className="control-row">
                <div className="transport">
                  <button type="button" onClick={handleReset} title="Reset to start">
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={handleStepBack}
                    title="Step back one"
                    disabled={playing}
                  >
                    ⏮
                  </button>
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    title={playing ? "Pause" : "Play"}
                  >
                    {playing ? "⏸" : "▶"}
                  </button>
                  <button
                    type="button"
                    onClick={handleStep}
                    title="Step forward one"
                    disabled={playing}
                  >
                    ⏭
                  </button>
                </div>
                <span className="control-label" style={{ marginLeft: "1rem" }}>
                  Speed
                </span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  {SPEED_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-row">
                <input
                  type="range"
                  min="0"
                  max={selectedRecording.totalEvents}
                  value={cursor}
                  onChange={handleScrub}
                  className="scrubber"
                />
                <span className="cursor-readout">
                  {cursor.toLocaleString()} /{" "}
                  {selectedRecording.totalEvents.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="replay-panels">
              <DepthPanel bids={depth.bids} asks={depth.asks} />
              <TradesPanel
                trades={trades}
                totalCount={totalTrades}
                maxDisplayed={MAX_TRADES_DISPLAYED}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ReplayPanel;
