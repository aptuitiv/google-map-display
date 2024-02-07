/* ===========================================================================
    Javascript for the Infowindow page
=========================================================================== */


/* global G */

/* TEST 1 */
const map = G.map('map1', { apiKey: apiKey, center: { latitude: 48.864716, longitude: 2.3522 } });
map.load().then(() => {

});

const marker = G.marker({
    latitude: 48.864716,
    longitude: 2.3522,
    map: map,
    title: 'My Marker',
});

marker.bindInfoWindow('Testing after load');

const marker2 = G.marker({
    latitude: 49.864716,
    longitude: 2.6522,
    map: map,
    title: 'Another marker',
});
const infoWindow = G.infoWindow({
    content: 'This is a test',
});
marker2.on('click', () => {
    infoWindow.open(marker2);
});


const mapInfoWindow = G.infoWindow({
    content: 'This is a test on the map',
    minWidth: 300
});
map.bindInfoWindow(mapInfoWindow);
// map.on('click', (e) => {
//     console.log('clicking: ', e);
//     mapInfoWindow.open(map);
// });
