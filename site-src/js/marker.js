/* ===========================================================================
    Javascript for the Marker page
=========================================================================== */


/* global G */


const map = G.map('map1', { center: { latitude: 48.864716, longitude: 2.3522 } });
map.display();
const marker = G.marker({
    latitude: 48.9,
    longitude: 2.4,
    map: map,
    title: 'My Marker',
});
marker.on('click', (e) => {
    console.log('Marker Clicked: ', e);
    e.detail.stop();
});
G.loader({ apiKey: apiKey }).load();

// const loader = G.loader({ apiKey: apiKey, });
// loader.on('load', () => { console.log('loaded event'); });
// loader.on('map_loaded', () => { console.log('map loaded event'); });
// loader.load();
// const map = G.map('map1', {
//     apiKey: apiKey,
//     center: { lat: 36.224, lng: -81.688 },
// });

// const marker = G.marker({
//     latitude: 36.224,
//     longitude: -81.688,
//     title: 'My Marker',
//     tooltipContainer: '#map',
//     tooltipClass: 'my-tooltip'
// });
// marker.addTo(map);
// // marker.on('click', (e) => {
// //     console.log('Marker Clicked: ', e);
// // });
// map.display().then(() => {
//     console.log('1 loaded')
//     // marker.addTo(map);
// });

// console.log('map: ', map);
// console.log('isMap: ', map.isMap());
// console.log('isMarker: ', map.isMarker());

