use crate::order::Order;
use crate::orderbook::Orderbook;
use crate::side::Side;
use crate::trade::Trade;

pub struct MatchingEngine {
    pub book: Orderbook,
    pub trades: Vec<Trade>,
    next_id: u64,
}

impl MatchingEngine {
    pub fn new(book: Orderbook) -> MatchingEngine {
        MatchingEngine {
            book,
            trades: Vec::new(),
            next_id: 1,
        }
    }

    pub fn place_limit_order(&mut self, price: u64, qty: u64, side: Side) {
        let order = Order::new(self.next_id, price, qty, side);
        self.next_id += 1;

        self.match_or_insert(order);
    }

    fn match_or_insert(&mut self, mut order: Order) {
        self.match_against_book(&mut order);

        if order.qty > 0 {
            self.book.insert_order(order);
        }
    }

    fn match_against_book(&mut self, order: &mut Order) {
        while order.qty > 0 {
            let best_level = match order.side {
                Side::Buy => self.book.best_ask_level(),
                Side::Sell => self.book.best_bid_level(),
            };

            let Some((best_price, level)) = best_level else {
                break;
            };

            let crosses = match order.side {
                Side::Buy => order.price >= best_price,
                Side::Sell => order.price <= best_price,
            };
            if !crosses {
                break;
            }
        }
    }
}
