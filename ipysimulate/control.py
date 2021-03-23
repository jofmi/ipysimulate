import traitlets
import ipywidgets
import threading
import time
import json
import random

# See js/lib/control.js for the frontend counterpart to this file.


@ipywidgets.register
class Control(ipywidgets.DOMWidget):
    """ Interactive control widget for a simulation model. """

    # Traitlet declarations ------------------------------------------------- #
    
    _view_name = traitlets.Unicode('ControlView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    _model_name = traitlets.Unicode('ControlModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)

    running = traitlets.Bool(False).tag(sync=True)
    reset = traitlets.Bool(False).tag(sync=True)
    reset_counter = traitlets.Integer(False).tag(sync=True)
    new_data = traitlets.Dict({}).tag(sync=True)
    parameters = traitlets.Dict({}).tag(sync=True)
    t = traitlets.Integer(0).tag(sync=True)
    sim_name = traitlets.Unicode('').tag(sync=True)
    sim_info = traitlets.Unicode('').tag(sync=True)

    # Initiation - Don't start any threads here ----------------------------- #
    
    def __init__(self, model, parameters=None, model_kwargs=None, **kwargs):
        super().__init__(**kwargs)  # Initiate front-end TODO What do these kwargs do
        self.on_msg(self._handle_button_msg)  # Handle front-end messages
        self.sync_event = threading.Event()  # To block thread while syncing
        self.sync_event.set()  # Unlock event at the beginning
        self.thread = None  # Placeholder for simulation threads
        self.parameters = parameters if parameters else {}
        model_kwargs = {} if model_kwargs is None else model_kwargs
        self.model = model(self.parameters, **model_kwargs)  # Initiate model
        self.sim_name = model.__name__
        self.sim_info = model.__doc__
        
    # Methods to be called from the front-end ------------------------------- #
    
    def _handle_button_msg(self, _, content, buffers):
        """ Handles messages from the front-end 
        by calling method of same name as msg. """
        getattr(self, content.get('event', ''))()

    def setup_simulation(self):
        """ Call model setup. """
        self.thread = threading.Thread(target=self.run_setup)
        self.thread.start()
        
    def continue_simulation(self):
        """ Start background thread that runs simulation. """
        self.thread = threading.Thread(target=self.run_simulation)
        self.thread.start()
        
    def increment_simulation(self):
        """ Do a single simulation step. """
        self.thread = threading.Thread(target=self.run_single_step)
        self.thread.start()
        
    def reset_simulation(self):
        """ Reset simulation (in thread!) """
        self.thread = threading.Thread(target=self.run_reset)
        self.thread.start()
        
    def sync_finished(self):
        """ Allow :func:`Control.send_data` to sync new data. """
        self.sync_event.set()  # Unlock event to send data
        
    # Methods to be called only within threads ------------------------------ #

    def sync_data(self):
        """ Send new data to front-end by syncing :attr:`Control.new_data`. """
        self.sync_event.wait()  # Wait until last sync is finished
        self.new_data = self.model.get_step_data()  # Sync new data
        self.sync_event.clear()  # Lock until this sync will be finished

    def run_reset(self):
        """ Reset simulation by clearing front-end data,
        calling `model.sim_reset()`, and sending initial data to front-end."""
        self.reset_counter = self.reset_counter + 1  # Trigger front-end reset
        self.model.sim_reset()  # Reset backend model
        self.t = self.model.t
        self.sync_data()

    def run_setup(self):
        """ Initiate simulation by calling `model.sim_setup()`
        and sending initial data to front-end. """
        self.model.sim_setup()
        self.t = self.model.t
        self.sync_data()
    
    def run_single_step(self):
        """ Run a single simulation step by calling `model.sim_step()`,
        and sending new data to front-end. """
        self.model.sim_step()
        self.t = self.model.t
        self.sync_data()
        
    def run_simulation(self):
        """ Start or continue the simulation by repeatedly calling
        :func:`Control.run_single_step` as long as `model.active` is True. """
        self.running = True
        while self.model.active:
            self.run_single_step()
            if not self.running:
                break
        self.running = False
        if self.reset:
            self.reset_simulation()
            self.reset = False
