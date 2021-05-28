// Export widget models and views, and the npm package version number.
var control = require('./control.js');
var line = require('./line.js');
var scatter = require('./scatter.js');

module.exports = {
    ControlModel: control.ControlModel,
    ControlView: control.ControlView,
    LinechartModel: line.LinechartModel,
    LinechartView: line.LinechartView,
    ScatterModel: scatter.ScatterModel,
    ScatterView: scatter.ScatterView
};

module.exports['version'] = require('../package.json').version;