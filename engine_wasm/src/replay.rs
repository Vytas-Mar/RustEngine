use engine_core::simulation::{Replayer, SimConfig};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmReplayer {
    inner: Replayer,
}

#[wasm_bindgen]
impl WasmReplayer {
    #[wasm_bindgen(constructor)]
    pub fn new(config_js: JsValue) -> Result<WasmReplayer, JsValue> {
        let config: SimConfig = serde_wasm_bindgen::from_value(config_js)?;
        Ok(WasmReplayer {
            inner: Replayer::new(config),
        })
    }

    /// Apply the next event. Returns dt_nanos so JS can pace playback.
    pub fn step(&mut self) -> u64 {
        self.inner.step()
    }

    pub fn reset(&mut self) {
        self.inner.reset();
    }

    pub fn seek(&mut self, target: u64) {
        self.inner.seek(target);
    }

    pub fn cursor(&self) -> u64 {
        self.inner.cursor()
    }

    pub fn orderbook_depth_state(&self) -> Result<JsValue, JsValue> {
        let snapshot = self.inner.depth_snapshot();
        serde_wasm_bindgen::to_value(&snapshot).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn drain_trades(&mut self) -> Result<JsValue, JsValue> {
        let drained = self.inner.drain_trades();
        serde_wasm_bindgen::to_value(&drained).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}
