const DEPTH_COLS = (
  <colgroup>
    <col style={{ width: "40%" }} />
    <col style={{ width: "30%" }} />
    <col style={{ width: "30%" }} />
  </colgroup>
);

const DepthHeader = ({ side }) => {
  const isBid = side === "bid";
  return (
    <div>
      <h3 className={isBid ? "bid" : "ask"}>{isBid ? "Bids" : "Asks"}</h3>
      <table>
        {DEPTH_COLS}
        <thead>
          <tr>
            <th>Price</th>
            <th>Size</th>
            <th>Total</th>
          </tr>
        </thead>
      </table>
    </div>
  );
};

const DepthBody = ({ side, rows, maxTotal }) => {
  const isBid = side === "bid";
  return (
    <div>
      <table>
        {DEPTH_COLS}
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${side}-${row.price}`}
              className={isBid ? "bid-row" : "ask-row"}
              style={{ "--depth": `${(row.total / maxTotal) * 100}%` }}
            >
              <td className={isBid ? "bid" : "ask"}>{row.price.toFixed(2)}</td>
              <td>{row.size.toFixed(2)}</td>
              <td>{row.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DepthPanel = ({ bids, asks }) => {
  const maxBidTotal = Math.max(...bids.map((row) => row.total));
  const maxAskTotal = Math.max(...asks.map((row) => row.total));

  return (
    <section className="panel depth">
      <div className="panel-heading">
        <h2>Depth</h2>
        <span>
          Levels: {bids.length} / {asks.length}
        </span>
      </div>

      <div className="book-grid-header">
        <DepthHeader side="bid" />
        <DepthHeader side="ask" />
      </div>

      <div className="book-grid">
        <DepthBody side="bid" rows={bids} maxTotal={maxBidTotal} />
        <DepthBody side="ask" rows={asks} maxTotal={maxAskTotal} />
      </div>
    </section>
  );
};

export default DepthPanel;
