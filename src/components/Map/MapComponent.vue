<template>
    <LMap 
        :use-global-leaflet="false"
        ref="map" 
        v-model:zoom="defaultZoom" 
        :center="defaultCenter"
         @move="log('move')"
         @click="moveIcon"
    >
        <LTileLayer 
            :url="mapUrl" 
            layer-type="base" 
            name="OpenStreetMap"
        />
        <LMarker :lat-lng="icon" draggable @moveend="onMarkerMoveEnd"/>
    </LMap>
</template>

<script>
import "leaflet/dist/leaflet.css";

export default {
    name: 'MapComponent',

    props: {
        initialIcon: {
            type: Object,
            default: () => ({ lat: 37.93585208752015, lng: 58.39120934103419 })
        }
    },

    data() {
        return {
            map: null,
            defaultCenter: [37.93585208752015, 58.39120934103419], 
            defaultZoom: 13, 
            mapUrl: 'https://osm.onlinetaxi.ulgam.biz/tile/{z}/{x}/{y}.png',
            icon: this.initialIcon
        }
    },

    watch: {
        initialIcon() {this.icon = this.initialIcon}
    },

    methods: {
        log( item ) {
        },

        moveIcon(e) {
            this.icon = e.latlng;
            this.$emit('update:icon', this.icon)
        },

        onMarkerMoveEnd(e) {
            this.icon = e.target.getLatLng();
            this.$emit('update:icon', this.icon); 
        }
    }
}
</script>