const Node = require('../models/Node');
const Telemetry = require('../models/Telemetry');

// Helper: throw structured error
const createError = (msg, code = 400) => {
  const e = new Error(msg);
  e.statusCode = code;
  return e;
};

const getAllNodes = async (req, res, next) => {
  try {
    const nodes = await Node.find({}).select('-__v').lean();
    console.log(nodes); // Log the retrieved nodes for debugging
    res.json({ success: true, count: nodes.length, data: nodes });
  } catch (err) {
    next(err);
  }
};

const getNodeById = async (req, res, next) => {
  try {
    const node = await Node.findOne({ nodeId: req.params.id }).select('-__v').lean();
    if (!node) return next(createError(`Node '${req.params.id}' not found`, 404));
    res.json({ success: true, data: node });
  } catch (err) {
    next(err);
  }
};

const getNodeHistory = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 500;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const records = await Telemetry.find({
      nodeId: req.params.id,
      timestamp: { $gte: since },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('-_id -__v -raw_payload')
      .lean();

    res.json({
      success: true,
      nodeId: req.params.id,
      hours,
      count: records.length,
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

const getNodeLatest = async (req, res, next) => {
  try {
    const record = await Telemetry.findOne({ nodeId: req.params.id })
      .sort({ timestamp: -1 })
      .select('-_id -__v -raw_payload')
      .lean();

    if (!record) return next(createError(`No telemetry found for '${req.params.id}'`, 404));
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const getNodeGraph = async (req, res, next) => {
  try {
    const node = await Node.findOne({ nodeId: req.params.id })
      .select('nodeId parentNodes')
      .lean();
    if (!node) return next(createError(`Node '${req.params.id}' not found`, 404));
    res.json({ success: true, nodeId: node.nodeId, parentNodes: node.parentNodes });
  } catch (err) {
    next(err);
  }
};

const updateNodeStatus = async (req, res, next) => {
  try {
    const { status, predicted_volume_m3, message } = req.body;

    const allowed = ['normal', 'warning', 'critical', 'sensor_malfunction', 'offline'];
    if (!allowed.includes(status)) {
      return next(createError(`Invalid status. Must be one of: ${allowed.join(', ')}`, 400));
    }

    const node = await Node.findOneAndUpdate(
      { nodeId: req.params.id },
      { status, lastSeen: new Date() },
      { new: true }
    ).lean();

    if (!node) return next(createError(`Node '${req.params.id}' not found`, 404));

    res.json({ success: true, data: node });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllNodes,
  getNodeById,
  getNodeHistory,
  getNodeLatest,
  getNodeGraph,
  updateNodeStatus,
};

