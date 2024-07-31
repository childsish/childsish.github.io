---
layout: post
title: Zooming and panning images in HTML canvas
categories: javascript
comments: true
scripts:
 - js/2017-01-16-canvas-zooming/canvas-zooming.0.js
 - js/2017-01-16-canvas-zooming/canvas-zooming.1.js
 - js/2017-01-16-canvas-zooming/canvas-zooming.2.js
 - js/2017-01-16-canvas-zooming/canvas-zooming.3.js
---

I was unable to find any good tutorials on how to implement the zooming and panning of images using canvas in html, so I've created this post. Hopefully someone other than myself will find it helpful.

For simplicity I've put the example solution into a single html file.

## Drawing an image

Let's start by setting up the canvas and the basic javascript.

```html
<canvas id="canvas" width="800" height="800"></canvas>
<script type="text/javascript">
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var fps = 60;

    var image = new Image();
    image.onload = function () {
        setInterval(function() {
            draw();
        }, 1000/fps);
    };
    image.src = 'https://stsci-opo.org/STScI-01HBXSVS5DPAN3RK33M53PG372.png';

    function draw() {
        context.drawImage(
            image,
            0, 0, image.width, image.height,
            0, 0, canvas.width, canvas.height
        );
    }
</script>
```

This code will draw an image on the canvas after it loads. There are a few personal choices in here that you may want to change. One major one is when to draw to the canvas. I could draw the canvas every time an input event is registered, but I felt that it would be more convenient to create a drawing loop that executed 60 times per second. This was achieved with the lines:

```javascript
setInterval(function() {
    draw();
}, 1000/fps);
```

<canvas id="canvas0" width="200" height="200" style="display: block; margin-left: auto; margin-right: auto"> </canvas>
Image credit: NASA/JPL-Caltech/STScI<sup>[1]</sup>

Now we can start writing the code to zoom in on the image.

## Capturing the mouse position

First, because we're not doing a computation per event, let's track the x and y positions of the mouse cursor so we always have access to them. To do this, we need to listen to the `onmousemove` event and call a new function to save the mouse position.

First, we create a new variable to save the mouse position.

```diff
  var fps = 60;
+ var mouse = { x: 0, y: 0 };
```

Then, we create a function to save the position to the variable. This will store the mouse position in the number of pixels from the top-left of the canvas.

```diff
+ function track_mouse(event) {
+     mouse.x = event.clientX - canvas.offsetLeft;
+     mouse.y = event.clientY - canvas.offsetTop;
+ }
```

Finally, we call the function whenever the mouse moves by listening for a `onmousemove` event in the canvas. 

```diff
  image.onload = function () {
+     canvas.onmousemove = track_mouse;
+     
      setInterval(function() {
          draw();
      }, 1000/fps);
  };
```

Now we're ready to start zooming. 

## Zooming

First we create the variables that we need. `factor` is the amount to scale by. `viewport` holds top-left position and scale of the zoomed view. The scale is the number of image pixels per canvas pixels.

```diff
  var mouse = { x: 0, y: 0 };
+ var factor = 1.1;
+ var viewport = { x: 0, y: 0, scale: 1 };
```

We need to capture the mouse scroll wheel event if we're going to zoom with the scroll wheel. Apparently there are two different versions for different browsers, so we simply capture both events.

```diff
  image.onload = function () {
+     viewport = { x: 0, y: 0, scale: image.width / canvas.width }
+
+     canvas.onmousemove = track_mouse;
+     canvas.onwheel = zoom;
+     canvas.onwheelscroll = zoom;

          setInterval(function() {
              draw();
          }, 1000/fps);
      };
```

When the `onwheel` event is captured, we execute this function.

```diff
+ function zoom(event) {
+     let direction = event.deltaY / Math.abs(event.deltaY);
+     let new_scale = viewport.scale * Math.pow(factor, direction);
+
+     viewport.x = (viewport.x + mousex * viewport.scale) - mousex * new_scale;
+     viewport.y = (viewport.y + mousey * viewport.scale) - mousey * new_scale;
+     viewport.scale = new_scale;
+
+     event.preventDefault();
}
```

We're zooming relative to the position of the mouse cursor so we need to do a little math to get things right. 
1. We find out if the wheel was scrolled up or down (`event.deltaY / Math.abs(event.deltaY)`). Positive is up, negative is down.
2. We calculate the new scale that the viewport will be in (`viewport.scale * Math.pow(factor, direction)`). If direction is positive, then factor stays as it is, otherwise it will be inversed and the new scale will be smaller.
3. We find the new position of the viewport by calculating the offset of the mouse in image pixels in the old scale (`mousex * viewport.scale`) adding it to the current image position (`viewport.x + mousex * viewport.scale`) and then subtracting the offset of the mouse in image pixels in the new scale (`(viewport.x + mousex * viewport.scale) - mousex * new_scale`). This is known as **translate**-**scale**-**reverse_translate**.
4. We prevent the normal behaviour of mouse scrolling to stop the page scrolling as well.

Finally, we update the draw function to use the viewport.

```diff
   function draw() {
       context.drawImage(
           image,
-          0, 0, image.width, image.height,
+          viewport.x, viewport.y, canvas.width * viewport.scale, canvas.height * viewport.scale,
           0, 0, canvas.width, canvas.height
       );
   }
```

<canvas id="canvas1" width="200" height="200" style="display: block; margin-left: auto; margin-right: auto"></canvas>
Image credit: NASA/JPL-Caltech/STScI<sup>[1]</sup>

## Panning

Now that we can zoom in, it would be nice to be able to scroll around without having to zoom out and back in again.

