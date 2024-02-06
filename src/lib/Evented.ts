/* ===========================================================================
    Base class to be extended by classes that need to emit events.

    If you don't need events then you can just extend from the Base class.

    This is a wrapper around the EventTarget class to provide a more
    succinct interface for emitting events.
=========================================================================== */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* global google */

import { checkForGoogleMaps, isFunction, isObject, isString, objectEquals } from './helpers';
import Base from './Base';
import { latLng, LatLng } from './LatLng';
import { loader } from './Loader';

// Base event callback data type
export type Event = {
    // The corresponding native DOM event. This come from the Google Maps event data
    domEvent?: MouseEvent | TouchEvent | PointerEvent | KeyboardEvent | Event;
    // The latitude/longitude that was below the cursor when the event occurred.
    latLng?: LatLng;
    // The placeId of the place that was below the cursor when the event occurred.
    // This is only set when the user clicks on an icon on the map.
    placeId?: string;
    // Call this function to stop the event from propagating further.
    // This comes from the Google Maps event data.
    stop?: () => void;
    // The event type.
    type: string;
};

// Type for the callback function
export type EventCallback = (event: Event) => void;

// Options for the event listener
export type EventOptions = {
    once?: boolean;
};

// The data to hold for each event listener
type EventData = {
    callback: EventCallback;
    options: EventOptions;
};

// The collection of event listeners
type Events = { [key: string]: EventData[] };

/**
 * Evented class to add syntatic sugar to handling events
 */
export class Evented extends Base {
    /**
     * Holds the event listeners
     *
     * @private
     * @type {Events}
     */
    #eventListeners: Events = {};

    #googleObject: google.maps.MVCObject;

    /**
     * Holds whether the onload event was set on the Loader class to
     * set up the pending event listeners after the Google Maps API library is loaded.
     *
     * @private
     * @type {boolean}
     */
    #isOnLoadEventSet: boolean = false;

    /**
     * Holds the event listeners that are waiting to be added once the Google Maps API is loaded
     *
     * @private
     * @type {Events}
     */
    #pendingEventListeners: Events = {};

