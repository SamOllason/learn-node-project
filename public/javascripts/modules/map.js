import axios from 'axios';
import { $ } from './bling';

// Can get this automatically using navigator.geolocation.getCurrentPosition
// See WB other tutorial

const mapOptions = {
    center: { lat: 43.2, lng: -79.8 },
    zoom: 8
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
    // Hit our API endpoint
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            // console.log(places);

            if(!places.length) {
                alert('no places found!');
                return;
            }

            // Create a bounds to make sure the map is zoomed in to the
            // appropriate level.
            const bounds = new google.maps.LatLngBounds();
            const infoWindow = new google.maps.InfoWindow();

            // markers are the red dots on Google maps
            const markers = places.map(place => {
                // destructuring array
                const [placeLng, placeLat] = place.location.coordinates;
                console.log(placeLng, placeLat);

                const position = { lat: placeLat, lng: placeLng};

                // Adjust our bounds taking into account this particular marker
                // Means we get a perfect rectangle around our markers.
                bounds.extend(position);

                const marker = new google.maps.Marker({map, position});

                // Attach place data to our market
                // so we can use the data when someone clicks the marker.
                // This is all the info that came from our API
                marker.place = place;
                return marker;
            });

            // when someone clicks on a marker, show details of place
            markers.forEach(marker => marker.addListener('click', function() {
                // the HTML here is actually part of the page so we can style with usual CSS
                // (not using iFrame or anything)
                const html = `
                    <div class="popup">
                        <a href="/store/${this.place.slug}">
                            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}"/>                   
                        </a>
                        <p>${this.place.name} - ${this.place.location.address}</p>
                    </div>
                `;

                // addListener is what we need for Google Maps library use
                // infoWindow.setContent(this.place.name);
                infoWindow.setContent(html);
                // Put it on our map, pass it the marker
                infoWindow.open(map,this);
            }));

            // then zoom the map to fit the maps perfectly using our bounds
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);



        });
}

function makeMap(mapDiv) {
    console.log(mapDiv);

    // Make use of Google Maps JS library included with main template
    if(!mapDiv) return;

    // make our map
    const map = new google.maps.Map(mapDiv, mapOptions);

    loadPlaces(map);

    // use bling.js
    const input = $('[name="geolocate"]');
    console.log(input);

    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
    });

}

export default makeMap;
