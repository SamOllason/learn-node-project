function autocomplete(input, latInput, lngInput){
    console.log(input, latInput, lngInput);

    if(!input) return; // skip if no input on page

    // Dropdown comes with Google maps API
    // Even just with the one line we get autocomplete functionality in the UI
    const dropdown = new google.maps.places.Autocomplete(input);

    dropdown.addListener('place_changed', () => {
        const place = dropdown.getPlace();
        console.log(place);

        latInput.value= place.geometry.location.lat();
        lngInput.value= place.geometry.location.lng();

    });

    // if someone hits enter on address field do not submit form
    input.on('keydown', (e) =>{
        if(e.keyCode === 13){
            e.preventDefault();
        }
    })

}

// Don't have default module importing in Node yet
// but do in Webpack which handles all our client-side JS.
export default autocomplete;