mod engine;
mod replay;
mod simulation;

pub use engine::{WasmEngine, WasmSide};
pub use replay::WasmReplayer;

use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn wasm_start() {
    console_error_panic_hook::set_once();
}
