/* Changes div content and adds logo and navigation bar */
document.getElementById('navigationDiv').innerHTML = `
<div class="grid-container">
            <div class="grid-item">
                <svg width="112" height="106">
                    <defs>
                        <clipPath id="c3">
                            <circle r="33" cx="33" cy="73"/>
                        </clipPath>

                        <clipPath id="c1">
                            <circle r="33" cx="56" cy="33" />

                        </clipPath>

                        <clipPath id="clip_of_c1_and_c2_and_c3">
                            <circle r="33" cx="56" cy="33" clip-path="url(#clip_of_c2_and_c3)" />
                        </clipPath>

                        <clipPath id="clip_of_c2_and_c3">
                            <circle r="33" cx="79" cy="73" clip-path="url(#c3)" />
                        </clipPath>
                    </defs>
                    <!-- Gives circle 1 -->
                    <circle id="circle1" r="33" cx="56" cy="33" fill="var(--circle1-color)" />

                    <!-- Gives circle 2 -->
                    <circle id="circle2" r="33" cx="79" cy="73" fill="var(--circle2-color)" />

                    <!--Clip circle 3 with circle 1 -->
                    /* NOTE: For circle3 we cheated using a value slightly below 33, s.t. we do not
                    get rendering issues and see a thin line from the boundary of circle 3. Setting the stroke-width to 0
                    does not solve the problem*/
                    <circle id="circle3" r="32.5" cx="33" cy="73" fill="var(--circle3-color)" />
                    <circle id="circle1_" r="33" cx="56" cy="33" fill="var(--circle1-color)" clip-path="url(#c3)" />

                    <!--Clip black circle with intersection of left and right, which itself is
                        an intersection already from right and bottom circle -->
                    <circle r="33" cx="56" cy="33" fill="var(--main-bg-color)" clip-path="url(#clip_of_c1_and_c2_and_c3)" />
                </svg>
            </div>

            <div class="grid-item">
                <div class="navigation">
                    <a id="aAbout" href="../index.html" style="color: var(--link-color)">About</a>
                    <a id="aPublications" href="../publications.html" style="color: var(--link-color)">Publications</a>
                    <a id="aDemos" href="../demos.html" style="color: var(--link-color)">Demos</a>
                    <a id="aCV" href="../cv.html" style="color: var(--link-color)">CV</a>
                </div>
            </div>
        </div>`;

/* Adds click behavior to navigation logo */
document.getElementById('circle1').addEventListener('click', function (e) {
    window.location = "../index.html";
});
document.getElementById('circle1_').addEventListener('click', function (e) {
    window.location = "../index.html";
});
document.getElementById('circle2').addEventListener('click', function (e) {
    window.location = "../publications.html";
});
document.getElementById('circle3').addEventListener('click', function (e) {
    window.location = "../cv.html";
});

/* Mouse hover effects on logo */
document.getElementById('circle1').addEventListener('mouseover', function (e) {
    document.getElementById('circle1_').setAttribute("fill", "var(--circle-color-hover)");
});
document.getElementById('circle1').addEventListener('mouseleave', function (e) {
    document.getElementById('circle1_').setAttribute("fill", "var(--circle1-color)");

});
document.getElementById('circle1_').addEventListener('mouseover', function (e) {
    document.getElementById('circle1').setAttribute("fill", "var(--circle-color-hover)");
});
document.getElementById('circle1_').addEventListener('mouseleave', function (e) {
    document.getElementById('circle1').setAttribute("fill", "var(--circle1-color)");
});
