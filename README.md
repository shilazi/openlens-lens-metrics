# OpenLens Lens Metrics Extension

This OpenLens extension adds back cluster lens metrics functionality that was removed from OpenLens itself in 6.3.0.

# Installing this extension

In OpenLens, navigate to the Extensions list. In the text box, enter the name of this plugin:

```
https://raw.githubusercontent.com/shilazi/openlens-lens-metrics/main/build/shilazi-openlens-lens-metrics-0.1.0.tgz
```

Click "Install", and after a few moments, the plugin should appear in the list of installed extensions and be enabled.

# How to build this extension locally

From the root of this repository:

```sh
npm install
npm run build
```

The tarball for the extension will be placed in the current directory. In OpenLens, navigate to the Extensions list and provide the path to the tarball to be loaded, or drag and drop the extension tarball into the OpenLens window. After loading for a moment, the extension should appear in the list of enabled extensions.

# License

Like the OpenLens repository itself at the point from which this extension is based upon, the content of this repository is released under the MIT license. See the file `LICENSE` for details.
