import '../sass/style.scss';

import { $, $$ } from './modules/bling';
// This is the entry point for all client-side JS
import autocomplete from './autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

// Looks like jQuery but isn't. Bling makes the syntax easier here.
autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

makeMap($('#map'));


// is like querying all elements in Bling
const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);
