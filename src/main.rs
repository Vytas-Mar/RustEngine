mod matching_engine;
mod order;
mod orderbook;
mod price_level;
mod side;
mod trade;

use order::*;
use orderbook::*;
use side::*;

use crate::matching_engine::MatchingEngine;

fn main() {
    let mut orderbook = Orderbook::new();
    let mut engine = MatchingEngine::new(orderbook);
    let order1 = Order::new(1, 100, 2, Side::Buy);
    let order2 = Order::new(2, 100, 3, Side::Buy);

    engine.book.insert_order(order1);
    engine.book.insert_order(order2);

    println!("{:#?}", engine.book);
}
