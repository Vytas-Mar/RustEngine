const TRADE_COLS = (
  <colgroup>
    <col style={{ width: "30%" }} />
    <col style={{ width: "20%" }} />
    <col style={{ width: "25%" }} />
    <col style={{ width: "25%" }} />
  </colgroup>
);

const TradesPanel = ({ trades, totalCount, maxDisplayed }) => {
  const total = totalCount ?? trades.length;
  const truncated = maxDisplayed != null && total > maxDisplayed;
  const label = truncated
    ? `${total.toLocaleString()} · showing last ${maxDisplayed.toLocaleString()}`
    : total.toLocaleString();

  return (
    <section className="panel trades">
      <div className="panel-heading">
        <h2>Trades</h2>
        <span>{label}</span>
      </div>
      <table className="trades-header-table">
        {TRADE_COLS}
        <thead>
          <tr>
            <th>Time</th>
            <th>Side</th>
            <th>Price</th>
            <th>Qty</th>
          </tr>
        </thead>
      </table>
      <div className="trades-scroll">
        <table>
          {TRADE_COLS}
          <tbody>
            {trades.map((trade, index) => (
              <tr key={`${trade.time}-${index}`}>
                <td>{trade.time}</td>
                <td className={trade.side === "BUY" ? "bid" : "ask"}>
                  {trade.side}
                </td>
                <td>{trade.price}</td>
                <td>{trade.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TradesPanel;
