(function() {
    var canvas = document.getElementById('canvas2');
    var context = canvas.getContext('2d');
    var fps = 60;
    var mouse = { x: 0, y: 0, is_down: false };
    var factor = 1.1;
    var viewport = { x: 0, y: 0, scale: 1 };
    var drag = { x: 0, y: 0, dx: 0, dy: 0 };

    var image = new Image();
    image.onload = function () {
        viewport = { x: 0, y: 0, scale: image.width / canvas.width };

        canvas.onmousemove = track_mouse;
        canvas.onwheel = zoom;
        canvas.onmousewheel = zoom;
        canvas.onmousedown = start_drag;
        canvas.onmouseup = stop_drag;
        canvas.onmouseout = stop_drag;

        setInterval(function() {
            update();
            draw();
        }, 1000/fps);
    };
    image.src = 'https://www.nasa.gov/sites/default/files/images/159427main_image_feature_666_ys_full.jpg';

    function track_mouse(event) {
        let rectangle = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rectangle.left;
        mouse.y = event.clientY - rectangle.top;
    }

    function zoom(event) {
        let direction = event.deltaY / Math.abs(event.deltaY);
        let new_scale = viewport.scale * Math.pow(factor, direction);

        viewport.x = (viewport.x + mouse.x * viewport.scale) - mouse.x * new_scale;
        viewport.y = (viewport.y + mouse.y * viewport.scale) - mouse.y * new_scale;
        viewport.scale = new_scale;

        event.preventDefault();
    }

    function start_drag(event) {
        drag.x = mouse.x;
        drag.y = mouse.y;
        mouse.is_down = true;
    }

    function stop_drag(event) {
        viewport.x += drag.dx;
        drag.dx = 0;
        viewport.y += drag.dy;
        drag.dy = 0;
        mouse.is_down = false;
    }

    function update() {
        if (mouse.is_down) {
            drag.dx = (drag.x - mouse.x) * viewport.scale;
            drag.dy = (drag.y - mouse.y) * viewport.scale;
        }
    }

    function draw() {
        context.drawImage(image,
            viewport.x + drag.dx, viewport.y + drag.dy, canvas.width * viewport.scale, canvas.height * viewport.scale,
            0, 0, canvas.width, canvas.height);
    }
})();
