<template>
    <LMap :use-global-leaflet="true" ref="mapRef" v-model:zoom="defaultZoom" :center="defaultCenter"
         @ready="onMapReady">
            <LTileLayer :url="mapUrl" layer-type="base" name="OpenStreetMap" />
    </LMap>
</template>

<script>
import "@modules/leaflet";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

export default {
    name: 'GeoMap',



    data() {
        return {
            defaultCenter: [37.93585208752015, 58.39120934103419],
            defaultZoom: 13,
            mapUrl: 'http://95.85.127.213:8083/tile/{z}/{x}/{y}.png',
            mapReady: true,
            mapRef:null,
            points: [],
        }
    },

    



    methods: {

        invalidateMapSize() {
            const map = this.$refs.mapRef?.leafletObject;
            if (map) {
                map.invalidateSize();
            }
        },

        fetchPoints() {
            return this.points;
        },

        onMapReady(mapObject) {
            const map = mapObject.leafletObject || this.$refs.mapRef.leafletObject;
           
 
            if (map && map.pm && !this.geomanInitialized) {
                this.geomanInitialized = true;

                map.pm.addControls({
                    position: 'topleft',
                    drawCircleMarker: false,
                    drawMarker: false,
                    drawRectangle: false,
                    drawPolygon: false,
                    drawCircle: false,
                    drawText: false,
                    dragMode: false,
                    cutPolygon: false,
                    rotateMode: false,
                });

                this.mapReady = true;

                map.on('pm:create', (el) => {
                    el.layer.on('pm:edit', (e) => {
                        console.log('Изменнно новая фигура:', e.layer.getLatLngs());
                        this.points = el.layer.getLatLngs();
                    })
                    this.points = el.layer.getLatLngs();
                    console.log('Создана новая фигура:', el.layer.getLatLngs());
                });
             
                map.on('pm:remove', (e) => {
                    this.points = [];
                    console.log('Фигура удалена:', e.layer);
                });
            } else {
                console.error("Leaflet-Geoman не инициализирован.");
            }
        },
    },
}
</script>