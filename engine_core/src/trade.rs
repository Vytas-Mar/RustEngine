use crate::Side;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct Trade {
    pub maker_id: u64,
    pub taker_id: u64,
    pub taker_side: Side,
    pub price: u64,
    pub qty: u64,
    pub timestamp: u128,
}

impl Trade {
    pub fn new(maker_id: u64, taker_id: u64, taker_side: Side, price: u64, qty: u64) -> Trade {
        let now = crate::utils::now_nanos();

        Trade {
            maker_id,
            taker_id,
            taker_side,
            price,
            qty,
            timestamp: now,
        }
    }
}
