var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var linechart = require('./linechart');

// See example.py for the kernel counterpart to this file.


// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var HelloModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'HelloModel',
        _view_name : 'HelloView',
        _model_module : 'ipysimulate',
        _view_module : 'ipysimulate',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        /*value : 'Hello World!'*/
    })
});


// Custom View. Renders the widget model.
var HelloView = widgets.DOMWidgetView.extend({
    // Defines how the widget gets rendered into the DOM
    render: function() {
        this.value_changed();

        // Observe changes in the value traitlet in Python, and define
        // a custom callback.
        this.model.on('change:value', this.value_changed, this);
    },

    value_changed: function() {
        this.el.textContent = this.model.get('value');
    }
});


// Start Custom Extension ...........................................


var ControlModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ControlModel',
        _view_name : 'ControlView',
        _model_module : 'ipysimulate',
        _view_module : 'ipysimulate',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        /*value : 'Hello World!'*/
    })
});



var ControlView = widgets.DOMWidgetView.extend({
        
    // React to JS Front-End Events
    click_play: function(inputEvent) {
        // Set to pause after end of step, if model is runnning.
        // Start model through function call if model is idle.
        if (this.model.get('running') == false) {  
            this.send({event: 'continue_simulation'});
        } else {  
            this.model.set({'running':false}); 
            this.touch(); // Sync JS & Python              
        };
    },
    
    click_step: function(inputEvent) {
        // Run single step if model is idle.
        if (this.model.get('running') == false) {  
            this.send({event: 'increment_simulation'});
        };
    },
    
    click_redo: function(inputEvent) {
        // Set to reset after end of step, if model is runnning.
        // Reset through function call if model is idle.
        if (this.model.get('running') == true) {
            this.model.set({'reset':true, 'running':false});
            this.touch(); // Sync JS & Python 
        } else {
            this.send({event: 'reset_simulation'});
        };
    },


    render: function() {
        
        // Event handlers
        this.model.on('change:running', this.running_changed, this);
        this.model.on('change:t', this.t_changed, this);
        this.model.on('change:new_data', this.data_changed, this);
        this.model.on('change:reset_data', this.reset_data_changed, this);
        
        // Control interface
        this.control = document.createElement("div");
        this.control.className = "interactive_control"
        this.control.textContent = "Control Area"
        this.el.appendChild(this.control);

        // Data output area
        this.output = document.createElement("div");
        this.output.className = "interactive_output"
        this.output.textContent = "Output Area"
        this.el.appendChild(this.output);

        this.control_line = document.createElement("div");
        this.control_line.className = "control_line"
        this.control.appendChild(this.control_line);
        this.control_line2 = document.createElement("div");
        this.control_line2.className = "control_line"
        this.control.appendChild(this.control_line2);
        this.control_line3 = document.createElement("div");
        this.control_line3.className = "control_line"
        this.control.appendChild(this.control_line3);
        
        // Play/Pause button
        this.play_button = document.createElement("BUTTON");
        this.play_button.className = "control_btn fa fa-play";
        this.control_line.appendChild(this.play_button);
        
        // Step button
        this.step_button = document.createElement("BUTTON");
        this.step_button.className = "control_btn fa fa-step-forward";
        this.control_line.appendChild(this.step_button);
        
        // Restart button
        this.redo_button = document.createElement("BUTTON");
        this.redo_button.className = "control_btn fa fa-repeat fa-flip-horizontal";
        this.control_line.appendChild(this.redo_button);

        // Listening to events in JS Front-End 
        this.play_button.addEventListener("click", (inputEvent => this.click_play()), false);
        this.redo_button.addEventListener("click", (inputEvent => this.click_redo()), false);
        this.step_button.addEventListener("click", (inputEvent => this.click_step()), false);
        
        // Create output area
        this.output1 = document.createElement("span"); 
        this.output2 = document.createElement("span"); 
        this.control_line2.appendChild(this.output1);
        this.control_line2.appendChild(this.output2);
        
        // Initializing values
        this.output1.textContent = 'Steps: ';
        this.output2.textContent = this.model.get('t');
        
        
        this.output3 = document.createElement("div");
        //output3.textContent = this.model.get('data');
        this.output.appendChild(this.output3);
        
        // Handle data
        //let data = [] //{'t':0,'v':0}]
        this.data = []
        
        // Visualize data
        let path = linechart.linechart(this.output, this.data, 500, 200)
        this.path = path;  // Redraw pah function
        
        // Run setup
        this.send({event: 'setup_simulation'});
    },

    // React to variable changes in JS Front-End 
    running_changed: function() {
        if (this.model.get('running') == true) {
            this.play_button.className = "control_btn fa fa-pause";
        } else {
            this.play_button.className = "control_btn fa fa-play";
        };
    },

    t_changed: function() {
        this.output2.textContent = this.model.get('t');
    },
    
    data_changed: function() {
        
        // Add new data to data
        let new_data = this.model.get('new_data')
        this.data.push(new_data)

        // Clear back-end for next update
        this.send({event: 'sync_finished'});
        
        // Update visualization
        this.path(this.data)
    },
    
    reset_data_changed: function() {
        // Reset data is true
        if (this.model.get('reset_data') == true) {
            this.data = []
        }
    }

});


module.exports = {
    HelloModel: HelloModel,
    HelloView: HelloView,
    ControlModel: ControlModel,
    ControlView: ControlView,
};


