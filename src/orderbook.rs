use crate::{order::Order, price_level::PriceLevel, side::Side};
use std::collections::BTreeMap;

#[derive(Debug)]
pub struct Orderbook {
    pub bids: BTreeMap<u64, PriceLevel>,
    pub asks: BTreeMap<u64, PriceLevel>,
}

impl Orderbook {
    pub fn new() -> Orderbook {
        Orderbook {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
        }
    }
    pub fn insert_order(&mut self, order: Order) {
        let book_side = match order.side {
            Side::Buy => &mut self.bids,
            Side::Sell => &mut self.asks,
        };

        book_side
            .entry(order.price)
            .or_insert_with(PriceLevel::new)
            .orders
            .push_back(order);
    }

    pub fn best_bid_level(&mut self) -> Option<(u64, &mut PriceLevel)> {
        self.bids
            .iter_mut()
            .next_back()
            .map(|(price, level)| (*price, level))
    }

    pub fn best_ask_level(&mut self) -> Option<(u64, &mut PriceLevel)> {
        self.asks
            .iter_mut()
            .next()
            .map(|(price, level)| (*price, level))
    }
}
