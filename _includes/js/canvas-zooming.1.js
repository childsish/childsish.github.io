(function() {
    var canvas = document.getElementById('canvas0');
    var context = canvas.getContext('2d');
    var fps = 60;
    var mouse = { x: 0, y: 0 };
    var factor = 1.1;
    var viewport = { x: 0, y: 0, scale: 1 };

    var image = new Image();
    image.onload = function () {
        viewport = { x: 0, y: 0, scale: image.width / canvas.width };

        canvas.onmousemove = track_mouse;
        canvas.onwheel = zoom;
        canvas.onmousewheel = zoom;

        setInterval(function() {
            draw();
        }, 1000/fps);
    };
    image.src = 'https://www.nasa.gov/sites/default/files/images/159427main_image_feature_666_ys_full.jpg';

    function track_mouse(event) {
        mouse.x = event.clientX - canvas.offsetLeft;
        mouse.y = event.clientY - canvas.offsetTop;
    }

    function zoom(event) {
        let direction = event.deltaY / Math.abs(event.deltaY);
        let new_scale = viewport.scale * Math.pow(factor, direction);

        viewport.x = (viewport.x + mouse.x * viewport.scale) - mouse.x * new_scale;
        viewport.y = (viewport.y + mouse.y * viewport.scale) - mouse.y * new_scale;
        viewport.scale = new_scale;

        event.preventDefault();
    }

    function draw() {
        context.drawImage(image,
            viewport.x, viewport.y, canvas.width * viewport.scale, canvas.height * viewport.scale,
            0, 0, canvas.width, canvas.height);
    }
})();
