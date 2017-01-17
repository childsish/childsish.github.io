---
layout: post
title: Zooming on pictures using canvas
categories: javascript
comments: true
---

I was unable to find any good tutorials on how to implement the zooming and panning of images using canvas in html, so I've created this post. Hopefully someone other than myself will find it helpful.

For simplicity I've put all the solution into a single html file. Let's start by setting up the canvas and the basic javascript.

## Drawing an image

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
    image.src = 'https://www.nasa.gov/sites/default/files/images/159427main_image_feature_666_ys_full.jpg';

    function draw() {
        context.drawImage(
            image,
            0, 0, image.width, image.height,
            0, 0, canvas.width, canvas.height
        );
    }
</script>
```

This code will draw an image on the canvas after loading. There are a few personal choices in here that you may want to change. One major one is when to draw to the canvas. I could draw the canvas every time an input event is registered, but I felt that it would be more efficient to create a drawing loop that executed 60 times per second. This was achieved with the lines:

```javascript
setInterval(function() {
    draw();
}, 1000/fps);
```

<canvas id="canvas" width="200" height="200" style="display: block; margin-left: auto; margin-right: auto"></canvas>
Image credit: NASA/JPL-Caltech/STScI<sup>[1]</sup>
<script type="text/javascript">{% include js/canvas-zooming.0.js %}</script>

Now we can start writing the code to zoom in on the image.

## Zooming

First, because we're not doing a computation per event, let's track the x and y positions of the mouse cursor so we always have access to them. To do this, we need to listen to the `onmousemove` event and call a new function to save the mouse position.

```diff
      var fps = 60;
+     var mouse = { x: 0, y: 0 };
```

```diff
      image.onload = function () {
+         canvas.onmousemove = track_mouse;
+         
          setInterval(function() {
              draw();
          }, 1000/fps);
      };
```

```diff
+ function track_mouse(event) {
+     mouse.x = event.clientX - canvas.offsetLeft;
+     mouse.y = event.clientY - canvas.offsetTop;
+ }
```

Now we're ready to start zooming. We need to capture the mouse scroll wheel event if we're going to zoom with the scroll wheel. Apparently this is different for different browsers, so we simply capture both events. We also need to specify a zoom factor and track the current viewport. The viewport will store the current top-left position relative to the image and the current scale to draw the image at in numbers of image pixels per canvas pixels.

```diff
      var mouse = { x: 0, y: 0 };
+     var factor = 1.1;
+     var viewport = { x: 0, y: 0, scale: 1 };
```

```diff
      image.onload = function () {
+         viewport = { x: 0, y: 0, scale: image.width / canvas.width }
+
          canvas.onmousemove = track_mouse;
+         canvas.onwheel = zoom;
+         canvas.onwheelscroll = zoom;

          setInterval(function() {
              draw();
          }, 1000/fps);
      };
```

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

```diff
  function draw() {
      context.drawImage(
          image,
-         0, 0, image.width, image.height,
+         viewport.x, viewport.y, canvas.width * viewport.scale, canvas.height * viewport.scale,
          0, 0, canvas.width, canvas.height
      );
  }
```

We're zooming relative to the position of the mouse cursor so we need to do a little math to get things right. 
1. We find out if the wheel was scrolled up or down (`event.deltaY / Math.abs(event.deltaY)`). Positive is up, negative is down.
2. We calculate the new scale that the viewport will be in (`viewport.scale * Math.pow(factor, direction)`).
3. We find the new position of the viewport by calculating the offset of the mouse in image pixels in the old scale (`mousex * viewport.scale`) adding it to the current image position (`viewport.x + mousex * viewport.scale`) and then subtracting the offset of the mouse in image pixels in the new scale (`(viewport.x + mousex * viewport.scale) - mousex * new_scale`). This is known as **translate**-**scale**-**reverse_translate**.
4. We prevent the normal behaviour of mouse scrolling to stop the page scrolling as well.

Finally, we update the draw function to use the viewport.
 


<canvas id="canvas" width="800" height="800" style="display: block; margin-left: auto; margin-right: auto"></canvas>
Image credit: NASA/JPL-Caltech/STScI<sup>[1]</sup>
<script type="text/javascript">{% include js/canvas-zooming.0.js %}</script>

The full code

```
<canvas id="canvas" width="800" height="800" style="display: block; margin-left: auto; margin-right: auto"></canvas>
<script type="text/javascript">
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var mouse = { x: 0, y: 0 };
    var factor = 1.1;
    var viewport;
    var min_scale;
    var max_scale;

    var image = new Image();
    image.onload = function () {
        min_scale = 1;
        max_scale = image.width / canvas.width;
        viewport = {x: 0, y: 0, scale: max_scale};
        
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
        new_scale = limit_value(new_scale, min_scale, max_scale);
        let new_x = (viewport.x + mousex * viewport.scale) - mousex * new_scale;
        viewport.x = limit_value(new_x, 0, image.width - canvas.width * new_scale);
        let new_y = (viewport.y + mousey * viewport.scale) - mousey * new_scale;
        viewport.y = limit_value(new_y, 0, image.height - canvas.height * new_scale);
        viewport.scale = new_scale;

        event.preventDefault();
    }

    function draw() {
        context.drawImage(image,
                viewport.x, viewport.y, canvas.width * viewport.scale, canvas.height * viewport.scale,
                0, 0, canvas.width, canvas.height);
    }

    function limit_value(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
</script>
```

[1]: https://www.nasa.gov/multimedia/imagegallery/image_feature_666.html
