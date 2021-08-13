import traitlets
import ipywidgets
import threading
import time
import ipysimulate
from .tools import make_list
from .parameters import Range, IntRange, Values

# See js/lib/control.js for the frontend counterpart to this file.
semver_range = "~" + ipysimulate.__version__  # Retrieve version

# Prepare parameter classes
range_types = (Range, )
intrange_types = (IntRange, )
value_types = (Values, )
try:
    import agentpy as ap
    if ap.__version__ >= '0.0.8':
        range_types += (ap.Range, )
        intrange_types += (ap.IntRange, )
        value_types += (ap.Values, )
except ImportError as e:
    pass


@ipywidgets.register
class Control(ipywidgets.DOMWidget):
    """ Control panel widget for an interactive simulation.

    Arguments:
        model:
            A :ref:`simulation model <simulation_model>` with discrete steps.
        parameters (dict, optional):
            Dictionary of parameter names and values (default None).
            Entries of type :class:`Range`, :class:`IntRange`,
            and :class:`Values` will be displayed as interactive widgets.
        variables (str of list of str, optional):
            Model attributes to display in the control panel (default None).
    """

    # Traitlet declarations ------------------------------------------------- #
    
    _view_name = traitlets.Unicode('ControlView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _model_name = traitlets.Unicode('ControlModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode(semver_range).tag(sync=True)

    is_running = traitlets.Bool(False).tag(sync=True)
    do_reset = traitlets.Bool(False).tag(sync=True)

    _variables = traitlets.Dict().tag(sync=True)
    parameters = traitlets.Dict().tag(sync=True)
    data_paths = traitlets.List().tag(sync=True)
    _pwidgets = traitlets.List().tag(sync=True)
    t = traitlets.Integer(0).tag(sync=True)

    name = traitlets.Unicode().tag(sync=True)

    # Initiation - Don't start any threads here ----------------------------- #
    
    def __init__(self, model, parameters=None, variables=None):
        super().__init__()  # Initiate front-end
        self.on_msg(self._handle_button_msg)  # Handle front-end messages
        self.thread = None  # Placeholder for simulation threads
        self._pre_pwidgets = []
        self._pdtypes = {}

        self.parameters = {}
        if parameters:
            for k, v in parameters.items():
                if isinstance(v, value_types):
                    self._create_select(k, v)
                    self.parameters[k] = v.vdef
                elif isinstance(v, intrange_types):
                    self._create_slider(k, v, int_slider=True)
                    self.parameters[k] = v.vdef
                elif isinstance(v, range_types):
                    self._create_slider(k, v)
                    self.parameters[k] = v.vdef
                else:
                    self.parameters[k] = v

        self._pwidgets = self._pre_pwidgets
        self.model = model
        self.model.set_parameters(self.parameters)

        self._callbacks = []
        self._var_keys = make_list(variables)
        self._variables = {k: None for k in self._var_keys}

        self.charts = []

    # Callbacks ------------------------------------------------------------- #

    def add_callback(self, func, *args, **kwargs):
        self._callbacks.append((func, args, kwargs))

    # Parameter widgets ----------------------------------------------------- #

    def _create_slider(self, k, v, int_slider=False):
        pwidget = {
            'name': k,
            'type': 'slider',
            'vmin': v.vmin,
            'vmax': v.vmax,
            'vdef': v.vdef
        }
        if int_slider:
            pwidget['step'] = max([1, int((v.vmax - v.vmin) / 100)])
            self._pdtypes[k] = int
        else:
            pwidget['step'] = (v.vmax - v.vmin) / 100
            self._pdtypes[k] = float
        self._pre_pwidgets.append(pwidget)

    def _create_select(self, k, v):
        pwidget = {
            'name': k,
            'type': 'select',
            'values': v.values,
            'vdef': v.vdef
        }
        # TODO Better way to infer dtypes
        self._pdtypes[k] = type(v.values[0])
        self._pre_pwidgets.append(pwidget)

    # Methods to be called from the front-end ------------------------------- #

    def _handle_button_msg(self, _, content, buffers):
        """ Handles messages from the front-end 
        by calling method of same name as msg. """
        getattr(self, content.get('event', ''))(**content)

    def update_parameter(self, k, v):
        self.model.p[k] = self._pdtypes[k](v)

    def setup_simulation(self, **kwargs):
        """ Call model setup. """
        self.thread = threading.Thread(target=self.run_setup)
        self.thread.start()
        
    def continue_simulation(self, **kwargs):
        """ Start background thread that runs simulation. """
        self.thread = threading.Thread(target=self.run_simulation)
        self.thread.start()
        
    def increment_simulation(self, **kwargs):
        """ Do a single simulation step. """
        self.thread = threading.Thread(target=self.run_step)
        self.thread.start()
        
    def reset_simulation(self, **kwargs):
        """ Reset graphs and simulation. """
        self.thread = threading.Thread(target=self.reset)
        self.thread.start()
        
    # Methods to be called only within threads ------------------------------ #

    def sync_data(self):
        """ Retrieve new data from simulation and send it to front-end. """
        self._variables = {k: getattr(self.model, k) for k in self._var_keys}
        for chart in self.charts:
            chart.sync_data()
        for callback, args, kwargs in self._callbacks:
            callback(*args, **kwargs)

    def reset(self):
        """ Reset simulation by clearing front-end data,
        calling `model.sim_reset()`, and sending initial data to front-end."""
        for chart in self.charts:
            chart.reset_data()
        self.run_setup()  # Reset backend model by calling setup again

    def run_setup(self):
        """ Initiate simulation by calling `model.sim_setup()`
        and sending initial data to front-end. """
        self.model.sim_setup()
        self.t = self.model.t
        self.sync_data()
    
    def run_step(self):
        """ Run a single simulation step by calling `model.sim_step()`,
        and sending new data to front-end. """
        self.model.sim_step()
        self.t = self.model.t
        self.sync_data()
        
    def run_simulation(self):
        """ Start or continue the simulation by repeatedly calling
        :func:`Control.run_single_step` as long as `model.active` is True. """
        self.is_running = True
        if 'fps' in self.model.p:
            while self.model.running:
                start = time.time()
                self.run_step()
                wait = 1 / self.model.p.fps + start - time.time()
                if wait > 0:
                    time.sleep(wait)
                if not self.is_running:
                    break
        else:
            while self.model.running:
                self.run_step()
                if not self.is_running:
                    break
        self.is_running = False
        if self.do_reset:
            self.reset_simulation()
            self.do_reset = False
