.. currentmodule:: ipysimulate

=========
Changelog
=========

0.2.1 (August 2021)
-------------------

* New class :class:`CustomWidget` with a dedicated tutorial :doc:`guide_custom_widgets`.
* The class :class:`Control` no longer requires the simulation model to have a method `sim_reset`.
  Resets simply call the method `sim_setup`, which should re-declare all variables.

0.2.0 (May 2021)
-------------------

First documented release.