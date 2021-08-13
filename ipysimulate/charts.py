import traitlets
import ipywidgets
import ipysimulate
from .tools import make_list
import matplotlib.pyplot as plt

semver_range = "~" + ipysimulate.__version__


class Ipswidget:

    def _collector(self, instr):
        if isinstance(instr, str):
            data_paths = instr.split('.')

            def get(model):
                obj = model
                for attr in data_paths:
                    obj = getattr(obj, attr)
                return obj

            return get
        return instr


@ipywidgets.register
class CustomWidget(ipywidgets.DOMWidget, Ipswidget):
    """ Custom visualization widget.

    Arguments:
        control (Control):
            The simulation control panel.
        source (dict of str):
            Dictionary of strings with javascript functions
            that define the visualization of the widget.
            Possible entries are:

                - 'setup': Called when a new view is rendered.
                - 'update': Called when new data is synched.
                - 'reset': Called when the simulation is reset.

            Functions can access the widget view and widget model with
            `view` and `view.model`. The D3 library can be accessed with `d3`.
            Collected data is passed to the `update` function as `data`.
        config (dict):
            Configuration data that can be accessed by the visualization
            functions defined in `source`, using `view.model.config`.
        data (dict):
            Dictionary of variable names and ref:`collectors`.

    """

    _view_name = traitlets.Unicode('CustomWidgetView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _model_name = traitlets.Unicode('CustomWidgetModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _control_id = traitlets.Unicode().tag(sync=True)

    config = traitlets.Dict().tag(sync=True)
    source = traitlets.Dict().tag(sync=True)

    def __init__(self, control, source, config=None, data=None):

        self._control = control
        self._control_id = control.comm.comm_id

        control.charts.append(self)
        self.model = control.model

        # Custom attributes
        self.source = {'setup': '', 'update': '', 'reset': ''}
        self.source.update(source)  # Add passed functions

        # Configuration & data collectors
        self.config = config if config else {}
        data = data if data else {}
        self.collectors = {k: self._collector(v) for k, v in data.items()}

        super().__init__()

    def sync_data(self):
        """ Retrieve new data from the back-end (python) simulation model
        and send it to the front-end (javascript). """
        new_data = {k: v(self.model) for k, v in self.collectors.items()}
        self.send({"what": "new_data", "data": new_data})

    def reset_data(self):
        new_data = {k: v(self.model) for k, v in self.collectors.items()}
        self.send({"what": "reset_data", "data": new_data})


@ipywidgets.register
class Lineplot(ipywidgets.DOMWidget, Ipswidget):
    """ Chart widget for one or multiple data-series.

    Arguments:
        control (Control):
            The simulation control panel.
        y (str or function or list):
            Data collector(s) for the y axis.
        ylabel (str or list of str, optional):
            Label(s) for the y axis.
        x (str, or function, optional):
            Data collector for the x axis (default 't').
        xlabel (str, optional):
            Label for the x axis (default 'Time-step t').
    """

    _view_name = traitlets.Unicode('LinechartView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _model_name = traitlets.Unicode('LinechartModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _control_id = traitlets.Unicode().tag(sync=True)
    xlabel = traitlets.Unicode().tag(sync=True)
    ylabels = traitlets.List().tag(sync=True)

    def __init__(self, control,
                 y, ylabel=None,
                 x='t', xlabel=None):

        self._control = control
        self._control_id = control.comm.comm_id

        control.charts.append(self)
        self.model = control.model

        # Collectors
        self.getx = self._collector(x)
        if xlabel:
            self.xlabel = xlabel
        elif isinstance(x, str):
            if x == 't':
                self.xlabel = 'Time-step t'
            else:
                self.xlabel = x
        else:
            raise ValueError("xlabel must be defined if x is a function")

        self.gety = {}
        yinstrs = make_list(y)

        if ylabel:
            self.ylabels = make_list(ylabel)
        elif all([isinstance(yinstr, str) for yinstr in yinstrs]):
            self.ylabels = yinstrs
        else:
            raise ValueError("ylabel must be defined if y contains functions")

        for ylabel, yinstr in zip(self.ylabels, yinstrs):
            self.gety[ylabel] = self._collector(yinstr)

        super().__init__()  # **kwargs

    def sync_data(self):
        """ Retrieve new data from the simulation model and send it to front_end """

        new_data = {
            'x': self.getx(self.model),
            'series': {k: gety(self.model) for k, gety in self.gety.items()}
        }
        self.send({"what": "new_data", "data": new_data})

    def reset_data(self):
        self.send({"what": "reset_data"})


@ipywidgets.register
class Scatterplot(ipywidgets.DOMWidget, Ipswidget):
    """ Chart widget for a scatterplot.

    Arguments:
        control (Control):
            The simulation control panel.
        xy (str or function):
            Data collector for the x and y coordinates (see :ref:`collectors`).
        c (str or function):
            Data collector for the colors (see :ref:`Data Collector <collectors>`).
    """

    _view_name = traitlets.Unicode('ScatterView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _model_name = traitlets.Unicode('ScatterModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode(semver_range).tag(sync=True)

    def __init__(self, control, xy, c):

        control.charts.append(self)
        self._model = control.model

        # Collectors
        self._getxy = self._collector(xy)
        self._getc = self._collector(c) if c else lambda: 0

        #self.send({
        #    "what": "shape",
        #    "width": shape[0],
        #    "height": shape[1]
        #})

        super().__init__()  # **kwargs

    def sync_data(self):
        """ Retrieve new data from the simulation model and send it to front_end """

        data = [{'x': xy[0], 'y': xy[1], 'c': c} for xy, c
                in zip(self._getxy(self._model), self._getc(self._model))]
        self.send({
            "what": "new_data",
            "data": data
        })

    def reset_data(self):
        self.sync_data()


class Matplot(ipywidgets.Output):
    """ Matplotlib subplots widget with a custom update function.

    Arguments:
        control (Control):
            The simulation control panel.
        update (function):
            Function that takes `(model, fig, ax)` as input.
        *args:
            Forwarded to :func:`matplotlib.pyplot.subplots`.
        *kwargs:
            Forwarded to :func:`matplotlib.pyplot.subplots`.
    """
    # TODO Improve description
    def __init__(self, control, update, *args, **kwargs):
        super().__init__()
        self._control = control
        self._update = update

        with self:
            self._fig, self._ax = plt.subplots(*args, **kwargs)

        control.charts.append(self)

    def sync_data(self):

        self._update(self._control.model, self._fig, self._ax)

    def reset_data(self):

        self._ax.clear()