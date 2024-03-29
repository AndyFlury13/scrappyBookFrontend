import { getDownloadURL, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

function counterControl(target, number) {
    const numberString = number.toString();
    const numStringArray = numberString.split('');
    const numArray = Array(numStringArray.length).fill(0);
    const defaults = {
        speed: 3000,
        isDigitBg: false,
        comma: true,
    };
    target.empty();
    target.html('<span class="pplNum"></span>');
    numStringArray.forEach((num, i) => {
        let html = '';
        numArray[i] = parseInt(num, 10);
        if (defaults.isDigitBg) {
            html = `<span class="digit-con"><span class="digit${i}"></span></span>`;
        }
        else {
            html = `<span class="digit-con"><span class="digit${i}">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br></span></span>`;
        }
        target.find('.pplNum').append(html);
    });
    if (defaults.comma) {
        target.find('.digit-con:nth-last-child(3n+4)').after("<span class='comma'>,</a>");
    }
    numArray.forEach((num, i) => {
        const increment = target.find('.digit-con').outerHeight();
        target.find(`.digit${i}`).delay(i * 300).animate({ top: -((increment * num) + (increment * 10)) }, defaults.speed, 'linear');
    });
}
export const displayStats = (clientName, storage, storagePath) => {
    const reference = storageRef(storage, `data/${storagePath}/overallStats.json`);
    const openingSentence = storagePath === 'maui'
        ? 'On the Maui trip'
        : 'Since we started hanging out on Jiu\'s 22nd birthday';
    getDownloadURL(reference)
        .then((url) => {
            $.getJSON(url, (data) => {
                $('.introBlurb0').html(`Hi ${clientName}! ${openingSentence}, we uploaded <span class='userNumBar0'></span><span class='userImgNumBar'></span>`
                    + '</span> pictures to our shared album.').promise().done(() => {
                    $('.introBlurb0').fadeIn(4000, () => {
                        $('.introBlurb1').html("You uploaded <span class='userNumBar1'></span><span class='userImgNumBar'></span> pictures,").promise().done(() => {
                            $('.introBlurb1').fadeIn(3000, () => {
                                $('.introBlurb2').html("and appeared in <span class='userNumBar2'></span><span class='userImgNumBar'></span>.<br>").promise().done(() => {
                                    $('.introBlurb2').fadeIn(4000, () => {
                                        $('.introBlurb3').html("Let's take a look at some of them.").promise().done(() => {
                                            $('.introBlurb3').fadeIn(2000, () => {
                                                $('.introBlurb4').html(
                                                    `<s>if you had a UX engineer you wouldn't need this section</s><br>
                                                    How to explore this webapp!<br>
                                                    This is an arrow key friendly household. No love for AWSD.
                                                    <ul>
                                                        <li>You can use the up and down arrow key (or scroll) to navigate between sections.</li>
                                                        <li>Once an image is displayed, you can use the left and right arrow keys to move through the slideshow.</li>
                                                    </ul>`
                                                ).promise().done(()=> {
                                                    setTimeout(() => {
                                                        $('.introBlurb4').fadeIn(1000);
                                                    }, 200);
                                                })
                                            });
                                        });
                                    });
                                    counterControl($('.userNumBar2'), data[clientName].asSubject);
                                });
                            });
                            counterControl($('.userNumBar1'), data[clientName].asPhototaker);
                        });
                    });
                    counterControl($('.userNumBar0'), data.total);
                });
            });
        });
};
