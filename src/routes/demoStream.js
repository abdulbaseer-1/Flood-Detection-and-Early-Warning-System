const express = require('express');
const router = express.Router();

const Node = require('../models/Node');
const Telemetry = require('../models/Telemetry');

router.post('/start', async (req, res) => {
  try {
    const {
      nodeId,
      intervalMs = 1500,
      durationMs = 30000,
      scenario = 'ramp',
    } = req.body || {};

    const query = nodeId ? { nodeId } : {};
    const nodes = await Node.find(query).select('nodeId bankfull_capacity_m3 runoff_coefficient').lean();

    if (!nodes.length) {
      return res.status(404).json({ success: false, message: 'No nodes found for the given nodeId' });
    }

    if (!req.app.locals.demoStream) req.app.locals.demoStream = {};
    if (req.app.locals.demoStream.timer) {
      clearInterval(req.app.locals.demoStream.timer);
      clearTimeout(req.app.locals.demoStream.stopTimer);
    }

    const startedAt = Date.now();

    const tick = async () => {
      const t        = Date.now() - startedAt;
      const progress = Math.min(1, t / durationMs); // 0 → 1 over duration

      await Promise.all(
        nodes.map(async (n, idx) => {

          let water_level_m;
          let rainfall_mmhr;

          // if (scenario === 'spike') {
          //   // ── Flash spike: rises fast to peak at 40%, drops back down ──
          //   // Uses a bell curve shape: 4 * progress * (1 - progress)
          //   // peaks at progress=0.5 with value 1.0, starts and ends near 0
          //   const spikeCurve = 4 * progress * (1 - progress); // 0 → 1 → 0
          //   water_level_m  = 0.5 + spikeCurve * 4.5 + idx * 0.05;  // max ~5.0m at peak
          //   rainfall_mmhr  = Number((2 + spikeCurve * 28).toFixed(2)); // heavy burst rain
          // }
          if (scenario === 'spike') {
            // 1. Calculate exactly how many seconds have elapsed since the demo started
            const elapsedSeconds = (Date.now() - startedAt) / 1000;
            
            // 2. Base configuration
            const startLevel = 0.5;
            const risingSpeedMPerSec = 1.0; // 1 meter per second
            
            // 3. Continuous linear rise
            water_level_m = startLevel + (risingSpeedMPerSec * elapsedSeconds) + (idx * 0.05);
            
            // 4. Scale rainfall upwards dynamically alongside the water level (capping at 100 mm/hr)
            const calculatedRain = 2 + (elapsedSeconds * 2); 
            rainfall_mmhr = Number(Math.min(100, calculatedRain).toFixed(2));
          } else {
            // ── Gradual ramp: rises steadily ──────────────────────────────
            water_level_m  = 0.6 + progress * 3.2 + idx * 0.05;
            rainfall_mmhr  = Number((2 + progress * 12).toFixed(2));
          }

          const water_level_m_clamped = Math.max(0.01, Number(water_level_m.toFixed(3)));
          const temperature_k         = Number((309 + progress * 2 + idx * 0.1).toFixed(2));
          const flow_rate_m3s         = Number((0.02 + water_level_m_clamped * 0.08).toFixed(4));

          // ── Update Node dynamic fields only — status is NOT set here ──
          // Status is owned by predictionService.js which runs every 60s
          await Node.findOneAndUpdate(
            { nodeId: n.nodeId },
            {
              $set: {
                lastSeen:              new Date(),
                calibratedWaterHeight: water_level_m_clamped,
                flowRate:              flow_rate_m3s,
                temperature:           temperature_k,
                rainfall:              rainfall_mmhr,
              }
            }
          );

          // ── Save Telemetry record ─────────────────────────────────────
          await Telemetry.create({
            nodeId:        n.nodeId,
            timestamp:     new Date(),
            water_level_m: water_level_m_clamped,
            flow_rate_m3s,
            temperature_k,
            rainfall_mmhr,
            raw_payload: { seeded: false, scenario, progress, intervalMs, demo: true },
          });

          console.log(`[Demo] ${n.nodeId} → water: ${water_level_m_clamped}m | rain: ${rainfall_mmhr}mm/hr | flow: ${flow_rate_m3s}m³/s`);
        })
      );
    };

    await tick();

    const timer = setInterval(() => {
      tick().catch((e) => console.error('[demoStream] tick failed:', e));
    }, intervalMs);

    const stopTimer = setTimeout(() => {
      clearInterval(timer);
      req.app.locals.demoStream.timer    = null;
      req.app.locals.demoStream.stopTimer = null;
    }, durationMs);

    req.app.locals.demoStream.timer     = timer;
    req.app.locals.demoStream.stopTimer = stopTimer;

    return res.json({
      success: true,
      message: `Demo stream started (${scenario})`,
      startedAt: new Date(startedAt).toISOString(),
      nodeCount: nodes.length,
      intervalMs,
      durationMs,
      scenario,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to start demo stream' });
  }
});

router.post('/stop', (req, res) => {
  try {
    if (req.app.locals.demoStream?.timer) {
      clearInterval(req.app.locals.demoStream.timer);
      req.app.locals.demoStream.timer = null;
    }
    if (req.app.locals.demoStream?.stopTimer) {
      clearTimeout(req.app.locals.demoStream.stopTimer);
      req.app.locals.demoStream.stopTimer = null;
    }
    return res.json({ success: true, message: 'Demo stream stopped' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to stop demo stream' });
  }
});

module.exports = router;