Let's update the `mouse` variable to track whether the left-mouse-button is depressed or not and add a variable `drag` to track details of the current drag (if any). 

```diff
- var mouse = { x: 0, y: 0 };
+ var mouse = { x: 0, y: 0, is_down = false };
  var factor = 1.1;
  var viewport = { x: 0, y: 0, scale: 1 };
+ var drag = { x: 0, y: 0, dx: 0, dy: 0 };
```

We listen to the events `onmousedown`, `onmouseup` and `onmouseout` (just in case the mouse leaves the canvas). Because a drag spans several iterations of the drawing loop, we will track it within the loop with a new function called `update`.

```diff
  image.onload = function () {
      viewport = { x: 0, y: 0, scale: image.width / canvas.width }
 
      canvas.onmousemove = track_mouse;
      canvas.onwheel = zoom;
      canvas.onwheelscroll = zoom;
+     canvas.onmousedown = start_drag;
+     canvas.onmouseup = stop_drag;
+     canvas.onmouseout = stop_drag;

      setInterval(function() {
+         update();
          draw();
      }, 1000/fps);
  };
```

We create three new functions to track the dragging status and details. When the mouse button is down, we simply store the position on the canvas where is was clicked. When the mouse button is up, we adjust the viewports position by the drag offset. When the mouse move while the button is down, we calculate how far the move using the following steps:
1. Find out the canvas offset in canvas pixels by subtracting the current position from the drag origin (`drag.x - mouse.x`).
2. Convert the canvas offset to an image offset by multiplying by the scale (`(drag.x - mouse.x) * viewport.scale`). 

```diff
+ function start_drag(event) {
+     drag.x = mouse.x;
+     drag.y = mouse.y;
+     mouse.is_down = true;
+ }
+    
+ function stop_drag(event) {
+     viewport.x += drag.dx;
+     drag.dx = 0;
+     viewport.y = drag.dy;
+     drag.dy = 0;
+     mouse.is_down = false;
+ }
+     
+ function update() {
+     if (mouse.is_down) {
+         drag.dx = (drag.x - mouse.x) * viewport.scale;
+         drag.dy = (drag.y - mouse.y) * viewport.scale;
+     }
+ }
```

Finally, we update the draw function to use the drag offset.

```diff
  function draw() {
      context.drawImage(image,
-         viewport.x, viewport.y, canvas.width * viewport.scale, canvas.height * viewport.scale,
+         viewport.x + drag.dx, viewport.y + drag.dy, canvas.width * viewport.scale, canvas.height * viewport.scale,
          0, 0, canvas.width, canvas.height);
  }
```

<canvas id="canvas2" width="200" height="200" style="display: block; margin-left: auto; margin-right: auto"></canvas>
Image credit: NASA/JPL-Caltech/STScI<sup>[1]</sup>

## Setting limits

We now have a problem with our code. It's possible to zoom out until the image is a spot or zoom in until the image is just a jumble of anti-aliased pixels. We can also pan out of the image. To fix this we need to set limits to the scale and offsets.

First, we create the necessary variables to set limits. It turns out we only need to track the scale limits because we don't know the size of the image until it is loaded.

```diff
  var viewport = { x: 0, y: 0, scale: 1 };
  var drag = { x: 0, y: 0, dx: 0, dy: 0 };
+ var scale_limits = { min: 1, max: 1 };

  var image = new Image();
  image.onload = function () {
      viewport = { x: 0, y: 0, scale: image.width / canvas.width };
+     scale_limits.max = viewport.scale;

      canvas.onmousemove = track_mouse;
```

For convenience, we create a function that takes a value, minimum value and maximum value. This function return the minimum value if the value is below and the maximum value if the value is above.

```diff
+ function limit_value(value, min, max) {
+     return Math.min(max, Math.max(min, value));
+ }
```

Now, we limit the scale value...

```diff
  function zoom(event) {
      let direction = event.deltaY / Math.abs(event.deltaY);
      let new_scale = viewport.scale * Math.pow(factor, direction);
+     new_scale = limit_value(new_scale, scale_limits.min, scale_limits.max);

      viewport.x = (viewport.x + mouse.x * viewport.scale) - mouse.x * new_scale;
      viewport.y = (viewport.y + mouse.y * viewport.scale) - mouse.y * new_scale;
      viewport.scale = new_scale;

      event.preventDefault();
  }
```

...the viewport position and the drag offset.

```diff
  function update() {
+     viewport.x = limit_value(viewport.x, 0, image.width - canvas.width * viewport.scale);
+     viewport.y = limit_value(viewport.y, 0, image.heigh - canvas.height * viewport.scale);
+ 
      if (mouse.is_down) {
          drag.dx = (drag.x - mouse.x) * viewport.scale;
+         drag.dx = limit_value(drag.dx, -viewport.x, image.width - viewport.x - canvas.width * viewport.scale);
          drag.dy = (drag.y - mouse.y) * viewport.scale;
+         drag.dy = limit_value(drag.dy, -viewport.y, image.height- viewport.y - canvas.height * viewport.scale);
      }
  }
```

<canvas id="canvas3" width="200" height="200" style="display: block; margin-left: auto; margin-right: auto"></canvas>
Image credit: NASA/JPL-Caltech/STScI<sup>[1]</sup>

The full code:

```
<canvas id="canvas" width="800" height="800" style="display: block; margin-left: auto; margin-right: auto"></canvas>
<script type="text/javascript">
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
    image.src = 'https://stsci-opo.org/STScI-01HBXSVS5DPAN3RK33M53PG372.png';

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
</script>
```

[1]: https://stsci-opo.org/STScI-01HBXSVS5DPAN3RK33M53PG372.png
