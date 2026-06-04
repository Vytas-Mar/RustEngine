// NOTE: these tests need read access to the internal engine for state comparison.
// Add this method to Replayer:
//
//     pub fn engine_ref(&self) -> &MatchingEngine { &self.engine }

use engine_core::simulation::{Replayer, SimConfig, Simulator, run_burst};
use engine_core::{MatchingEngine, Orderbook};

fn default_config(seed: u64) -> SimConfig {
    SimConfig {
        seed,
        mid_price: 100,
        price_spread: 10,
        min_qty: 1,
        max_qty: 100,
        market_order_prob: 0.1,
        lambda_per_sec: 1000.0,
    }
}

fn assert_engines_equivalent(a: &MatchingEngine, b: &MatchingEngine) {
    assert_eq!(a.trades.len(), b.trades.len(), "trade count diverged");

    for (t1, t2) in a.trades.iter().zip(b.trades.iter()) {
        assert_eq!(t1.maker_id, t2.maker_id);
        assert_eq!(t1.taker_id, t2.taker_id);
        assert_eq!(t1.taker_side, t2.taker_side);
        assert_eq!(t1.price, t2.price);
        assert_eq!(t1.qty, t2.qty);
    }

    assert_eq!(a.book.bids.len(), b.book.bids.len(), "bid levels diverged");
    assert_eq!(a.book.asks.len(), b.book.asks.len(), "ask levels diverged");

    for (x, y) in a.book.bids.iter().zip(b.book.bids.iter()) {
        assert_eq!(x.0, y.0, "bid price mismatch");
        assert_eq!(x.1.total_qty, y.1.total_qty, "bid total_qty mismatch");
    }

    for (x, y) in a.book.asks.iter().zip(b.book.asks.iter()) {
        assert_eq!(x.0, y.0, "ask price mismatch");
        assert_eq!(x.1.total_qty, y.1.total_qty, "ask total_qty mismatch");
    }
}

#[test]
fn step_advances_cursor_and_matches_burst() {
    let mut replayer = Replayer::new(default_config(42));
    for _ in 0..100 {
        replayer.step();
    }
    assert_eq!(replayer.cursor(), 100);

    let mut engine = MatchingEngine::new(Orderbook::new());
    let mut sim = Simulator::new(default_config(42));
    run_burst(&mut engine, &mut sim, 100);

    assert_engines_equivalent(replayer.engine_ref(), &engine);
}

#[test]
fn reset_returns_to_initial_state() {
    let mut replayer = Replayer::new(default_config(7));
    for _ in 0..50 {
        replayer.step();
    }

    replayer.reset();

    assert_eq!(replayer.cursor(), 0);
    assert!(replayer.engine_ref().trades.is_empty());
    assert!(replayer.engine_ref().book.bids.is_empty());
    assert!(replayer.engine_ref().book.asks.is_empty());

    for _ in 0..50 {
        replayer.step();
    }

    let mut fresh = Replayer::new(default_config(7));
    for _ in 0..50 {
        fresh.step();
    }

    assert_engines_equivalent(replayer.engine_ref(), fresh.engine_ref());
}

#[test]
fn seek_backwards_resets_and_replays() {
    let mut a = Replayer::new(default_config(99));
    a.seek(80);
    a.seek(30);

    assert_eq!(a.cursor(), 30);

    let mut b = Replayer::new(default_config(99));
    b.seek(30);

    assert_engines_equivalent(a.engine_ref(), b.engine_ref());
}

#[test]
fn seek_forwards_advances_without_reset() {
    let mut a = Replayer::new(default_config(123));
    a.seek(30);
    a.seek(80);

    assert_eq!(a.cursor(), 80);

    let mut b = Replayer::new(default_config(123));
    b.seek(80);

    assert_engines_equivalent(a.engine_ref(), b.engine_ref());
}
