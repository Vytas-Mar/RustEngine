import { useEffect, useRef, useState } from "react";
import { WasmEngine, WasmSide } from "engine_wasm";
import "./App.css";
import DepthPanel from "./components/DepthPanel";
import OrderEntryPanel from "./components/OrderEntryPanel";
import TopBar from "./components/TopBar";
import TradesPanel from "./components/TradesPanel";
import { asks, bids, trades } from "./data/mockOrderbook";

function App() {
  const engineRef = useRef(null);
  const alertTimerRef = useRef(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState("");
  const [uiAlert, setUiAlert] = useState(null);

  const showAlert = (type, message) => {
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
    }

    setUiAlert({ type, message });
    alertTimerRef.current = setTimeout(() => {
      setUiAlert(null);
      alertTimerRef.current = null;
    }, 2200);
  };

  useEffect(() => {
    let mounted = true;

    try {
      engineRef.current = new WasmEngine();
      window.engine = engineRef.current;
      if (mounted) setWasmReady(true);
    } catch (err) {
      if (mounted) setWasmError(String(err));
    }

    return () => {
      if (alertTimerRef.current) {
        clearTimeout(alertTimerRef.current);
      }
      mounted = false;
    };
  }, []);

  const handleLogEngine = () => {
    if (!engineRef.current) return;

    try {
      console.log("orderbook:", engineRef.current.orderbook_full_state?.());
      console.log("WASM trades count:", engineRef.current.trades());
    } catch (error) {
      console.error("WASM call failed:", error);
    }
  };

  const handleAddTestTrade = () => {
    if (!engineRef.current) {
      console.warn("WASM engine is not ready yet");
      showAlert("error", "Engine is not ready yet");
      return;
    }

    try {
      engineRef.current.place_limit_order(10125n, 2n, WasmSide.Buy);
      console.log("Placed test order");
    } catch (error) {
      console.error("WASM call failed:", error);
    }
  };

  const handlePlaceOrder = ({ price, qty, side }) => {
    if (!engineRef.current) {
      console.warn("WASM engine is not ready yet");
      return;
    }

    const wasmSide = side === "sell" ? WasmSide.Sell : WasmSide.Buy;

    try {
      engineRef.current.place_limit_order(BigInt(price), BigInt(qty), wasmSide);
      console.log("Placed order:", { price, qty, side });
      showAlert(
        "success",
        `Order placed: ${side.toUpperCase()} ${qty} @ ${price}`,
      );
    } catch (error) {
      console.error("WASM call failed:", error);
      showAlert("error", "Failed to place order");
    }
  };

  const statusText = wasmError
    ? `WASM error: ${wasmError}`
    : wasmReady
      ? "WASM ready"
      : "WASM loading";

  return (
    <main className="screen">
      <TopBar statusText={statusText} />
      {uiAlert && (
        <p className={`order-alert ${uiAlert.type}`}>{uiAlert.message}</p>
      )}

      <section className="grid">
        <OrderEntryPanel
          onLogEngine={handleLogEngine}
          onAddTestTrade={handleAddTestTrade}
          onPlaceOrder={handlePlaceOrder}
        />
        <DepthPanel bids={bids} asks={asks} />
        <TradesPanel trades={trades} />
      </section>
    </main>
  );
}

export default App;
