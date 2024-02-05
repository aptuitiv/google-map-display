/* ===========================================================================
    Google Maps Loader
=========================================================================== */

import { Loader, Libraries } from '@googlemaps/js-api-loader';
import { isFunction, isObject, isObjectWithValues, isString, isStringWithValue } from './helpers';
import { Evented } from './Evented';

// Loader Options
export type LoadOptions = {
    // The Google Maps API key
    apiKey?: string;
    // An array of additional Maps JavaScript API libraries to load. By default no extra libraries are loaded.
    // The "places" library is a common one to load. https://developers.google.com/maps/documentation/javascript/places
    // https://developers.google.com/maps/documentation/javascript/libraries
    libraries?: Libraries;
    // The version of the Google Maps API to load.
    // https://developers.google.com/maps/documentation/javascript/versions
    version?: string;
};

/**
 * Singleton object to hold the loader options
 */
export const LoadData = (() => {
    /**
     * The singleton instance of the object
     *
     * @type {LoadOptions}
     */
    let instance: LoadOptions;

    /**
     * Create the object instance
     *
     * @private
     * @returns {LoadOptions}
     */
    function createInstance(): LoadOptions {
        return {
            // The Google Maps API key
            apiKey: '',
            // An array of additional Maps JavaScript API libraries to load. By default no extra libraries are loaded.
            libraries: [],
            // The version of the Google Maps API to load.
            version: 'weekly',
        };
    }

    return {
        /**
         * Get the singleton instance of the object
         *
         * @returns {LoadOptions}
         */
        getInstance(): LoadOptions {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        },
    };
})();

/**
 * Class to load the Google maps API
 */
export class Load extends Evented {
    /**
     * Holds the loader options singleton object
     *
     * @private
     * @type {LoadOptions}
     */
    #options: LoadOptions;

    /**
     * Class constructor
     *
     * @param {LoadOptions} [options] The loader options object
     */
    constructor(options?: LoadOptions) {
        super('load');
        this.#options = LoadData.getInstance();
        if (isObject(options)) {
            this.setOptions(options);
        }
    }

    /**
     * Get the Google Maps API key
     *
     * @returns {string}
     */
    get apiKey(): string {
        return this.#options.apiKey;
    }

    /**
     * Set the Google Maps API key
     *
     * @param {string} apiKey The Google Maps API key
     */
    set apiKey(apiKey: string) {
        if (isString(apiKey)) {
            this.#options.apiKey = apiKey;
        }
    }

    /**
     * Get the libraries to load with Google maps
     *
     * @returns {Libraries}
     */
    get libraries(): Libraries {
        return this.#options.libraries;
    }

    /**
     * Set the libraries to load with Google maps
     * The "places" library is a common one to load.
     * https://developers.google.com/maps/documentation/javascript/places
     *
     * @param {Libraries} libraries The libraries to load with Google maps
     */
    set libraries(libraries: Libraries) {
        if (Array.isArray(libraries)) {
            this.#options.libraries = libraries;
        } else if (isStringWithValue(libraries)) {
            this.#options.libraries = [libraries];
        }
    }

    /**
     * Get the version of the Google Maps API to load
     *
     * @returns {string}
     */
    get version(): string {
        return this.#options.version;
    }

    /**
     * Set the version of the Google Maps API to load
     * https://developers.google.com/maps/documentation/javascript/versions
     *
     * @param {string} version The version of the Google Maps API to load
     */
    set version(version: string) {
        if (isString(version)) {
            this.#options.version = version;
        }
    }

    /**
     * Set the loader options
     *
     * @param {LoadOptions} options The loader options object
     * @returns {Load}
     */
    setOptions(options: LoadOptions): Load {
        if (isObjectWithValues(options)) {
            const data = LoadData.getInstance();
            if (isString(options.apiKey)) {
                data.apiKey = options.apiKey;
            }
            if (Array.isArray(options.libraries)) {
                data.libraries = options.libraries;
            }
            if (isString(options.version)) {
                data.version = options.version;
            }
        } else {
            throw new Error('The Load.setOptions() options parameter is required and must be an object');
        }
        return this;
    }

    /**
     * Set the Google Maps API key
     *
     * @param {string} apiKey The Google Maps API key
     * @returns {Load}
     */
    setApiKey(apiKey: string): Load {
        this.apiKey = apiKey;
        return this;
    }

    /**
     * Set the libraries to load with Google maps
     * The "places" library is a common one to load.
     * https://developers.google.com/maps/documentation/javascript/places
     *
     * @param {Libraries} libraries The libraries to load with Google maps
     * @returns {Load}
     */
    setLibraries(libraries: Libraries): Load {
        this.libraries = libraries;
        return this;
    }

    /**
     * Set the version of the Google Maps API to load
     * https://developers.google.com/maps/documentation/javascript/versions
     *
     * @param {string} version The version of the Google Maps API to load
     * @returns {Load}
     */
    setVersion(version: string): Load {
        this.version = version;
        return this;
    }

    /**
     * Load the Google maps API
     *
     * @param {Function} callback A callback function to run when the Google maps API has loaded
     * @returns {Promise<void>}
     */
    load(callback?: () => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const data = LoadData.getInstance();
            if (isStringWithValue(data.apiKey)) {
                // Set up the Google maps loader
                // https://www.npmjs.com/package/@googlemaps/js-api-loader
                const loader = new Loader({
                    apiKey: data.apiKey,
                    version: data.version,
                    libraries: data.libraries,
                });
                loader
                    .importLibrary('maps')
                    .then(() => {
                        if (isFunction(callback)) {
                            callback();
                        }
                        this.dispatch('load');
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                reject(new Error('The Google Maps API key is not set'));
            }
        });
    }
}

/**
 * Helper function to set up the map object
 *
 * @param {LoadOptions} [config] The map options
 * @returns {Load}
 */
export const loader = (config?: LoadOptions): Load => new Load(config);
