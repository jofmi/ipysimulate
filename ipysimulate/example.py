import ipywidgets as widgets
from traitlets import Bool, Integer, Unicode, List, Dict
import ipywidgets as widgets
import threading
import time
import json
import random

# See js/lib/example.js for the frontend counterpart to this file.

@widgets.register
class HelloWorld(widgets.DOMWidget):
    """An example widget."""

    # Name of the widget view class in front-end
    _view_name = Unicode('HelloView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('HelloModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('ipysimulate').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('ipysimulate').tag(sync=True)

    # Version of the front-end module containing widget view
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode('^0.1.0').tag(sync=True)

    # Widget specific property.
    # Widget properties are defined as traitlets. Any property tagged with `sync=True`
    # is automatically synced to the frontend *any* time it changes in Python.
    # It is synced back to Python from the frontend *any* time the model is touched.
    value = Unicode('Hello World!').tag(sync=True)




# START CUSTOM --------------------------------------------------------------------- #

@widgets.register
class Controller(widgets.DOMWidget):
    
    # Traitlet declaration --------------------------------------------------------- #
    
    _view_name = Unicode('ControlView').tag(sync=True)
    _view_module = Unicode('ipysimulate').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_name = Unicode('ControlModel').tag(sync=True)
    _model_module = Unicode('ipysimulate').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    #model_name = Unicode('ControlModel').tag(sync=True)
    running = Bool(False).tag(sync=True)
    reset = Bool(False).tag(sync=True)
    reset_data = Bool(False).tag(sync=True)
    new_data = Dict({}).tag(sync=True)
    t = Integer(0).tag(sync=True)
    
    # Initiation - Don't start any threads here ----------------------------------- #
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)  # Initiate front-end
        self.on_msg(self._handle_button_msg)  # Handle front-end messages
        self.sync_event = threading.Event()  # To block thread while syncing
        self.sync_event.set()  # Disable at the beginning
        
    # Methods to be called from the front-end ----------------------------------- #
    
    def _handle_button_msg(self, _, content, buffers):
        """ Handles messages from the front-end 
        by calling method of same name as msg. """
        getattr(self, content.get('event', ''))()

    def setup_simulation(self):
        """ Call model setup. """
        self.thread = threading.Thread(target=self.setup)
        self.thread.start()
        
    def continue_simulation(self):
        """ Start background thread that runs simulation. """
        self.thread = threading.Thread(target=self.run_simulation) #, args=(self, ))
        self.thread.start()
        
    def increment_simulation(self):
        """ Do a single simulation step. """
        self.thread = threading.Thread(target=self.run_single_step) #, args=(self, ))
        self.thread.start()
        
    def reset_simulation(self):
        """ Reset simulation (in thread!) """
        self.thread = threading.Thread(target=self.setup)
        self.thread.start()
        
    def sync_finished(self):
        """ Allow worker to store new data again. """
        self.sync_event.set()  # Disable waiting
        
    # Methods to be called only within threads --------------------------------- #

    def send_data(self):
        """ Send data to front-end by setting new_data traitlet. """
        self.sync_event.wait() # Wait until disabled
        self.new_data = {'t':self.t,'v':self.x} # Send new data
        self.sync_event.clear() # Enable waiting
    
    def setup(self):

        # Trigger front-end data reset
        self.reset_data = True  
        self.reset_data = False
        
        # Reset backend data        
        self.t = 0  
        self.x = 0
        
        # Send t=0 data
        self.send_data()
    
    def run_single_step(self):
        #time.sleep(0.05)
        self.t += 1
        self.x += random.random() - 0.5
        self.send_data()
        
    def run_simulation(self):
        """ Run steps as long as simulation is active. """
        
        self.running = True
            
        while self.t < 100:
            self.run_single_step()
            if not self.running:
                break
                
        self.running = False
        if self.reset:
            self.reset_simulation()
            self.reset = False