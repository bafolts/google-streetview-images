
function StreetViewImages(options) {

    if (!options || !options.apiKey) {
        throw new Error("Must provide an google api key");
    }

    if (!options || !options.origin) {
        throw new Error("Must provide origin");
    }

    if (!options || !options.destination) {
        throw new Error("Must provide destination");
    }

    var self = this;
    var m_sPanoClient = new google.maps.StreetViewService();
    var m_sApiKey = options.apiKey;
    var m_sOrigin = options.origin;
    var m_sDestination = options.destination;
    var m_aPanoImages = [];
    var m_fOnPanoLoaded = options.onPanoLoaded || function(){};
    var m_fOnComplete = options.onComplete || function(){};
    var m_aVertices = [];
    var m_iSensitivity = 50;
    var m_iSpeed = 1000;

    (new google.maps.DirectionsService).route({
        origin: m_sOrigin,
        destination: m_sDestination,
        travelMode: google.maps.TravelMode.DRIVING
        }, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                for (var i = 0, length = result.routes[0].legs.length; i < length; i++) {
                    for (var j = 0, lengthJ = result.routes[0].legs[i].steps.length; j < lengthJ; j++) {
                        for (var k = 0, lengthK = result.routes[0].legs[i].steps[j].lat_lngs.length; k < lengthK; k++) {
                            m_aVertices.push(result.routes[0].legs[i].steps[j].lat_lngs[k])
                        }
                    }
                }
                for (var i = 1, length = m_aVertices.length; i < length; i++) {
                    if (distanceTo(m_aVertices[i], m_aVertices[i - 1]) < .009) {
                        m_aVertices.splice(i--, 1);
                        length--;
                    }
                }
                pullPanoImages();
            } else {
                throw new Error("Error calculating route " + status);
            }
        });

    function toRadians(deg) {
        return deg * (Math.PI / 180)
    }

    function bearingTo(ls, ll) {
        var lat1 = toRadians(ls.lat()),
            lat2 = toRadians(ll.lat()),
            dLon = toRadians(ll.lng()) - toRadians(ls.lng());
        return (Math.atan2(Math.sin(dLon) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)) * 180 / Math.PI + 360) % 360
    }

    function distanceTo(ls, ll) {
        var dLat = toRadians(ll.lat() - ls.lat());
        var dLon = toRadians(ll.lng() - ls.lng());
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(ls.lat())) * Math.cos(toRadians(ll.lat())) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c;
    }

    function pullPanoImages() {
        if (m_aVertices.length) {
            var vertex = m_aVertices.shift();
            m_sPanoClient.getPanoramaByLocation(vertex, m_iSensitivity, function (panoData, status) {
                if (status === "OK") {
                    m_fOnPanoLoaded({
                        panoData: panoData,
                        panoUrl: [
                            "https://maps.googleapis.com/maps/api/streetview?size=640x640",
                            "pano=" + panoData.location.pano,
                            "fov=90",
                            "heading=" + bearingTo(vertex, m_aVertices[0] || vertex),
                            "pitch=0",
                            "key=" + m_sApiKey
                        ].join("&")
                    });
                    setTimeout(function() {
                        pullPanoImages();
                    }, m_iSpeed);
                } else {
                    m_fOnError(new Error(status));
                }
            });
        } else {
            m_fOnComplete();
        }
    }
}

window.StreetViewImages = StreetViewImages;

