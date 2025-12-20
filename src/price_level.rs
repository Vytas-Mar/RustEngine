use crate::order::Order;
use std::collections::VecDeque;

#[derive(Debug)]
pub struct PriceLevel {
    pub orders: VecDeque<Order>,
}

impl PriceLevel {
    pub fn new() -> PriceLevel {
        PriceLevel {
            orders: VecDeque::new(),
        }
    }
}
