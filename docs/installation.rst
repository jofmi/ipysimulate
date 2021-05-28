.. currentmodule:: ipysimulate
.. highlight:: shell

============
Installation
============

To install use pip:

.. code-block:: console

    $ pip install ipysimulate

For a development installation (requires Node.js and Yarn version 1):

.. code-block:: console

    $ git clone https://github.com/JoelForamitti/ipysimulate.git
    $ cd ipysimulate
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --overwrite --sys-prefix ipysimulate
    $ jupyter nbextension enable --py --sys-prefix ipysimulate

When actively developing your extension for JupyterLab, run the command:

.. code-block:: console

    $ jupyter labextension develop --overwrite ipysimulate

Then you need to rebuild the JS when you make a code change:

.. code-block:: console

    $ cd js
    $ yarn run build

You then need to refresh the JupyterLab page when your javascript changes.
