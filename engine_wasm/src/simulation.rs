use crate::engine::WasmEngine;
use engine_core::simulation::{SimConfig, Simulator, run_burst};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
impl WasmEngine {
    pub fn start_simulation(&mut self, config_js: JsValue) -> Result<(), JsValue> {
        let config: SimConfig = serde_wasm_bindgen::from_value(config_js)?;
        self.simulator = Some(Simulator::new(config));
        Ok(())
    }

    pub fn burst(&mut self, n: u64) -> Result<JsValue, JsValue> {
        let sim = self.simulator.as_mut().ok_or_else(|| {
            JsValue::from_str("simulation not started — call start_simulation first")
        })?;
        let metrics = run_burst(&mut self.inner, sim, n);
        serde_wasm_bindgen::to_value(&metrics).map_err(Into::into)
    }

    pub fn simulation_active(&self) -> bool {
        self.simulator.is_some()
    }
}
