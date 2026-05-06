use crate::{
    Orderbook,
    price_level::{self, PriceLevel},
};

use serde::*;

#[derive(Serialize)]
pub struct DepthLevel {
    price: u64,
    total_qty: u64,
}
#[derive(Serialize)]
pub struct DepthSnapshot {
    bids: Vec<DepthLevel>,
    asks: Vec<DepthLevel>,
}

impl DepthLevel {
    pub fn new(price: u64, level: &PriceLevel) -> DepthLevel {
        DepthLevel {
            price,
            total_qty: level.total_qty,
        }
    }
}

impl DepthSnapshot {
    pub fn from_book(book: &Orderbook) -> DepthSnapshot {
        let bids = book
            .bids
            .iter()
            .rev()
            .map(|(price, level)| DepthLevel::new(*price, level))
            .collect();

        let asks = book
            .asks
            .iter() // ascending = best (lowest) ask first
            .map(|(price, level)| DepthLevel::new(*price, level))
            .collect();

        DepthSnapshot { bids, asks }
    }
}
