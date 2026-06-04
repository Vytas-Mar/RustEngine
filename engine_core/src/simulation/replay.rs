use super::config::{SimConfig, SimOrderKind};
use super::generator::Simulator;
use crate::{DepthSnapshot, MatchingEngine, Orderbook, Trade};

pub struct Replayer {
    engine: MatchingEngine,
    simulator: Simulator,
    config: SimConfig,
    cursor: u64,
}

impl Replayer {
    pub fn new(config: SimConfig) -> Self {
        Replayer {
            engine: MatchingEngine::new(Orderbook::new()),
            simulator: Simulator::new(config.clone()),
            config,
            cursor: 0,
        }
    }

    pub fn step(&mut self) -> u64 {
        let event = self.simulator.next();

        match event.order.kind {
            SimOrderKind::Limit { price } => {
                self.engine
                    .place_limit_order(price, event.order.qty, event.order.side);
            }
            SimOrderKind::Market => {
                self.engine
                    .place_market_order(event.order.qty, event.order.side);
            }
        }

        self.cursor += 1;

        event.dt_nanos
    }

    pub fn reset(&mut self) {
        self.engine = MatchingEngine::new(Orderbook::new());
        self.simulator = Simulator::new(self.config.clone());
        self.cursor = 0;
    }

    pub fn seek(&mut self, target: u64) {
        if target < self.cursor {
            self.reset();
        }
        while self.cursor < target {
            self.step();
        }
    }

    pub fn cursor(&self) -> u64 {
        self.cursor
    }

    pub fn engine_ref(&self) -> &MatchingEngine {
        &self.engine
    }

    pub fn depth_snapshot(&self) -> DepthSnapshot {
        self.engine.depth_snapshot()
    }

    pub fn drain_trades(&mut self) -> Vec<Trade> {
        self.engine.drain_trades()
    }
}
