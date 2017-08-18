(function() {
    var canvas = document.getElementById('canvas0');
    var context = canvas.getContext('2d');
    var fps = 60;

    var image = new Image();
    image.onload = function () {
        setInterval(function() {
            draw();
        }, 1000/fps);
    };
    image.src = 'https://www.nasa.gov/sites/default/files/images/159427main_image_feature_666_ys_full.jpg';

    function draw() {
        context.drawImage(
            image,
            0, 0, image.width, image.height,
            0, 0, canvas.width, canvas.height
        );
    }
})();
