import '../sass/style.scss';

import { $, $$ } from './modules/bling';
// This is the entry point for all client-side JS
import autocomplete from "./autocomplete";

// Looks like jQuery but isn't. Bling makes the syntax easier here.
autocomplete($('#address'), $('#lat'), $('#lng'));

