(function() {
    var canvas = document.getElementById('canvas3');
    var context = canvas.getContext('2d');
    var fps = 60;
    var mouse = { x: 0, y: 0, is_down: true };
    var factor = 1.1;
    var viewport = { x: 0, y: 0, scale: 1 };
    var drag = { x: 0, y: 0, dx: 0, dy: 0 };
    var scale_limits = { min: 1, max: 1 };

    var image = new Image();
    image.onload = function () {
        viewport = { x: 0, y: 0, scale: image.width / canvas.width };
        scale_limits.max = viewport.scale;

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
        new_scale = limit_value(new_scale, scale_limits.min, scale_limits.max);

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
        viewport.x = limit_value(viewport.x, 0, image.width - canvas.width * viewport.scale);
        viewport.y = limit_value(viewport.y, 0, image.height - canvas.height * viewport.scale);

        if (mouse.is_down) {
            drag.dx = (drag.x - mouse.x) * viewport.scale;
            drag.dx = limit_value(drag.dx, -viewport.x, image.width - viewport.x - canvas.width * viewport.scale);
            drag.dy = (drag.y - mouse.y) * viewport.scale;
            drag.dy = limit_value(drag.dy, -viewport.y, image.height - viewport.y - canvas.height * viewport.scale);
        }
    }

    function draw() {
        context.drawImage(image,
            viewport.x + drag.dx, viewport.y + drag.dy, canvas.width * viewport.scale, canvas.height * viewport.scale,
            0, 0, canvas.width, canvas.height);
    }

    function limit_value(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
})();
