/* Changes div content and adds logo and navigation bar */
document.getElementById('navigationDiv').innerHTML = `
<div class="grid-container">
            <div class="grid-item">
                <svg width="112" height="106">
                    <defs>
                        <clipPath id="c3">
                            <circle r="33" cx="33" cy="73" />
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
                    <circle id="circle1" r="33" cx="56" cy="33" fill="rgb(231, 172, 33)" />

                    <!-- Gives circle 2 -->
                    <circle id="circle2" r="33" cx="79" cy="73" fill="rgb(30,61,79)" />

                    <!--Clip circle 3 with circle 1 -->
                    <circle id="circle3" r="33" cx="33" cy="73" fill="rgb(65, 130, 168)" />
                    <circle id="circle1_" r="33" cx="56" cy="33" fill="rgb(231, 172, 33)" clip-path="url(#c3)" />

                    <!--Clip black circle with intersection of left and right, which itself is
                        an intersection already from right and bottom circle -->
                    <circle r="33" cx="56" cy="33" fill="white" clip-path="url(#clip_of_c1_and_c2_and_c3)" />
                </svg>
            </div>

            <div class="grid-item">
                <div class="navigation">
                    <a id="aAbout" href="index.html" style="color: rgb(30,61,79)">About</a>
                    <a id="aPublications" href="publications.html" style="color: rgb(231, 172, 33)">Publications</a>
                    <a id="aCV" href="cv.html" style="color: rgb(231, 172, 33)">CV</a>
                </div>
            </div>
        </div>`;

/* Adds click behavior to navigation logo */
document.getElementById('circle1').addEventListener('click', function (e) {
    window.location = "index.html";
});
document.getElementById('circle1_').addEventListener('click', function (e) {
    window.location = "index.html";
});
document.getElementById('circle2').addEventListener('click', function (e) {
    window.location = "publications.html";
});
document.getElementById('circle3').addEventListener('click', function (e) {
    window.location = "cv.html";
});

/* Mouse hover effects on logo */
document.getElementById('circle1').addEventListener('mouseover', function (e) {
    document.getElementById('circle1_').setAttribute("fill", "rgb(247, 213, 134)");
});
document.getElementById('circle1').addEventListener('mouseleave', function (e) {
    document.getElementById('circle1_').setAttribute("fill", "rgb(231, 172, 33)");

});
document.getElementById('circle1_').addEventListener('mouseover', function (e) {
    document.getElementById('circle1').setAttribute("fill", "rgb(247, 213, 134)");
});
document.getElementById('circle1_').addEventListener('mouseleave', function (e) {
    document.getElementById('circle1').setAttribute("fill", "rgb(231, 172, 33)");
});