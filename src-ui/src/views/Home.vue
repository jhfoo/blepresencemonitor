<template>
  <div class="home">
    <div>Bluetooth status</div>
    <div>Power: {{BleState.isPowered}}</div>
    <div>Scanning: {{BleState.isScanning}} <a href="#" @click="onStartScanning">Start</a> | <a href="#" @click="onStopScanning">Stop</a></div>
    <div>Peripherals <a href="#" @click="onGetPeripherals">Get</a></div>
    <table>
      <tr>
        <td>Id</td>
        <td>LocalName</td>
        <td>ManufacturerId</td>
        <td>RSSI</td>
        <td>Services</td>
        <td>Action</td>
      </tr>
      <tr v-for="peri in peripherals">
        <td>{{peri.data.id}}</td>
        <td>{{peri.data.advertisement.localName}}</td>
        <td>{{peri.data.advertisement.manufacturerId}}</td>
        <td>{{peri.data.rssi}}</td>
        <td>{{peri.data.advertisement.ServiceUuids}}</td>
        <td><a href="#" @click="onTrackPeripheral(peri.data.id)">Track</a></td>
      </tr>
    </table>
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
  // @ is an alias to /src
  import HelloWorld from '@/components/HelloWorld.vue';
  import axios from 'axios';

  export default {
    name: 'home',
    components: {
      HelloWorld
    },
    data: () => {
      return {
        BleState: {},
        peripherals: []
      }
    },
    mounted: function () {
      this.updateState();
    },
    methods: {
      onTrackPeripheral(id) {
        console.log('PeriId: %s', id);
        axios.get('http://192.168.0.12:8081/ble/peripheral/track/' + id)
          .then((resp) => {
            console.log(resp.data);
          })
          .catch((err) => {
            console.log(err);
          })
        return false;
      },
      onGetPeripherals: function () {
        console.log('onGetPeripherals()');
        axios.get('http://192.168.0.12:8081/ble/peripheral/all')
          .then((resp) => {
            console.log(resp.data);
            this.peripherals = Object.values(resp.data.data);
          })
          .catch((err) => {
            console.log(err);
          })
        return false;
      },
      onStartScanning: function () {
        console.log('onStartScanning()');
        axios.get('http://192.168.0.12:8081/ble/start')
          .then((resp) => {
            console.log(resp.data);
            this.updateState();
          })
          .catch((err) => {
            console.log(err);
          })
        return false;
      },
      onStopScanning: function () {
        console.log('onStopScanning()');
        axios.get('http://192.168.0.12:8081/ble/stop')
          .then((resp) => {
            console.log(resp.data);
            this.updateState();
          })
          .catch((err) => {
            console.log(err);
          })
        return false;
      },
      updateState: function () {
        axios.get('http://192.168.0.12:8081/ble/state')
          .then((resp) => {
            this.BleState = {
              isPowered: resp.data.data.state === 'poweredOn',
              isScanning: resp.data.data.isScanning
            };
            console.log(resp.data);
          })
          .catch((err) => {
            console.log(err);
          })
      }
    }
  }

</script>
