import '../sass/style.scss';

import { $, $$ } from './modules/bling';
// This is the entry point for all client-side JS
import autocomplete from "./autocomplete";

// looks like jQUery but blking makes the syntax easier here.
autocomplete($('#address'), $('#lat'), $('#lng'));

