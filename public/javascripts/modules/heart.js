import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {

    // prevent form from submitting itself
    e.preventDefault();

    // Intercept let our client-side JavaScript takeover.
    // The JS effecitively handles the action and then updates the interface 'in-place'
    axios
        .post(this.action)
        .then(res => {
            console.log(res.data);
            // Accessing the button element in the form as this is a named element.
            // Either remove or add the hearted class
            const isHearted = this.heart.classList.toggle('heart__button--hearted');

            // Use bling to select the heart count and modify here
            $('.heart-count').textContent = res.data.hearts.length;

            // If is hearted then add class for small animation
            if(isHearted){
                this.heart.classList.add('heart__button--float');
                setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
            }

        })
        .catch(console.error);

}

export default ajaxHeart;
