# google-streetview-images

Pull google streetview images along a route. With a provided origin and destination, the panorama streetview images from along that route will be downloaded sequentially.

**There is a free quota of roughly 25,000 image requests per day, if using this tool in production you will most likely need to upgrade to a premium account. After you reach the image quota limit you will no longer pull images. If you enter in a very long route you can reach this limit quickly.**

## Sample Usage
```js
function main() {
  new StreetViewImages({
      origin: document.getElementById("origin").value,
      destination: document.getElementById("destination").value,
      apiKey: document.getElementById("apiKey").value,
      onPanoLoaded: function (pano) {
          console.log(pano);
          document.body.appendChild(document.createElement("img"))
              .src = pano.panoUrl
      },
      onError: function (err) {
          console.log(err);
      },
      onComplete: function () {
          console.log("Done pulling images on route");
      }
  });
}
```

## Usages in the wild

[Google Maps Streetview Player](http://www.brianfolts.com/driver/)
