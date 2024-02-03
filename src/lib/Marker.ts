/* ===========================================================================
    Enables building and managing markers on the map.

    https://developers.google.com/maps/documentation/javascript/markers
    https://developers.google.com/maps/documentation/javascript/reference/marker

    Example usage:
    const marker = G.marker({
        latitude: 40.730610,
        longitude: -73.935242,
        title: 'My Marker'
    });
    marker.addTo(map);

    // Or, with a custom tooltip
    const marker = G.marker({
        latitude: 40.730610,
        longitude: -73.935242,
        title: 'My Marker',
        tooltipContainer: '#map',
        tooltipClass: 'my-tooltip'
    });
    marker.addTo(map);

    There are a few ways to set an icon for the marker.
    1. Pass the URL for the icon to the "icon" option.
    2. Pass an Icon class object to the "icon" option.
    3. Pass an SvgSymbol class object to the "svgIcon" option.

    There are a few ways to set an SVG icon for the marker.
    1. Use the path for an icon and set up an SvgSymbol class object. Then pass that value to the svgIcon option.
        const svg = G.svgSymbol({
            path: 'M-6,0a6,6 0 1,0 12,0a6,6 0 1,0 -12,0',
            fillColor: '#5284ed',
            fillOpacity: 1,
            scale: 1,
            strokeColor: '#5284ed',
            strokeOpacity: 0.5,
            strokeWeight: 4,
        });
        G.marker(this.map, {
            svgIcon: svg,
            title: 'My location',
        });
    2. Pass the URL for the SVG icon to the "icon" option.
        G.marker(this.map, {
            icon: 'https://site.com/url/to/svg-file.svg',
            title: 'My location',
        });
    3. Set up an Icon class object and pass that to the "icon" option.
        const svg = G.icon({
            url: 'https://site.com/url/to/svg-file.svg',
            size: [20, 32]
        });
        G.marker(this.map, {
            icon: svg,
            title: 'My location',
        });
    4. base64 encode the SVG HTML and pass that to the "icon" option.
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
                <circle opacity=".4" fill="#5284ed" cx="11" cy="11" r="11"/>
                <circle fill="#5284ed" stroke="#fff" stroke-width="1" cx="11" cy="11" r="7"/>
            </svg>`;
        G.marker(this.map, {
            icon: `data:image/svg+xml;base64,${btoa(svg)}`,
            title: 'My location',
        });
        This, however, can be simplified with the svgIconXml option. It takes care of doing the base64 encoding.
        G.marker(this.map, {
            svgIconXml: svg,
            title: 'My location',
        });

    If you want to pass custom data to events on the marker, you can use the eventData option.
    It should be an object of data.
    This will be passed to the event callback function in the "detail" property of the event.
    const marker = G.marker({
        latitude: 40.730610,
        longitude: -73.935242,
        eventData: {
            name: 'My Marker',
            image: 'https://site.com/url/to/image.jpg'
        }
    });
    marker.addEventListener('click', (e) => {
        console.log(e.detail.name); // 'My Marker'
        console.log(e.detail.image); // 'https://site.com/url/to/image.jpg'
    });
=========================================================================== */

/* global google */

import { EventCallbackData } from './Evented';
import { icon, IconValue } from './Icon';
import { latLng, LatLng, LatLngValue, LatLngLiteral } from './LatLng';
import Layer from './Layer';
import { Map } from './Map';
import { svgSymbol, SvgSymbolValue } from './SvgSymbol';
import { tooltip, TooltipValue } from './Tooltip';
import {
    checkForGoogleMaps,
    isFunction,
    isNumber,
    isNumberOrNumberString,
    isObject,
    isStringOrNumber,
    isStringWithValue,
} from './helpers';

export type MarkerLabel = {
    // A CSS class name to be added to the label element
    className?: string;
    // The color of the label text. Default color is black.
    color?: string;
    // The font family of the label text (equivalent to the CSS font-family property).
    fontFamily?: string;
    // The font size of the label text (equivalent to the CSS font-size property). Default size is 14px.
    // If it's set to a number then "px" will be added to the end of the number.
    fontSize?: string | number;
    // The font weight of the label text (equivalent to the CSS font-weight property).
    fontWeight?: string;
    // The text to be displayed in the label.
    text: string | number;
};

