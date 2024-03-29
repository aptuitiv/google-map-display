/* ===========================================================================
    Global object type definition
=========================================================================== */

import { icon, Icon } from './lib/Icon';
import { infoWindow, InfoWindow } from './lib/InfoWindow';
import { latLng, LatLng } from './lib/LatLng';
import { latLngBounds, LatLngBounds } from './lib/LatLngBounds';
import { loader, Loader } from './lib/Loader';
import { map, Map } from './lib/Map';
import { marker, Marker } from './lib/Marker';
import { markerCluster, MarkerCluster } from './lib/MarkerCluster';
import { point, Point } from './lib/Point';
import { popup, Popup } from './lib/Popup';
import { size, Size } from './lib/Size';
import { svgSymbol, SvgSymbol } from './lib/SvgSymbol';
import { tooltip, Tooltip } from './lib/Tooltip';

type GlobalObj = {
    icon: typeof icon;
    Icon: typeof Icon;
    infoWindow: typeof infoWindow;
    InfoWindow: typeof InfoWindow;
    latLng: typeof latLng;
    LatLng: typeof LatLng;
    latLngBounds: typeof latLngBounds;
    LatLngBounds: typeof LatLngBounds;
    loader: typeof loader;
    Loader: typeof Loader;
    map: typeof map;
    Map: typeof Map;
    marker: typeof marker;
    Marker: typeof Marker;
    markerCluster: typeof markerCluster;
    MarkerCluster: typeof MarkerCluster;
    point: typeof point;
    Point: typeof Point;
    popup: typeof popup;
    Popup: typeof Popup;
    size: typeof size;
    Size: typeof Size;
    svgSymbol: typeof svgSymbol;
    SvgSymbol: typeof SvgSymbol;
    tooltip: typeof tooltip;
    Tooltip: typeof Tooltip;
};

export default GlobalObj;
