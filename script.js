/* Click events on logo */
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