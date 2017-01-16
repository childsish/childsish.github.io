var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var factor = 1.1;
var level;
var min_scale;
var max_scale;

var image = new Image();
image.onload = function () {
    min_scale = 1;
    max_scale = image.width / canvas.width;
    level = {x: 0, y: 0, scale: max_scale};
    canvas.onwheel = zoom;
    canvas.onmousewheel = zoom;
    draw();
};
image.src = 'https://www.nasa.gov/sites/default/files/images/159427main_image_feature_666_ys_full.jpg';

function zoom(event) {
    let mousex = event.clientX - canvas.offsetLeft;
    let mousey = event.clientY - canvas.offsetTop;
    let direction = event.deltaY / Math.abs(event.deltaY);

    let new_scale = level.scale * Math.pow(factor, direction);
    new_scale = limit_value(new_scale, min_scale, max_scale);
    let new_x = (level.x + mousex * level.scale) - mousex * new_scale;
    new_x = limit_value(new_x, 0, image.width - canvas.width * new_scale);
    let new_y = (level.y + mousey * level.scale) - mousey * new_scale;
    new_y = limit_value(new_y, 0, image.height - canvas.height * new_scale);
    level = {
        x: new_x,
        y: new_y,
        scale: new_scale
    };

    draw();
    event.preventDefault();
}

function draw() {
    context.drawImage(image,
        level.x, level.y, canvas.width * level.scale, canvas.height * level.scale,
        0, 0, canvas.width, canvas.height);
}

function limit_value(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
