.. currentmodule:: ipysimulate

========
Overview
========

Structure
#########

An interactive simulation consists of three main elements:

1. A :ref:`simulation model <simulation_model>`.
2. An interactive control panel.
3. Various visualization widgets that display information about the simulation.

.. _simulation_model:

Simulation model
################

The simulation model is a class that can perform a discrete simulation steps.
One can either use models from a compatible package like `AgentPy <https://agentpy.readthedocs.io/>`_.,
or define custom simulation models with the following attributes:

- sim_setup (method): Prepares the simulation (time-step 0).
- sim_step (method): Performs a single step of the simulation.
- sim_reset (method): Resets model to initial state before setup.
- set_parameters (method):
  Takes a dictionary with parameter names and values as an input
  and uses them to update the model's parameters.
- running (bool): Indicator whether the simulation is still active.

A simple model that increases a variable `x` by a parameter `dx` per step would look like this::

    class MyModel():

        def sim_setup(self):
            self.running = True
            self.x = 0

        def sim_step(self):
            self.x += self.dx
            if self.x > self.x_max:
                self.running = False

        def sim_reset(self):
            self.sim_setup()

        def set_parameters(self, parameters):
            self.dx = parameters['dx']

Control panel
#############

The class :class:`Control` provides an interactive widget to run and
reset a simulation model as well as sliders to change parameter values.

Visualization widgets
#####################

.. _collectors:

Data collectors
---------------

A data collector is an instruction on how to retrieve data from a model.
Most IPySimulate widgets take multiple such collectors as input arguments.
A collector can be defined in two ways:

1. As a string, referring to a model attribute.
   For example, a collector `'x'` would retrieve the model's attribute `x`.
   Sub-attributes like e.g. `'x.y.z'` can be given using the `.` seperator.

2. A collector can be given as a function that takes the model as an input
   and returns the value. For example, the collector `'x.y.z'` could instead be
   given as `lambda model: return model.x.y.z`.

Pre-defined widgets
-------------------

At the moment, there are two pre-defined visualization widgets:

- :class:`Lineplot`
- :class:`Scatterplot`

Custom widgets
--------------

Alternatively, it is also possible to define custom visualization widgets:

- :class:`CustomWidget` for visualizations with JavaScript and D3.
- :class:`Matplot` for visualizations with Matplotlib.