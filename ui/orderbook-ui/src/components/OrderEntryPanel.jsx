import { useState } from "react";

const OrderEntryPanel = ({ onLogEngine, onAddTestTrade, onPlaceOrder }) => {
  const [side, setSide] = useState("buy");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const hasEmptyFields = price.trim() === "" || qty.trim() === "";

  const submitOrder = () => {
    if (hasEmptyFields) return;

    const parsedPrice = Number(price);
    const parsedQty = Number(qty);

    if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedQty)) return;
    if (parsedPrice < 0 || parsedQty < 0) return;

    onPlaceOrder({
      price: parsedPrice,
      qty: Math.trunc(parsedQty),
      side,
    });
  };

  return (
    <aside className="panel">
      <h2>Order Entry</h2>
      <form className="order-form">
        <label>
          Side
          <select
            value={side}
            onChange={(event) => setSide(event.target.value)}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>
        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>
        <label>
          Quantity
          <input
            type="number"
            min="0"
            step="1"
            value={qty}
            onChange={(event) => setQty(event.target.value)}
          />
        </label>
        <div className="actions single-action">
          <button
            type="button"
            className={`place-order ${hasEmptyFields ? "unclickable" : ""}`}
            aria-disabled={hasEmptyFields}
            onClick={submitOrder}
          >
            Place Order
          </button>
        </div>
        <div className="actions">
          <button type="button" onClick={onLogEngine}>
            Log Engine
          </button>
          <button type="button" onClick={onAddTestTrade}>
            Add Test Trade
          </button>
        </div>
      </form>
    </aside>
  );
};

export default OrderEntryPanel;
