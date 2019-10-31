import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
        <a href="/store/${store.slug}" class="search__result">
            <strong>${store.name}</strong>
        </a>
        `
    }).join('');
}
function typeAhead(search) {
    if(!search) return;

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    // listen for search event
    // shorthand syntax for adding event listener using bling
    searchInput.on('input', function(){
        // if there is no value then hide search results
        if(!this.value){
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';

        axios
            .get(`/api/search?q=${this.value}`)
            .then(res => {
                //console.log(res.data)
                if(res.data.length){
                    console.log('There is something to show!');
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                    return;
                } else {
                    // tell them nothing came back
                    searchResults.innerHTML = dompurify.sanitize(`<div class"search__result">No results for ${this.value} found!</div>`);
                }
            })
            .catch(err => {
                // Could use logging software like Sentry to notify dev team
                console.error(err);
            })
        ;
    });

    // handle keyboard inputs using Bling shortcuts again
    searchInput.on('keyup', (e) => {
        // if they aren't pressing up, down or enter then ignore
        if(![38, 40, 13].includes(e.keyCode)){
            return; // skip it
        }

        // figure out what we are currently on, if they press down/up
        const activeClass = 'search__result--active';
        const current     = search.querySelector(`.${activeClass}`);
        const items       = search.querySelectorAll('.search__result');
        let next;

        if(e.keyCode === 40 && current) {
            // gracefully falls back to first element if go off list
            next = current.nextElementSibling || items[0];
        } else if(e.keyCode === 40){
            // if users press down and there is no current (i.e. this is
            // the first time they have pressed down since they refreshed page)
            // then just move user down to first search result
            next = items[0];
        } else if(e.keyCode === 38 && current) {
            // if someone presses up and there is a current one
            // gracefully loop back to top
            next = current.previousElementSibling || items[items.length - 1];
        } else if(e.keyCode === 38) {
            // if there is no current element and user clicks up then
            // make the bottom search result active
            next = items[items.length - 1];
        } else if (e.keyCode === 13 && current.href) {
            // if user hits enter and there is a URL on that search result then
            // nav the user to that URL
            window.location = current.href;
            return;
        }
        console.log(next);

        if(current){
            current.classList.remove(activeClass);
        }
        next.classList.add(activeClass);

    });

    // console.log(searchInput, searchResults);
}

export default typeAhead;