// Marker options
export type MarkerOptions = {
    // The cursor type to show on hover. Defaults to "pointer" if not set.
    cursor?: string;
    // Custom data to pass to any events
    eventData?: EventCallbackData;
    // The icon value for the marker
    icon?: IconValue;
    // The label value for the marker
    label?: string | number | MarkerLabel;
    // The latitude for the marker. You can use "lat" or "latitude" as the property name.
    lat: number | string;
    latitude: number | string;
    // The longitude for the marker. You can use "lng" or "longitude" as the property name.
    lng: number | string;
    longitude: number | string;
    // The map to add the marker to.
    map?: Map | google.maps.Map;
    // The position for the marker.
    // This is an alternate to setting the latitude and longitude separately.
    position?: LatLngValue;
    // The SVG icon value for the marker
    svgIcon?: SvgSymbolValue;
    // The XML code for an SVG icon
    svgIconXml?: string;
    // The title for the marker. If a custom tooltip is not used, this will show as a default tooltip on the marker
    // that shows when you hover over a link with a title.
    title?: string;
    // The tooltip for the marker. This will show when hovering over the tooltip.
    tooltip?: TooltipValue;
};

/**
 * Marker class to set up a single marker and add it to the map
 */
export class Marker extends Layer {
    /**
     * Holds the marker position
     *
     * @type {LatLng}
     */
    private position: LatLng;

    /**
     * Holds the Google maps marker object
     */
    private marker: google.maps.Marker;

    /**
     * Constructor
     *
     * @param {LatLngValue|MarkerOptions} [latLngValue] The latitude longitude pair
     * @param {MarkerOptions} [options] The marker options
     */
    constructor(latLngValue?: LatLngValue | MarkerOptions, options?: MarkerOptions) {
        super('marker');
        checkForGoogleMaps('Marker', 'Marker');
        // Set the marker latitude and longitude value
        if (latLngValue instanceof LatLng) {
            // The value passed is a LatLng class object
            this.position = latLngValue;
        } else if (Array.isArray(latLngValue)) {
            // The value passed is likely an array of [lat, lng] pairs
            this.position = latLng(latLngValue);
        }

        // Create the Google marker object
        this.marker = new google.maps.Marker();

        // Set up the marker options
        if (isObject(latLngValue)) {
            this.setOptions(latLngValue as MarkerOptions);
        } else if (isObject(options)) {
            this.setOptions(options);
        }
    }

    /**
     * Set the marker options
     *
     * @param {MarkerOptions} options The marker options
     * @returns {Marker}
     */
    setOptions(options: MarkerOptions): Marker {
        const markerOptions: google.maps.MarkerOptions = {};
        // Set up the marker position if necessary
        if (
            isNumberOrNumberString(options.lat) ||
            isNumberOrNumberString(options.latitude) ||
            isNumberOrNumberString(options.lng) ||
            isNumberOrNumberString(options.longitude)
        ) {
            const latLngValues: LatLngLiteral = {};
            if (isNumberOrNumberString(options.lat)) {
                latLngValues.lat = options.lat;
            } else if (isNumberOrNumberString(options.latitude)) {
                latLngValues.lat = options.latitude;
            }
            if (isNumberOrNumberString(options.lng)) {
                latLngValues.lng = options.lng;
            } else if (isNumberOrNumberString(options.longitude)) {
                latLngValues.lng = options.longitude;
            }
            if (isNumberOrNumberString(latLngValues.lat) && isNumberOrNumberString(latLngValues.lng)) {
                this.position = latLng(latLngValues);
            }
        } else if (options.position) {
            this.position = latLng(options.position);
        }

        if (this.position) {
            markerOptions.position = this.position.toJson();
        }
        if (options.title && options.tooltip) {
            // The title will be a custom tooltip that is added to the map container
            this.setTooltip(options.tooltip, options.title);
        } else if (options.title) {
            markerOptions.title = options.title;
        }
        // Set the marker icon
        if (options.icon) {
            markerOptions.icon = icon(options.icon).get();
        } else if (options.svgIconXml) {
            markerOptions.icon = `data:image/svg+xml;base64,${btoa(options.svgIconXml)}`;
        } else if (options.svgIcon) {
            markerOptions.icon = svgSymbol(options.svgIcon).get();
        }
        // Set the marker label
        if (isStringWithValue(options.label)) {
            markerOptions.label = options.label;
        } else if (isObject(options.label) && isStringOrNumber(options.label.text)) {
            markerOptions.label = {
                text: options.label.text.toString(),
                className: isStringWithValue(options.label.className) ? options.label.className : undefined,
                color: isStringWithValue(options.label.color) ? options.label.color : undefined,
                fontFamily: isStringWithValue(options.label.fontFamily) ? options.label.fontFamily : undefined,
                fontWeight: isStringWithValue(options.label.fontWeight) ? options.label.fontWeight : undefined,
            };
            // The font size must be a string with a unit. If it's a number then add "px" to the end of it
            if (isStringWithValue(options.label.fontSize) || isNumber(options.label.fontSize)) {
                if (isNumber(options.label.fontSize)) {
                    markerOptions.label.fontSize = `${options.label.fontSize}px`;
                } else {
                    markerOptions.label.fontSize = options.label.fontSize.toString();
                }
            }
        }
        // Set simple options
        const stringOptions = ['cursor'];
        stringOptions.forEach((key) => {
            if (options[key] && isStringWithValue(options[key])) {
                markerOptions[key] = options[key];
            }
        });
        if (options.map) {
            if (options.map instanceof Map) {
                markerOptions.map = options.map.get();
            } else if (options.map instanceof google.maps.Map) {
                markerOptions.map = options.map as google.maps.Map;
            }
        }
        this.marker.setOptions(markerOptions);

        // Handle event data.
        // This allows you to pass custom data to events on the marker
        if (isObject(options.eventData)) {
            this.setEventCallbackData(options.eventData);
        }
        return this;
    }

