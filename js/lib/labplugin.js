var plugin = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'ipysimulate:plugin',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'ipysimulate',
          version: plugin.version,
          exports: plugin
      });
  },
  autoStart: true
};

