IPySimulate - Interactive simulations for Python
================================================

[![PyPI](https://img.shields.io/pypi/v/ipysimulate)](https://pypi.org/project/ipysimulate/)
[![GitHub](https://img.shields.io/github/license/joelforamitti/ipysimulate)](https://github.com/JoelForamitti/ipysimulate/blob/master/LICENSE)
[![Documentation Status](https://readthedocs.org/projects/ipysimulate/badge/?version=stable)](https://ipysimulate.readthedocs.io/en/stable/?badge=stable)

The ipysimulate library provides tools to create 
interactive simulations with IPython and Jupyter. 
It includes a simulation control panel, 
widgets to adjust parameters at runtime, 
and dynamically updating d3.js charts. 

For application examples, 
check out this [user guide](https://agentpy.readthedocs.io/en/stable/guide_interactive.html) 
of the [AgentPy](https://github.com/JoelForamitti/agentpy) documentation.

This library is still in an early stage of development, 
and more features will follow in the future. 
Contributions are very welcome :)

Installation
------------

To install use pip:

    $ pip install ipysimulate

For a development installation (requires [Node.js](https://nodejs.org) and [Yarn version 1](https://classic.yarnpkg.com/)):

    $ git clone https://github.com/JoelForamitti/ipysimulate.git
    $ cd ipysimulate
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix ipysimulate
    $ jupyter nbextension enable --py --sys-prefix ipysimulate

When actively developing your extension for JupyterLab, run the command:

    $ jupyter labextension develop --overwrite ipysimulate

Then you need to rebuild the JS when you make a code change:

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.