    /**
     * Set up a custom tooltip for the marker instead of relying on the default browser tooltip
     *
     * @param {TooltipValue} tooltipValue The tooltip value
     * @param {string} title The tooltip title
     * @returns {Marker}
     */
    setTooltip(tooltipValue: TooltipValue, title: string): Marker {
        // Get the tooltip container and make sure it exists
        const tt = tooltip(tooltipValue);
        if (!tt.hasContent()) {
            tt.setContent(title);
        }
        this.marker.addListener('mouseover', () => {
            tt.show(this.getMap(), this.position);
        });
        this.marker.addListener('mouseout', () => {
            tt.hide();
        });
        return this;
    }

    /**
     * Adds the marker to the map object
     *
     * @param {Map} map The map object
     */
    addTo(map: Map): void {
        if (map instanceof Map) {
            this.marker.setMap(map.get());
            this.setMap(map);
        }
    }

    /**
     * Get the marker position (i.e. the LatLng object)
     *
     * https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLng
     *
     * @returns {LatLng}
     */
    getPosition(): LatLng {
        return this.position;
    }

    /**
     * Add an event listener to the object
     *
     * @param {string} type The event type
     * @param {Function} callback The event listener function
     * @param {object|boolean} [options] The options object or a boolean to indicate if the event should be captured
     */
    on(type: string, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void {
        if (isFunction(callback)) {
            super.on(type, callback, options);
            if (isObject(options) && typeof options.once === 'boolean' && options.once) {
                google.maps.event.addListenerOnce(this.marker, type, () => {
                    this.dispatch(type);
                    this.off(type, callback);
                });
            } else {
                this.marker.addListener(type, () => {
                    this.dispatch(type);
                });
            }
        } else {
            throw new Error('the event handler needs a callback function');
        }
    }

    /**
     * Remove the marker from the map
     *
     * @returns {Marker}
     */
    remove(): Marker {
        this.marker.setMap(null);
        return this;
    }

    /**
     * Set the latitude and longitude value for the marker
     *
     * @param {LatLngValue} latLngValue The latitude/longitude position for the marker
     * @returns {Marker}
     */
    setPosition(latLngValue: LatLngValue): Marker {
        this.position = latLng(latLngValue);
        this.marker.setPosition(this.position.get());
        return this;
    }

    /**
     * Get the Google maps marker object
     *
     * https://developers.google.com/maps/documentation/javascript/reference/marker#Marker
     *
     * @returns {google.maps.Marker}
     */
    get(): google.maps.Marker {
        return this.marker;
    }
}

// The possible values for the latLngValue parameter
export type MarkerValue = Marker | MarkerOptions | LatLngValue;

/**
 * Helper function to set up the marker object
 *
 * @param {MarkerValue} [latLngValue] The latitude/longitude pair or the marker options
 * @param {MarkerOptions} [options] The marker options
 * @returns {Marker}
 */
export const marker = (latLngValue?: MarkerValue, options?: MarkerOptions): Marker => {
    if (latLngValue instanceof Marker) {
        return latLngValue;
    }
    return new Marker(latLngValue, options);
};
