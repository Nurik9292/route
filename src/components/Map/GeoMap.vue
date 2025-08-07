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
            mapUrl: 'https://osm.onlinetaxi.ulgam.biz/tile/{z}/{x}/{y}.png',
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
                        this.points = el.layer.getLatLngs();
                        this.createPoint();
                    })
                    this.points = el.layer.getLatLngs();
                    this.createPoint();
                });
             
                map.on('pm:remove', (e) => {
                    this.points = [];
                    this.createPoint();
                });
            } else {
                console.error("Leaflet-Geoman не инициализирован.");
            }
        },

        createPoint() {
            this.$emit('create', this.points);
        }
    },
}
</script>