    /**
     * Add an event listener that will be set up after the Google Maps API is loaded
     *
     * @param {string} [event] The event type
     * @param {EventCallback} [callback] The event listener function
     * @param {EventOptions} [options] The options object or a boolean to indicate if the event should be captured
     */
    addPendingEventListener(event: string, callback: EventCallback, options?: EventOptions) {
        if (!this.#pendingEventListeners[event]) {
            this.#pendingEventListeners[event] = [];
        }
        this.#pendingEventListeners[event].push({ callback, options });

        if (!this.#isOnLoadEventSet) {
            loader().once('map_loaded', () => {
                Object.keys(this.#pendingEventListeners).forEach((type) => {
                    this.#pendingEventListeners[type].forEach((evt) => {
                        this.on(type, evt.callback, evt.options);
                    });
                });
                this.#pendingEventListeners = {};
            });
            this.#isOnLoadEventSet = true;
        }
    }

    /**
     * Dispatch an event
     *
     * @param {string} event The event to dispatch
     * @param {Event} [data] The details to pass to the event. If set then a CustomEvent is created, otherwise a regular
     *      Event is created
     * @returns {Evented}
     */
    dispatch(event: string, data?: any): Evented {
        if (!this.hasListener(event)) {
            return this;
        }

        // Dispatch the event
        const listeners = this.#eventListeners[event];
        if (listeners) {
            // Set up the data to pass to the callback function
            let eventData: Event = {
                type: event,
            };
            if (isObject(data)) {
                // Test to see if this is a Google Maps event.
                // The MapMouseEvent, which other Google events extend from, has a domEvent property.
                if (typeof (data as google.maps.MapMouseEvent).domEvent !== 'undefined') {
                    const googleData = data as google.maps.MapMouseEvent;
                    eventData.domEvent = googleData.domEvent;
                    if (isFunction(googleData.stop)) {
                        eventData.stop = googleData.stop;
                    }
                    if (typeof googleData.latLng !== 'undefined') {
                        eventData.latLng = latLng(googleData.latLng.lat(), googleData.latLng.lng());
                    }
                    if (typeof (data as google.maps.IconMouseEvent).placeId !== 'undefined') {
                        eventData.placeId = (data as google.maps.IconMouseEvent).placeId;
                    }
                } else {
                    // Merge the data with the event data
                    eventData = { ...eventData, ...(data as Event) };
                }
            }

            const listenersToRemove: EventData[] = [];
            // Call the callback functions
            listeners.forEach((listener) => {
                listener.callback.call(this, eventData);
                if (
                    typeof listener.options !== 'undefined' &&
                    isObject(listener.options) &&
                    typeof listener.options.once === 'boolean' &&
                    listener.options.once === true
                ) {
                    listenersToRemove.push(listener);
                }
            });

            // Remove the listeners that are set to be called once
            listenersToRemove.forEach((listener) => {
                this.off(event, listener.callback, listener.options);
            });
        }
        return this;
    }

    /**
     * Test if there are any listeners for the given event type
     *
     * Optionally you can test if there are any listeners for the given event type and callback
     *
     * @param {string} type The event type to test form
     * @param {EventCallback} callback Optional callback function to include in the test
     * @returns {boolean}
     */
    hasListener(type: string, callback?: EventCallback): boolean {
        if (!this.#eventListeners[type]) {
            return false;
        }
        if (typeof callback === 'function') {
            return this.#eventListeners[type].filter((event) => event.callback === callback).length > 0;
        }
        return this.#eventListeners[type] && this.#eventListeners[type].length > 0;
    }

    /**
     * Removes the event listener
     *
     * There are three ways to remove event listeners:
     * 1. Remove a specific event listener
     *      this.off('click', onClickFunction);
     *      this.off('click', onClickFunction, options);
     * 2. Remove all listeners for a given event type
     *      this.off('click');
     * 3. Remove all listeners for all event types
     *     this.off();
     *     this.offAll();
     *
     * @param {string} [type] The event type
     * @param {EventCallback} [callback] The event listener function
     * @param {EventOptions} [options] The options object or a boolean to indicate if the event should be captured
     */
    off(type?: string, callback?: EventCallback, options?: EventOptions): void {
        if (isString(type)) {
            if (this.#eventListeners[type]) {
                if (isFunction(callback)) {
                    // Compare the callback function and possibly the options to see if
                    // The event listener should be removed.
                    this.#eventListeners[type] = this.#eventListeners[type].filter((listener) => {
                        let keep = true;
                        if (isObject(options)) {
                            keep = listener.callback !== callback || !objectEquals(options, listener.options);
                        } else {
                            keep = listener.callback !== callback;
                        }
                        return keep;
                    });
                } else {
                    this.#eventListeners[type] = [];
                }
            }

            // If there are no more event listeners for the given type then remove the listener from the Google maps object
            if (this.#eventListeners[type].length === 0 && this.#googleObject instanceof google.maps.MVCObject) {
                google.maps.event.clearListeners(this.#googleObject, type);
            }
        } else {
            this.offAll();
        }
    }

    /**
     * Removes all event listeners
     */
    offAll(): void {
        this.#eventListeners = {};

        // Remove all event listeners from the Google maps object
        if (this.#googleObject instanceof google.maps.MVCObject) {
            google.maps.event.clearInstanceListeners(this.#googleObject);
        }
    }

    /**
     * Add an event listener to the object
     *
     * @param {string} type The event type
     * @param {Function} callback The event listener callback function
     * @param {EventOptions} [options] The options object
     */
    on(type: string, callback: EventCallback, options?: EventOptions): void {
        this.#on(type, callback, options);
    }

    /**
     * Add an event listener to the object
     *
     * @param {string} type The event type
     * @param {Function} callback The event listener callback function
     * @param {EventOptions} [options] The options object
     */
    #on(type: string, callback: EventCallback, options?: EventOptions): void {
        if (!this.#eventListeners[type]) {
            this.#eventListeners[type] = [];
        }
        this.#eventListeners[type].push({ callback, options });
    }

    /**
     * Sets up an event listener that will only be called once
     *
     * @param {string} type The event type
     * @param {EventCallback} [callback] The event listener callback function
     */
    once(type: string, callback?: EventCallback): void {
        this.on(type, callback, { once: true });
    }

    /**
     * Sets up the event listener on the Google maps object.
     *
     * This also handles setting up the pending events if the Google Maps library isn't loaded already.
     *
     * This should be called from an "on()" function in the class that extends this class.
     * It is not intended to be called from outside of this library.
     *
     * @internal
     * @param {string} type The event type
     * @param {EventCallback} callback The event listener callback function
     * @param {EventOptions} options The options for the event listener
     * @param {string} testObject The object that needs Google maps. This should be the name of the object that calls this method.
     * @param {string} [testLibrary] An optional Google maps library class to check for. This needs to be part of the google.maps object.
     */
    setupEventListener(
        type: string,
        callback: EventCallback,
        options: EventOptions,
        testObject: string,
        testLibrary?: string
    ): void {
        if (isFunction(callback)) {
            if (checkForGoogleMaps(testObject, testLibrary, false)) {
                const hasEvent = Array.isArray(this.#eventListeners[type]);
                this.#on(type, callback, options);
                if (!hasEvent && this.#googleObject instanceof google.maps.MVCObject) {
                    // The Google maps object is set and the event listener is not already set up on it.
                    this.#googleObject.addListener(type, (e: google.maps.MapMouseEvent) => {
                        this.dispatch(type, e);
                    });
                }
            } else {
                this.addPendingEventListener(type, callback, options);
            }
        } else {
            throw new Error(`The "${type}" event handler needs a callback function`);
        }
    }

    /**
     * Set the Google maps MVC object
     *
     * This is the Google object that the object represents. Event listeners will be added to it.
     *
     * This should only be called from the class that extends this class.
     * This is not intended to be called from outside of this library.
     *
     * @internal
     * @param {google.maps.MVCObject} googleObject The Google maps MVC object
     */
    setEventGoogleObject(googleObject: google.maps.MVCObject): void {
        this.#googleObject = googleObject;
    }
}
